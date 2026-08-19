"""
Twilio Verify wrapper for phone-number OTP signup activation.

Uses Twilio's Verify API rather than raw SMS sending: Verify generates,
stores, expires, and rate-limits the one-time code for us, so this module
only needs two calls (send / check) and no OTP storage of our own.

SMS_MOCK_MODE lets the whole signup -> OTP -> activate flow be built and
tested with zero SMS cost before a Twilio account exists: when enabled,
send_otp() is a no-op and check_otp() accepts settings.SMS_MOCK_CODE. Flip
it off (and set the three TWILIO_* env vars) to send real messages.
"""
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

from app.core.config import get_settings

settings = get_settings()

_client: Client | None = None
if not settings.SMS_MOCK_MODE and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
    _client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


class SmsError(RuntimeError):
    """Raised when an OTP can't be sent/checked (bad config, Twilio error, etc.)."""


def send_otp(phone: str) -> None:
    if settings.SMS_MOCK_MODE:
        return
    if _client is None:
        raise SmsError("SMS is not configured: set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN, or enable SMS_MOCK_MODE")
    try:
        _client.verify.v2.services(settings.TWILIO_VERIFY_SERVICE_SID).verifications.create(
            to=phone, channel="sms"
        )
    except TwilioRestException as exc:
        raise SmsError(f"Failed to send OTP: {exc.msg}") from exc


def check_otp(phone: str, code: str) -> bool:
    if settings.SMS_MOCK_MODE:
        return code == settings.SMS_MOCK_CODE
    if _client is None:
        raise SmsError("SMS is not configured: set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN, or enable SMS_MOCK_MODE")
    try:
        check = _client.verify.v2.services(settings.TWILIO_VERIFY_SERVICE_SID).verification_checks.create(
            to=phone, code=code
        )
    except TwilioRestException as exc:
        # Twilio raises (rather than returning a "denied" status) for some
        # invalid/expired-code cases depending on account config - treat
        # that as "not verified" rather than a 500.
        raise SmsError(f"OTP check failed: {exc.msg}") from exc
    return check.status == "approved"
