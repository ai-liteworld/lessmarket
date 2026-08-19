"""Image processing pipeline (spec 6.2)."""
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.image_processing.process_uploaded_image")
def process_uploaded_image(file_key: str):
    # 1. Download from S3
    # 2. Generate thumbnails (100x100, 400x400, 800x800)
    # 3. Upload thumbnails back to S3
    # 4. Optionally run a vision model (CLIP) to extract tags
    # 5. Update database with URLs
    raise NotImplementedError
