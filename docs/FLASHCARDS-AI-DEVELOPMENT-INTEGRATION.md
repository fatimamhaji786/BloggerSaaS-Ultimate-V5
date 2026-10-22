# Flashcards AI — Development Integration Plan

Status: preparation only. This document does not change Worker behavior, secrets, routing, or production.

## Repository isolation
- Work branch: `feature/flashcards-ai-dev`
- Base: `v5.1.14-dev`
- Do not merge this branch into production or deploy it to the production Worker without explicit approval.

## Existing gateway findings
- The Worker already has `POST /api/ai`.
- That endpoint requires a valid Firebase ID token and reads the Gemini API key from the server-side `GEMINI_API_KEY` secret.
- The public Flashcards Generator intentionally has no user login. Calling `/api/ai` directly from the public Blogger page would therefore fail authentication unless a separate safe public flow is implemented.
- Do not place `GEMINI_API_KEY`, `AI_PROXY_TOKEN`, Firebase service credentials, or any shared secret in Blogger HTML/JavaScript.

## Proposed isolated endpoint
Add a separate `POST /api/flashcards-ai` route only after all prerequisites below are configured:
1. Strict origin allowlist for the exact Blogger site origin.
2. Cloudflare Turnstile challenge verified server-side using a Worker secret; the public site key is not a secret.
3. A Cloudflare rate-limiting control for this endpoint, with conservative per-IP limits and a clear 429 response.
4. Strict JSON schema and request-size limits; cap source text length, requested card count, output tokens, and response size.
5. Use the existing server-side `GEMINI_API_KEY` and configured model; never log source text, prompts, challenge tokens, or secrets.
6. Return only validated flashcard question/answer data. Treat model output as untrusted text and render it as text, not HTML.
7. Keep local flashcard generation fully functional if the AI endpoint, challenge, or provider is unavailable.

## Required development configuration
- A separate development Worker deployment/URL, not the production Worker.
- Development-only Worker secret for Turnstile verification.
- Turnstile site key configured in the development Blogger test page (public key only).
- A configured Cloudflare rate-limiting rule/binding for the development endpoint.
- Confirm the development Worker has its own intended Gemini secret/model configuration and does not inherit or overwrite production settings.

## Validation checklist (must pass before Blogger integration)
- Missing/invalid Turnstile token is rejected.
- Disallowed Origin is rejected.
- Missing or oversized input is rejected.
- Requests above the configured rate limit receive 429.
- Valid challenge + allowed origin returns schema-valid flashcards.
- Provider 401/403/404/429/5xx errors are handled safely.
- No secret, challenge token, or user source text appears in logs or responses.
- `/api/ai`, `/api/health`, `/api/version`, and production behavior remain unchanged.
- Test using a development-only page and short, non-sensitive sample text before editing the published Blogger tool.

## Current result
Repository branch created for isolated preparation. No Worker source, secret, Cloudflare setting, Blogger page, or production deployment has been changed. The actual connection is not yet validated; the required anti-abuse configuration must be established before implementation can safely serve anonymous public visitors.
