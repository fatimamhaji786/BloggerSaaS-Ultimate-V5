/**
 * Isolated Flashcards AI development Worker entry point.
 *
 * This file is intentionally separate from worker.js. Do not change the
 * production Worker entry point or merge this into production without review.
 */
import { handleFlashcardsAIDevDraft } from "./flashcards-ai-dev-draft.js";

const SERVICE_NAME = "flashcards-ai-dev";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // A minimal, non-sensitive health endpoint. It does not reveal secrets
    // or claim that optional bindings have been configured.
    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true, service: SERVICE_NAME, status: "worker-online" });
    }

    if (url.pathname === "/api/version" && request.method === "GET") {
      return json({ service: SERVICE_NAME, version: "0.1.0-dev" });
    }

    if (url.pathname === "/api/flashcards-ai") {
      return handleFlashcardsAIDevDraft(request, env);
    }

    return json({ success: false, error: "NOT_FOUND", message: "Endpoint not found." }, 404);
  }
};
