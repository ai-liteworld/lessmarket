"""
Thin LangChain/OpenAI wrapper used by the ads/search routes. Keeps
JSON-mode + parsing + the schema_cache read-through in one place so the
route handlers stay simple.
"""
import json

from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.llm.prompts import BUYER_FILTER_SYSTEM_PROMPT, SELLER_SCHEMA_SYSTEM_PROMPT
from app.schemas.llm import FilterGenerationResult, SchemaGenerationResult

settings = get_settings()

_llm = ChatOpenAI(
    model=settings.OPENAI_MODEL,
    api_key=settings.OPENAI_API_KEY or None,
    timeout=settings.LLM_REQUEST_TIMEOUT_SECONDS,
    model_kwargs={"response_format": {"type": "json_object"}},
)


def generate_seller_schema(description: str) -> SchemaGenerationResult:
    response = _llm.invoke(
        [
            {"role": "system", "content": SELLER_SCHEMA_SYSTEM_PROMPT},
            {"role": "user", "content": description},
        ]
    )
    return SchemaGenerationResult.model_validate(json.loads(response.content))


def generate_buyer_filters(query: str) -> FilterGenerationResult:
    response = _llm.invoke(
        [
            {"role": "system", "content": BUYER_FILTER_SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ]
    )
    return FilterGenerationResult.model_validate(json.loads(response.content))
