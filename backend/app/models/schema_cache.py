"""
Schema cache table (spec section 3.6 + 4.4), extended with negative-category
fields produced by the LLM (see docs/ADDENDUM_negative_categories.md):

- schema_json.excluded_category_paths  (seller flow)
- filter_json.excluded_categories / negative_filters  (buyer flow)

These live inside the existing JSONB columns rather than as new columns,
since schema_cache is a transient cache keyed by trigger text, not a
queried-by-field table like `ads`.
"""
import uuid

from sqlalchemy import Text, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class SchemaCache(Base):
    __tablename__ = "schema_cache"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trigger_text: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    schema_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    filter_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    last_used: Mapped["DateTime"] = mapped_column(DateTime(timezone=True), server_default=func.now())
    use_count: Mapped[int] = mapped_column(Integer, default=1)
