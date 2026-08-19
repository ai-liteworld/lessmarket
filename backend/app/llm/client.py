"""
Thin LangChain wrapper used by the ads/search routes, talking to Hugging
Face's Inference Providers router (an OpenAI-compatible endpoint) via
langchain-openai's ChatOpenAI client pointed at a different base_url. Keeps
JSON parsing + the schema_cache read-through in one place so the route
handlers stay simple.
"""
import json
import re

from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.llm.prompts import BUYER_FILTER_SYSTEM_PROMPT, SELLER_SCHEMA_SYSTEM_PROMPT
from app.schemas.llm import FilterGenerationResult, SchemaGenerationResult

settings = get_settings()

_llm = ChatOpenAI(
    model=settings.LLM_MODEL,
    api_key=settings.HF_TOKEN or "unused",
    base_url=settings.LLM_BASE_URL,
    timeout=settings.LLM_REQUEST_TIMEOUT_SECONDS,
)


def _parse_json(content: str) -> dict:
    """Best-effort JSON extraction. Unlike OpenAI, not every open model/
    provider behind the HF router honors a strict JSON response_format, so
    strip markdown code fences / stray prose and grab the first {...} block
    before parsing, instead of assuming the response is pure JSON."""
    text = content.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE)
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if match:
        text = match.group(0)
    return json.loads(text)


def generate_seller_schema(description: str) -> SchemaGenerationResult:
    response = _llm.invoke(
        [
            {"role": "system", "content": SELLER_SCHEMA_SYSTEM_PROMPT},
            {"role": "user", "content": description},
        ]
    )
    return SchemaGenerationResult.model_validate(_parse_json(response.content))


def generate_buyer_filters(query: str) -> FilterGenerationResult:
    response = _llm.invoke(
        [
            {"role": "system", "content": BUYER_FILTER_SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ]
    )
    return FilterGenerationResult.model_validate(_parse_json(response.content))
