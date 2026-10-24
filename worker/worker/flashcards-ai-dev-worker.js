/**
 * Isolated Flashcards AI development Worker entry point.
 *
 * This entry point is separate from worker.js and serves only the development
 * Flashcards AI endpoint. Never use it as the production Worker entry point.
 *
 * Required before testing:
 * - FLASHCARDS_ALLOWED_ORIGIN
 * - TURNSTILE_SECRET_KEY (encrypted Worker secret)
 * - FLASHCARDS_LIMITER (rate-limiting binding)
 * - GEMINI_API_KEY (encrypted Worker secret)
 */
import { handleFlashcardsAIDevDraft } from "./flashcards-ai-dev-draft.js";

const SERVICE_NAME = "flashcards-ai-dev";
const ALLOWED_ORIGIN = "https://freeunlimitedmultitools.blogspot.com";

function json(data, status = 200, origin = "") {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  };
  if (origin === ALLOWED_ORIGIN) {
    headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN;
    headers["Vary"] = "Origin";
  }
  return new Response(JSON.stringify(data), { status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (url.pathname === "/api/health" && request.method === "GET") {
      if (origin && origin !== ALLOWED_ORIGIN) {
        return json({ success: false, error: "ORIGIN_NOT_ALLOWED" }, 403);
      }
      return json({
        ok: true,
        service: SERVICE_NAME,
        status: "development-only"
      }, 200, origin);
    }

    if (url.pathname === "/api/version" && request.method === "GET") {
      if (origin && origin !== ALLOWED_ORIGIN) {
        return json({ success: false, error: "ORIGIN_NOT_ALLOWED" }, 403);
      }
      return json({ service: SERVICE_NAME, version: "0.1.0-dev" }, 200, origin);
    }

    if (url.pathname === "/api/flashcards-ai") {
      return handleFlashcardsAIDevDraft(request, env);
    }

    return json({
      success: false,
      error: "NOT_FOUND",
      message: "Endpoint not found."
    }, 404, origin);
  }
};
