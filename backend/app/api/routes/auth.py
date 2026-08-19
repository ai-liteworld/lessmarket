"""
Phone-first auth (phase 2): sign up with phone + password, activate via SMS
OTP (Twilio Verify, or SMS_MOCK_MODE for zero-cost local/dev testing), then
log in with phone + password. Email is optional profile info only.
"""
import re
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import AfterValidator, BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.core.sms import SmsError, check_otp, send_otp
from app.db.session import get_db
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Require E.164 format (+countrycode number, e.g. +962791234567) - this is
# also what Twilio Verify expects, so validating it here gives a clear 422
# instead of an opaque Twilio error later.
_E164_RE = re.compile(r"^\+[1-9]\d{7,14}$")


def _validate_phone(value: str) -> str:
    value = value.strip()
    if not _E164_RE.match(value):
        raise ValueError("Phone must be in E.164 format, e.g. +962791234567")
    return value


# Shared, reusable field type: Annotated + AfterValidator is the Pydantic v2
# way to apply the same validation to a field across multiple models without
# repeating (or subtly mis-wiring) a @field_validator in each class body.
PhoneStr = Annotated[str, AfterValidator(_validate_phone)]


class SignupRequest(BaseModel):
    phone: PhoneStr
    password: str
    full_name: str
    email: EmailStr | None = None
    location: str | None = None


class VerifyOtpRequest(BaseModel):
    phone: PhoneStr
    code: str


class ResendOtpRequest(BaseModel):
    phone: PhoneStr


class LoginRequest(BaseModel):
    phone: PhoneStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SignupResponse(BaseModel):
    message: str
    phone: str


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone already registered")
    if payload.email and db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        id=uuid.uuid4(),
        phone=payload.phone,
        phone_verified=False,
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        location=payload.location,
    )
    db.add(user)
    db.commit()

    try:
        send_otp(payload.phone)
    except SmsError as exc:
        # Roll back the user row too: an account nobody can activate is
        # worse than a signup that visibly failed and can be retried clean.
        db.delete(user)
        db.commit()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return SignupResponse(message="OTP sent", phone=payload.phone)


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == payload.phone).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No signup in progress for this phone")

    try:
        approved = check_otp(payload.phone, payload.code)
    except SmsError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    if not approved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired code")

    user.phone_verified = True
    db.commit()
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/resend-otp", status_code=status.HTTP_204_NO_CONTENT)
def resend_otp(payload: ResendOtpRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == payload.phone).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No signup in progress for this phone")
    if user.phone_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone already verified")
    try:
        send_otp(payload.phone)
    except SmsError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == payload.phone).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.phone_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Phone not verified yet")
    return TokenResponse(access_token=create_access_token(str(user.id)))
