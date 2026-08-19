"""
Ads table.

Extends spec section 3.2 with `excluded_category_paths`: categories the LLM
identified as commonly-confused-with-this-item during schema generation
(spec addendum — see docs/ADDENDUM_negative_categories.md). Search execution
uses this to keep near-miss semantic matches out of results for OTHER items,
the same way `filters` narrows results FOR this item.
"""
import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import String, Text, Numeric, DateTime, func, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Ad(Base):
    __tablename__ = "ads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")  # active, sold, expired, deleted

    category_path: Mapped[str] = mapped_column(Text, nullable=False)  # e.g. "Vehicles > Bicycles > Mountain Bikes"
    excluded_category_paths: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=list)

    specs: Mapped[dict] = mapped_column(JSONB, nullable=False)  # LLM-generated + user-added
    user_added_fields: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=list)

    embedding: Mapped[list[float] | None] = mapped_column(Vector(1536), nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped["DateTime"] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped["DateTime"] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
