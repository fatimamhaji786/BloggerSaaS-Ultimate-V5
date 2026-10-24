# Flashcards AI — Development Integration Plan

Status: development-only code preparation. Not deployed and not connected to the published Blogger tool.

## Repository isolation
- Work branch: `feature/flashcards-ai-dev`
- Base: `v5.1.14-dev`
- Do not merge this branch into production or deploy it to the production Worker.
- Production Worker entry point `worker/worker/worker.js` is not modified by this development work.

## Existing gateway findings
- The production Worker already has `POST /api/ai`.
- That endpoint requires a valid Firebase ID token and reads the Gemini API key from the server-side `GEMINI_API_KEY` secret.
- The public Flashcards Generator intentionally has no user login. Calling `/api/ai` directly from the public Blogger page would therefore fail authentication unless a separate safe public flow is implemented.
- Do not place `GEMINI_API_KEY`, `AI_PROXY_TOKEN`, Firebase service credentials, or any shared secret in Blogger HTML/JavaScript.

## Development-only files
- `worker/worker/flashcards-ai-dev-draft.js`: isolated request handler. Enforces the exact allowed Blogger origin, POST/OPTIONS handling, request-size and source-text limits, card-count limits, server-side Turnstile verification, mandatory rate-limit binding, server-side Gemini calls, and response schema checks.
- `worker/worker/flashcards-ai-dev-worker.js`: separate Worker entry point. It exposes only `/api/flashcards-ai`, `/api/health`, and `/api/version`; it does not import or route through the production Worker entry point.
- These files are development code only. They are not deployed by this commit and are not connected to the published Blogger page.

## Required development configuration before testing
1. Create/deploy a distinct Cloudflare Worker named `bloggersaas-ai-proxy-v514-dev` with entry point `worker/worker/flashcards-ai-dev-worker.js`. Do not replace or redeploy the production Worker.
2. Set `FLASHCARDS_ALLOWED_ORIGIN` to exactly `https://freeunlimitedmultitools.blogspot.com`.
3. Add `TURNSTILE_SECRET_KEY` as an encrypted development Worker secret. Never commit it or put it in Blogger code.
4. Configure the `FLASHCARDS_LIMITER` rate-limiting binding with conservative per-IP limits. The endpoint fails closed if this binding is absent or unavailable.
5. Configure a server-side `GEMINI_API_KEY` secret for the development Worker and optionally `GEMINI_MODEL`. Do not copy secrets into GitHub.
6. Use the public Turnstile site key only on a development-only test page. Do not edit the published Blogger tool until validation passes.
7. Verify that the development Worker uses its own settings and does not change production bindings, secrets, routes, or deployment.

## Validation checklist (must pass before Blogger integration)
- Missing/invalid Turnstile token is rejected.
- Disallowed Origin is rejected.
- Missing or oversized input is rejected.
- Requests above the configured rate limit receive 429.
- Valid challenge + allowed origin returns schema-valid flashcards.
- Provider 401/403/404/429/5xx errors are handled safely.
- No secret, challenge token, or user source text appears in logs or responses.
- Production `/api/ai`, `/api/health`, `/api/version`, and production behavior remain unchanged.
- Test using a development-only page and short, non-sensitive sample text before editing the published Blogger tool.
- Confirm the local/fallback flashcard generator still works when AI is unavailable.

## Current result
The development-only entry point and request handler are committed on `feature/flashcards-ai-dev`. The handler has not been runtime-tested, and no Cloudflare Worker has been created or deployed for it. No production Worker source, secret, Cloudflare setting, Blogger page, or production deployment was changed by this work. The endpoint is not ready for public use until the development configuration and validation checklist are complete.
