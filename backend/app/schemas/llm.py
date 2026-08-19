"""
Pydantic models for LLM structured outputs. These are the runtime-validated
shapes behind the JSON returned by the prompts in app/llm/prompts.py.

Extended per docs/ADDENDUM_negative_categories.md: both the seller schema
response and the buyer filter response now carry negative/exclusion
information alongside the positive category + specs/filters, so the LLM
does double duty — it says what an item/query IS, and what it's commonly
mistaken for (so search can rule those out).
"""
from typing import Literal

from pydantic import BaseModel, Field

FieldType = Literal["text", "number", "select", "boolean", "date"]


class SpecField(BaseModel):
    key: str
    label: str
    type: FieldType
    options: list[str] | None = None


class SchemaGenerationResult(BaseModel):
    """Response shape for POST /api/ads/schema (spec 4.1)."""

    category_path: str
    required_specs: list[SpecField]
    optional_specs: list[SpecField]
    # ADDENDUM: categories this item is commonly confused with / miscategorized
    # under, e.g. "mountain bike" -> excludes "Fitness > Exercise Bikes".
    excluded_category_paths: list[str] = Field(default_factory=list)


class FilterGenerationResult(BaseModel):
    """Response shape for POST /api/search/filters (spec 4.2)."""

    category_path: str
    filters: dict[str, str | float | int | bool]
    refinement_options: list[SpecField]
    # ADDENDUM: categories that look related by keyword/embedding similarity
    # but should be excluded from results for this query, e.g. "waterproof
    # jacket" -> excludes "Camping > Tents" even though "waterproof" matches.
    excluded_categories: list[str] = Field(default_factory=list)
    # ADDENDUM: key/value pairs that should NOT match, layered on top of
    # `filters` (which says what SHOULD match), e.g. {"condition": "for parts"}
    negative_filters: dict[str, str | float | int | bool] = Field(default_factory=dict)
