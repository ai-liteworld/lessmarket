# lessmarket — Development Plan

This turns the technical spec (`TECHNICAL SPECIFICATION AI-Driven Dynamic
Marketplace.pdf`) plus the negative-categories addendum
(`docs/ADDENDUM_negative_categories.md`) into an actual sequence of work,
and covers the three things the spec doesn't: how we work with GitHub day
to day, how the LLM/API keys get connected and kept safe, and how we get
from a laptop to a hosted, reachable app.

The spec's own milestone table (section 11) is the backbone — 6 milestones,
~15 weeks. This plan doesn't change that scope; it fills in the connective
tissue between milestones: repo workflow, environments, and deploy targets.

## 0. Where things stand right now

- GitHub repo: [`ai-liteworld/lessmarket`](https://github.com/ai-liteworld/lessmarket),
  `main` branch, currently just `README.md` + `LICENSE`.
- Scaffold delivered in this session: `backend/` (FastAPI skeleton, DB
  models, LLM prompt/client modules, Celery task stubs), `frontend/` (Vite +
  React + Tailwind skeleton, dynamic form, search page), `docker-compose.yml`,
  CI workflow, and this docs set. Route handlers are mostly `TODO`-stubbed —
  the wiring, not the implementation, is done.
- Nothing is deployed anywhere yet. No API keys are configured yet.

## 1. GitHub workflow

**Branching:** `main` stays deployable. Work happens on short-lived branches
per milestone/feature (`feat/schema-generation`, `feat/search-execution`,
`fix/...`), merged via pull request. Since this is a small/solo-adjacent
project, a lightweight trunk-based flow is enough — no need for `develop`/
`release` branches unless the team grows.

**PRs and CI:** The CI workflow already committed
(`.github/workflows/ci.yml`) runs backend tests (`pytest`) and a frontend
build (`vite build`) on every push and PR to `main`. Treat a red CI check as
a hard blocker for merging — it's the cheapest bug you'll ever catch.

**How pushes actually happen:** I can edit files and commit locally into
your `lessmarket` working copy, but I can't push to GitHub myself — this
session doesn't have your GitHub credentials, and your local machine's
sandbox (where the repo lives) has no network access for me to use even if
it did. Two ways to close that loop:

1. **You push.** I commit locally, you run `git push` from your own
   terminal when you're ready. Simplest, no credential sharing.
2. **I push, via a token you provide.** If you generate a GitHub [fine-grained
   personal access token](https://github.com/settings/tokens) scoped to just
   this repo and paste it into this session, I can clone the repo into my
   own workspace (which does have network access), commit, and push/open
   PRs directly using `gh`. Only do this if you're comfortable with a
   session holding a repo-scoped token for its duration — revoke it
   afterward if so.

For this first scaffold, I've committed locally to your working copy (see
the task list) — you push when ready, or hand me a token if you'd rather I
drive it directly going forward.

**Secrets:** Never commit `.env`. Repo secrets for CI/CD (`OPENAI_API_KEY`,
AWS credentials, etc., once needed there) go in GitHub → Settings → Secrets
and variables → Actions, not in workflow files.

## 2. Connecting to the LLM (OpenAI)

1. Create an API key at platform.openai.com, on a project/org with billing
   set up (GPT-4o calls aren't free, and the spec's caching strategy in
   section 4.4 exists specifically to keep this cost bounded).
2. Put it in your local `.env` as `OPENAI_API_KEY` (never in code, never
   committed — `.gitignore` already excludes `.env`).
3. `backend/app/llm/client.py` reads it via `app/core/config.py`
   (`pydantic-settings`, loads from `.env` automatically).
4. Set a spending limit / usage alert in the OpenAI dashboard before doing
   any real testing — a bug in a retry loop against an LLM endpoint can run
   up a bill fast.
5. Rate limiting: the spec already calls for 100 req/min per user
   (section 12) at the API layer; that also caps worst-case LLM spend per
   user.

I checked Claude's connector registry for a direct OpenAI/GitHub MCP
connector to make this smoother — neither exists as an installable
connector today, so API-key-in-`.env` (backend) is the straightforward
path. Two adjacent connectors *do* exist and are worth considering later:
**AWS MCP** (lets me call AWS APIs directly from a session — handy once
you're setting up S3/EKS) and **Cloudinary** (matches the spec's optional
image-processing tool directly). I can pull up connection details for
either if useful.

## 3. Environments

Three tiers, matching what most of the spec's own milestones assume:

| Environment | Where | Purpose |
|---|---|---|
| Local | `docker compose up` on your machine | Day-to-day development |
| Staging | Cheap single-instance deploy (see 4.1) | Sanity-check before prod, demo to others |
| Production | Full spec target (see 4.2) | Real users |

Each has its own `.env` / secrets — never reuse a production `OPENAI_API_KEY`
or `JWT_SECRET` in local dev.

## 4. Hosting & deployment — staged, not all-at-once

The spec locks AWS EKS + Kubernetes as the production target (section 9),
and that's the right call at real scale (10k concurrent users, section 12).
But standing up EKS on day one, before there's a working app to put on it,
is wasted motion. Recommended staging:

### 4.1 Fast path first (Milestones M1–M4)

Get something *running and reachable* early, on infrastructure that takes
minutes to set up, so the LLM flows can be tested against a real deployed
backend, not just localhost:

- **Frontend:** static Vite build → **Vercel** or **Cloudflare Pages** (both
  have zero-config GitHub integration: push to `main`, it deploys).
- **Backend + Celery + Postgres + Redis:** a single **Railway** or
  **Fly.io** project, or one EC2/Lightsail box running the existing
  `docker-compose.yml` as-is. Postgres there should still be
  `pgvector/pgvector:pg15` (already in `docker-compose.yml`) so the schema
  doesn't change when you move to production.
- This whole tier can be stood up in under an hour and costs roughly nothing
  at dev traffic levels.

### 4.2 Production path (Milestone M6, per spec section 9)

Once M1–M5 are functionally done and it's time for the real deployment:

1. **Containerize** (already scaffolded: `backend/Dockerfile`,
   `frontend/Dockerfile`).
2. **AWS foundations:** S3 bucket (image storage), RDS-or-self-managed
   Postgres with pgvector (spec assumes self-managed via the official image
   with the extension — confirm RDS supports the pgvector extension in your
   target region, or run Postgres on EKS/EC2 instead), ElastiCache or
   in-cluster Redis.
3. **EKS cluster**, namespace `marketplace` (spec 9.2), one Deployment +
   Service per component (`frontend-service`, `backend-service`,
   `redis-service`, `postgres-service`), ALB Ingress with TLS, HPA on CPU
   (target 70%).
4. **CI/CD:** extend `.github/workflows/ci.yml` with a deploy job — build
   and push images to ECR, apply manifests (`infra/k8s/`, not yet created —
   scheduled for this phase) via `kubectl` or a GitOps tool (Argo CD is a
   reasonable default if the team wants one).
5. **Monitoring/logging:** Prometheus + Grafana + Sentry, ELK — spec
   section 10 gives the concrete alert thresholds to wire up.

I flagged the **AWS MCP connector** above because if you connect it, I can
call AWS APIs (create the S3 bucket, inspect the EKS cluster, etc.)
directly from a session instead of you copy-pasting AWS CLI commands I give
you. Not required, just faster once you're at this phase.

## 5. Milestone-by-milestone plan (maps to spec section 11)

| Milestone | What "done" looks like | This session's scaffold covers |
|---|---|---|
| M1: Core Backend | Postgres schema live, JWT auth working end-to-end, S3 presigned upload working | Models, auth routes, DB init script — done. S3 presign — `TODO` in `ads.py`. |
| M2: LLM Integration | `/api/ads/schema` and `/api/search/filters` return real, cached LLM output including negative categories | Prompts, client, Pydantic validation — done. `schema_cache` read-through — `TODO`. |
| M3: Frontend MVP | Seller can generate+fill a dynamic form, buyer can search and see results | `DynamicForm`, `SellPage`, `SearchPage` — done as a working skeleton; needs the real POST-to-create-ad wiring. |
| M4: Search & Vector | Real pgvector similarity + JSONB filters + exclusion logic (addendum) + 70/30 ranking | Route stub with the full step list documented — implementation is the M4 work itself. |
| M5: Background Jobs | Nightly promotion job running on a schedule, image pipeline processing uploads | Celery app, beat schedule, task stubs — done; task bodies are `TODO`. |
| M6: Deployment & Testing | Fast-path hosting live (4.1) at minimum; AWS/EKS (4.2) if scope allows in 15 weeks | Docker + CI done; `infra/k8s/` not started. |

## 6. Suggested immediate next steps

1. You review the scaffold (sent this session) and the negative-categories
   addendum — flag anything that doesn't match what you meant.
2. Push the scaffold commit to GitHub (or hand me a token to do it).
3. Get an `OPENAI_API_KEY` and confirm `docker compose up` runs locally end
   to end (health check + a real `/api/ads/schema` call).
4. Pick a fast-path host (4.1) and I'll walk you through standing it up.
5. From there we work milestone by milestone — tell me which route/feature
   to actually implement next (my recommendation: finish M1's S3 upload +
   M2's schema-cache read-through together, since M3's frontend needs both
   to be useful for a real test).

I'll keep this plan updated as we go rather than treating it as fixed —
ping me to revise it whenever scope or the hosting choice changes.
