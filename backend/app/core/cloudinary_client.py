"""
Cloudinary signed direct-to-cloud upload helper.

The browser uploads image bytes straight to Cloudinary (never through our
free-tier Render backend, which has limited request size/time budget); the
backend's only job is to hand out a short-lived signature so the upload
request is provably authorized by us. See:
POST /api/ads/{ad_id}/upload-signature in app/api/routes/ads.py.
"""
import time

import cloudinary
import cloudinary.utils

from app.core.config import get_settings

settings = get_settings()

if settings.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


class CloudinaryNotConfigured(RuntimeError):
    pass


def build_upload_signature(folder: str) -> dict:
    """Return everything the frontend needs to POST a file directly to
    Cloudinary's unsigned-from-the-browser-but-signed-by-us upload endpoint."""
    if not settings.CLOUDINARY_CLOUD_NAME:
        raise CloudinaryNotConfigured(
            "Cloudinary is not configured: set CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET"
        )
    timestamp = int(time.time())
    params_to_sign = {"timestamp": timestamp, "folder": folder}
    signature = cloudinary.utils.api_sign_request(params_to_sign, settings.CLOUDINARY_API_SECRET)
    return {
        "cloud_name": settings.CLOUDINARY_CLOUD_NAME,
        "api_key": settings.CLOUDINARY_API_KEY,
        "timestamp": timestamp,
        "folder": folder,
        "signature": signature,
        "upload_url": f"https://api.cloudinary.com/v1_1/{settings.CLOUDINARY_CLOUD_NAME}/image/upload",
    }
