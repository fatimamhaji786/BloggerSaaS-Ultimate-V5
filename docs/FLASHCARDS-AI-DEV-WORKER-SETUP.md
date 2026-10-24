# Flashcards AI Development Worker — Setup and Safety Checklist

Status: isolated development implementation prepared; not yet validated against Cloudflare or Gemini.

## Files
- `worker/worker/flashcards-ai-dev-draft.js`: request validation, Turnstile verification, rate-limit enforcement, Gemini request, and response validation.
- `worker/worker/flashcards-ai-dev-worker.js`: standalone entry point for the development endpoint only.
- `worker/wrangler.flashcards-dev.jsonc`: dedicated Worker name and configuration. It does not point at `worker.js` and does not configure the production Worker.

## Safety boundary
- Intended Worker name: `bloggersaas-ai-proxy-v514-dev`.
- Intended endpoint: `/api/flashcards-ai`.
- Health endpoint: `/api/health`; version endpoint: `/api/version`.
- Only the exact origin `https://freeunlimitedmultitools.blogspot.com` is allowed for the AI endpoint.
- The configuration contains no API key or Turnstile secret. Never commit secret values.
- Do not deploy this config to the production Worker or change the production Worker entry point.
- Local flashcard generation on Blogger must remain available when AI is unavailable.

## Required encrypted Worker secrets
Before the first usable test, configure these as secrets on the development Worker only:
1. `TURNSTILE_SECRET_KEY` — secret for the `Flashcards AI - DEV` Turnstile widget.
2. `GEMINI_API_KEY` — Gemini key intended for development testing.

Do not paste either value into chat, GitHub, Blogger HTML, or a public issue. Do not assume production secrets are copied to this Worker.

## Rate limiting
The dedicated config defines `FLASHCARDS_LIMITER` at 5 requests per 60 seconds per key. The handler fails closed with a safe 503 response if this binding is missing or unavailable.

## Deployment from the worker directory
Review the configuration first, then deploy only the development config:
```sh
npx wrangler deploy --config wrangler.flashcards-dev.jsonc
```
Run the command from the repository's `worker/` directory. Confirm the deployed Worker name is exactly `bloggersaas-ai-proxy-v514-dev` before adding secrets or testing. Do not use the default `wrangler.jsonc` for this task.

If deploying through the Cloudflare dashboard instead of Wrangler, connect only the development branch/config and confirm the Worker entry point is `worker/flashcards-ai-dev-worker.js`. Do not select the production Worker or its production deployment.

## Test checklist before Blogger integration
- `GET /api/health` returns a small health response.
- `GET /api/version` identifies the development service.
- Unknown paths return 404.
- AI route rejects an incorrect Origin.
- AI route rejects missing/invalid Turnstile tokens.
- AI route rejects invalid JSON, oversized source text, and card counts outside 1–12.
- Rate limit returns 429 when exceeded.
- Valid challenge and short, non-sensitive sample text produce exactly the requested number of validated question/answer cards.
- Provider failures return safe messages; no source text, challenge token, or secrets appear in logs/responses.
- Production `/api/ai`, `/api/health`, `/api/version`, `/api/info`, and the published Blogger tool remain unchanged.

## Current limitations
The code has been committed to the development branch, but has not yet been run in a Cloudflare Worker, tested against live Turnstile/Gemini, or integrated into the published Blogger page. Complete the tests above before enabling the AI button for public visitors.
