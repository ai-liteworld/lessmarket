# lessmarket

A marketplace without the fuzz — an LLM-driven marketplace with no fixed
category schemas. Sellers describe an item in plain text and the LLM
generates the spec form; buyers search in plain text and the LLM generates
structured filters (including *negative* filters/categories that keep
near-miss matches out of results). Full architecture in
[`TECHNICAL SPECIFICATION AI-Driven Dynamic Marketplace.pdf`](../TECHNICAL%20SPECIFICATION%20AI-Driven%20Dynamic%20Marketplace.pdf)
and the addendum in [`docs/ADDENDUM_negative_categories.md`](docs/ADDENDUM_negative_categories.md).

## Stack

React 18 + Vite + Tailwind (frontend) · FastAPI + LangChain + OpenAI (backend)
· PostgreSQL 15 + pgvector (data + vector search) · Celery + Redis (async jobs)
· Docker / Kubernetes (deployment). Full rationale in the spec, section 2.

## Getting started (local dev)

```bash
cp .env.example .env        # fill in OPENAI_API_KEY at minimum
docker compose up --build
```

- Backend: http://localhost:8000 (docs at `/docs`)
- Frontend: http://localhost:5173
- Postgres: localhost:5432 · Redis: localhost:6379

Or run each side natively — see `docs/DEVELOPMENT_PLAN.md` for the
non-Docker workflow.

## Project layout

```
backend/    FastAPI app, SQLAlchemy models, LLM prompts/client, Celery tasks
frontend/   React + Vite app, dynamic form/search UI
docs/       Development plan and spec addenda
infra/      Deployment manifests (added in the deployment phase)
```

## Docs

- [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) — phased plan: local dev, GitHub workflow, LLM integration, hosting/deployment.
- [`docs/ADDENDUM_negative_categories.md`](docs/ADDENDUM_negative_categories.md) — the negative-category/exclusion-filter extension to the LLM prompts and schemas.
