/**
 * ================================================================
 * BloggerSaaS Ultimate V5
 * Production Cloudflare Worker
 * ================================================================
 *
 * File:
 *   worker/worker/worker.js
 *
 * Version:
 *   5.1.1
 *
 * Purpose:
 *   Production API foundation and Gemini AI proxy for
 *   BloggerSaaS Ultimate V5.
 *
 * V5.1.1 REPAIRS:
 *   - Uses existing GEMINI_API_KEY Cloudflare secret
 *   - Removes dependency on missing AI_API_URL / AI_API_KEY
 *   - Uses Gemini x-goog-api-key authentication
 *   - Adds Gemini model configuration
 *   - Adds safer request validation
 *   - Adds upstream AI error handling
 *   - Preserves request IDs
 *   - Preserves CORS
 *   - Preserves security headers
 *   - Preserves health/version/info endpoints
 *   - Preserves Module Worker architecture
 *
 * IMPORTANT:
 *   No API secrets are stored in this source file.
 * ================================================================
 */

"use strict";


/* ================================================================
 * 1. APPLICATION CONFIGURATION
 * ================================================================ */

const CONFIG = Object.freeze({
  APP_NAME: "BloggerSaaS Ultimate V5",

  VERSION: "5.1.1",

  API_PREFIX: "/api",

  MAX_BODY_BYTES: 1024 * 1024, // 1 MB

  ENABLE_LOGS: true,

  DEFAULT_CORS_ORIGINS: "*",

  HEALTH_PATH: "/api/health",

  VERSION_PATH: "/api/version",

  INFO_PATH: "/api/info",

  AI_PATH: "/api/ai",

  /*
   * Gemini configuration.
   *
   * GEMINI_API_KEY is stored in Cloudflare as a Secret.
   *
   * The model can optionally be overridden with:
   *
   *   GEMINI_MODEL
   *
   * in Cloudflare Variables.
   */
  GEMINI_MODEL: "gemini-2.5-flash",

  GEMINI_API_BASE:
    "https://generativelanguage.googleapis.com/v1beta"
});


/* ================================================================
 * 2. SECURITY HEADERS
 * ================================================================ */

const SECURITY_HEADERS = Object.freeze({
  "X-Content-Type-Options":
    "nosniff",

  "X-Frame-Options":
    "DENY",

  "Referrer-Policy":
    "strict-origin-when-cross-origin",

  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=()",

  "Cross-Origin-Resource-Policy":
    "cross-origin",

  "Cache-Control":
    "no-store"
});


/* ================================================================
 * 3. REQUEST ID
 * ================================================================ */

function createRequestId() {
  return crypto.randomUUID();
}


function nowISO() {
  return new Date().toISOString();
}


/* ================================================================
 * 4. CORS
 * ================================================================ */

function getCorsOrigin(request, env) {
  const requestOrigin =
    request.headers.get("Origin");

  const configuredOrigins =
    env?.CORS_ORIGINS ||
    CONFIG.DEFAULT_CORS_ORIGINS;

  /*
   * Wildcard mode.
   *
   * This is appropriate because this API does not use
   * browser cookies for authentication.
   */
  if (configuredOrigins === "*") {
    return "*";
  }

  const allowed =
    String(configuredOrigins)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  if (
    requestOrigin &&
    allowed.includes(requestOrigin)
  ) {
    return requestOrigin;
  }

  return allowed[0] || "null";
}


function corsHeaders(request, env) {
  return {
    "Access-Control-Allow-Origin":
      getCorsOrigin(request, env),

    "Access-Control-Allow-Methods":
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With, X-Request-ID",

    "Access-Control-Expose-Headers":
      "X-Request-ID",

    "Access-Control-Max-Age":
      "86400",

    "Vary":
      "Origin"
  };
}


/* ================================================================
 * 5. RESPONSE HEADERS
 * ================================================================ */

function buildHeaders(
  request,
  env,
  extra = {}
) {
  return {
    ...SECURITY_HEADERS,

    ...corsHeaders(
      request,
      env
    ),

    ...extra
  };
}


/* ================================================================
 * 6. JSON RESPONSE
 * ================================================================ */

function jsonResponse(
  request,
  env,
  data,
  status = 200,
  extraHeaders = {}
) {
  return new Response(
    JSON.stringify(
      data,
      null,
      2
    ),
    {
      status,

      headers:
        buildHeaders(
          request,
          env,
          {
            "Content-Type":
              "application/json; charset=utf-8",

            ...extraHeaders
          }
        )
    }
  );
}


/* ================================================================
 * 7. TEXT RESPONSE
 * ================================================================ */

function textResponse(
  request,
  env,
  text,
  status = 200
) {
  return new Response(
    text,
    {
      status,

      headers:
        buildHeaders(
          request,
          env,
          {
            "Content-Type":
              "text/plain; charset=utf-8"
          }
        )
    }
  );
}


/* ================================================================
 * 8. ERROR RESPONSE
 * ================================================================ */

function errorResponse(
  request,
  env,
  status,
  code,
  message,
  requestId
) {
  return jsonResponse(
    request,
    env,
    {
      success: false,

      error: {
        code,
        message
      },

      requestId,

      timestamp:
        nowISO()
    },
    status
  );
}


/* ================================================================
 * 9. LOGGING
 * ================================================================ */

function log(
  env,
  level,
  message,
  metadata = {}
) {
  if (!CONFIG.ENABLE_LOGS) {
    return;
  }

  const payload = {
    app:
      CONFIG.APP_NAME,

    version:
      CONFIG.VERSION,

    level,

    message,

    timestamp:
      nowISO(),

    ...metadata
  };

  if (level === "error") {
    console.error(payload);
  } else if (level === "warn") {
    console.warn(payload);
  } else {
    console.log(payload);
  }
}


/* ================================================================
 * 10. REQUEST VALIDATION
 * ================================================================ */

function isApiRequest(url) {
  return (
    url.pathname ===
      CONFIG.API_PREFIX ||

    url.pathname.startsWith(
      `${CONFIG.API_PREFIX}/`
    )
  );
}


function isMethodAllowed(
  request,
  methods
) {
  return methods.includes(
    request.method
  );
}


function getContentLength(
  request
) {
  const value =
    request.headers.get(
      "Content-Length"
    );

  if (!value) {
    return null;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return null;
  }

  return number;
}


function validateBodySize(
  request
) {
  const contentLength =
    getContentLength(
      request
    );

  if (
    contentLength !== null &&
    contentLength >
      CONFIG.MAX_BODY_BYTES
  ) {
    return false;
  }

  return true;
}


/* ================================================================
 * 11. JSON BODY PARSER
 * ================================================================ */

async function readJSON(
  request
) {
  const contentType =
    request.headers.get(
      "Content-Type"
    ) || "";

  if (
    !contentType
      .toLowerCase()
      .includes(
        "application/json"
      )
  ) {
    throw new Error(
      "Content-Type must be application/json."
    );
  }

  const body =
    await request.json();

  if (
    body === null ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    throw new Error(
      "JSON request body must be an object."
    );
  }

  return body;
}


/* ================================================================
 * 12. HEALTH ENDPOINT
 * ================================================================ */

async function handleHealth(
  request,
  env
) {
  return jsonResponse(
    request,
    env,
    {
      success: true,

      status:
        "ok",

      service:
        "BloggerSaaS Ultimate V5 Cloudflare Worker",

      version:
        CONFIG.VERSION,

      timestamp:
        nowISO()
    }
  );
}


/* ================================================================
 * 13. VERSION ENDPOINT
 * ================================================================ */

async function handleVersion(
  request,
  env
) {
  return jsonResponse(
    request,
    env,
    {
      success: true,

      application:
        CONFIG.APP_NAME,

      version:
        CONFIG.VERSION,

      runtime:
        "Cloudflare Workers",

      architecture:
        "Module Worker"
    }
  );
}


/* ================================================================
 * 14. API INFORMATION ENDPOINT
 * ================================================================ */

async function handleInfo(
  request,
  env
) {
  return jsonResponse(
    request,
    env,
    {
      success: true,

      application:
        CONFIG.APP_NAME,

      version:
        CONFIG.VERSION,

      apiPrefix:
        CONFIG.API_PREFIX,

      endpoints: {
        health:
          CONFIG.HEALTH_PATH,

        version:
          CONFIG.VERSION_PATH,

        info:
          CONFIG.INFO_PATH,

        ai:
          CONFIG.AI_PATH
      },

      modules: [
        "Foundation",
        "Security",
        "Router",
        "Database",
        "Authentication",
        "Dashboard API",
        "Tool Manager API",
        "AI Services",
        "Analytics",
        "Settings"
      ]
    }
  );
}


/* ================================================================
 * 15. GEMINI CONFIGURATION
 * ================================================================ */

function getGeminiModel(env) {
  return (
    env?.GEMINI_MODEL ||
    CONFIG.GEMINI_MODEL
  );
}


function getGeminiEndpoint(
  env
) {
  const model =
    getGeminiModel(env);

  return (
    `${CONFIG.GEMINI_API_BASE}` +
    `/models/${encodeURIComponent(model)}` +
    `:generateContent`
  );
}


/* ================================================================
 * 16. GEMINI REQUEST NORMALIZATION
 * ================================================================
 *
 * Supported browser request forms:
 *
 * A.
 * {
 *   "prompt": "Hello"
 * }
 *
 * B.
 * {
 *   "contents": [...]
 * }
 *
 * C.
 * Full Gemini generateContent payload.
 *
 * The Worker never exposes GEMINI_API_KEY.
 * ================================================================ */

function buildGeminiPayload(
  body
) {
  /*
   * If the caller already supplied a Gemini
   * contents payload, preserve it.
   */
  if (
    Array.isArray(
      body.contents
    )
  ) {
    return {
      contents:
        body.contents,

      ...(body.systemInstruction
        ? {
            systemInstruction:
              body.systemInstruction
          }
        : {}),

      ...(body.generationConfig
        ? {
            generationConfig:
              body.generationConfig
          }
        : {}),

      ...(body.safetySettings
        ? {
            safetySettings:
              body.safetySettings
          }
        : {}),

      ...(body.tools
        ? {
            tools:
              body.tools
          }
        : {})
    };
  }

  /*
   * Simple prompt mode.
   */
  if (
    typeof body.prompt ===
    "string"
  ) {
    const prompt =
      body.prompt.trim();

    if (!prompt) {
      throw new Error(
        "Prompt cannot be empty."
      );
    }

    return {
      contents: [
        {
          role:
            "user",

          parts: [
            {
              text:
                prompt
            }
          ]
        }
      ],

      ...(body.generationConfig
        ? {
            generationConfig:
              body.generationConfig
          }
        : {})
    };
  }

  throw new Error(
    "Request must contain either a non-empty prompt or a contents array."
  );
}


/* ================================================================
 * 17. GEMINI AI PROXY
 * ================================================================ */

async function handleAI(
  request,
  env
) {
  const requestId =
    request.headers.get(
      "X-Request-ID"
    ) ||
    createRequestId();

  /*
   * AI endpoint is POST only.
   */
  if (
    !isMethodAllowed(
      request,
      ["POST"]
    )
  ) {
    return errorResponse(
      request,
      env,
      405,
      "METHOD_NOT_ALLOWED",
      "AI endpoint requires POST.",
      requestId
    );
  }

  /*
   * Existing Cloudflare secret:
   *
   * GEMINI_API_KEY
   */
  if (
    !env ||
    !env.GEMINI_API_KEY
  ) {
    log(
      env,
      "error",
      "Gemini API key is not configured.",
      {
        requestId
      }
    );

    return errorResponse(
      request,
      env,
      503,
      "GEMINI_SERVICE_NOT_CONFIGURED",
      "Gemini AI service is not configured.",
      requestId
    );
  }

  /*
   * Request size protection.
   */
  if (
    !validateBodySize(
      request
    )
  ) {
    return errorResponse(
      request,
      env,
      413,
      "PAYLOAD_TOO_LARGE",
      "Request body exceeds the permitted size.",
      requestId
    );
  }

  /*
   * Parse JSON.
   */
  let body;

  try {
    body =
      await readJSON(
        request
      );
  } catch (error) {
    return errorResponse(
      request,
      env,
      400,
      "INVALID_JSON",
      error instanceof Error
        ? error.message
        : "A valid JSON request body is required.",
      requestId
    );
  }

  /*
   * Build Gemini request.
   */
  let geminiPayload;

  try {
    geminiPayload =
      buildGeminiPayload(
        body
      );
  } catch (error) {
    return errorResponse(
      request,
      env,
      400,
      "INVALID_AI_REQUEST",
      error instanceof Error
        ? error.message
        : "Invalid AI request.",
      requestId
    );
  }

  const endpoint =
    getGeminiEndpoint(
      env
    );

  log(
    env,
    "info",
    "Sending request to Gemini.",
    {
      requestId,
      model:
        getGeminiModel(
          env
        )
    }
  );

  /*
   * Call Gemini.
   *
   * IMPORTANT:
   * Gemini expects x-goog-api-key.
   *
   * The key is never sent to the browser.
   */
  let upstreamResponse;

  try {
    upstreamResponse =
      await fetch(
        endpoint,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-goog-api-key":
              env.GEMINI_API_KEY
          },

          body:
            JSON.stringify(
              geminiPayload
            )
        }
      );
  } catch (error) {
    log(
      env,
      "error",
      "Gemini upstream request failed.",
      {
        requestId,
        error:
          error instanceof Error
            ? error.message
            : String(error)
      }
    );

    return errorResponse(
      request,
      env,
      502,
      "AI_UPSTREAM_UNAVAILABLE",
      "Gemini AI service could not be reached.",
      requestId
    );
  }

  /*
   * Read upstream response.
   */
  const responseText =
    await upstreamResponse.text();

  /*
   * Never expose the API key or internal
   * Worker configuration in an error.
   */
  if (
    !upstreamResponse.ok
  ) {
    log(
      env,
      "error",
      "Gemini returned an error.",
      {
        requestId,
        status:
          upstreamResponse.status
      }
    );

    /*
     * Preserve the upstream JSON error when possible,
     * but return it through our API envelope.
     */
    let upstreamError = null;

    try {
      upstreamError =
        JSON.parse(
          responseText
        );
    } catch {
      upstreamError = null;
    }

    const message =
      upstreamError?.error?.message ||
      `Gemini AI request failed with status ${upstreamResponse.status}.`;

    return errorResponse(
      request,
      env,
      upstreamResponse.status >= 400 &&
      upstreamResponse.status < 600
        ? upstreamResponse.status
        : 502,
      "GEMINI_API_ERROR",
      message,
      requestId
    );
  }

  /*
   * Return Gemini response to the client.
   */
  return new Response(
    responseText,
    {
      status:
        upstreamResponse.status,

      headers:
        buildHeaders(
          request,
          env,
          {
            "Content-Type":
              upstreamResponse.headers.get(
                "Content-Type"
              ) ||
              "application/json; charset=utf-8"
          }
        )
    }
  );
}


/* ================================================================
 * 18. API ROUTER
 * ================================================================ */

async function routeAPI(
  request,
  env
) {
  const url =
    new URL(
      request.url
    );

  const path =
    url.pathname;

  /*
   * Health.
   */
  if (
    path ===
    CONFIG.HEALTH_PATH
  ) {
    return handleHealth(
      request,
      env
    );
  }

  /*
   * Version.
   */
  if (
    path ===
    CONFIG.VERSION_PATH
  ) {
    return handleVersion(
      request,
      env
    );
  }

  /*
   * Info.
   */
  if (
    path ===
    CONFIG.INFO_PATH
  ) {
    return handleInfo(
      request,
      env
    );
  }

  /*
   * AI.
   */
  if (
    path ===
      CONFIG.AI_PATH ||
    path.startsWith(
      `${CONFIG.AI_PATH}/`
    )
  ) {
    return handleAI(
      request,
      env
    );
  }

  /*
   * Unknown API route.
   */
  return errorResponse(
    request,
    env,
    404,
    "API_ROUTE_NOT_FOUND",
    "The requested API route does not exist.",
    request.headers.get(
      "X-Request-ID"
    )
  );
}


/* ================================================================
 * 19. ROOT RESPONSE
 * ================================================================ */

async function handleRoot(
  request,
  env
) {
  return jsonResponse(
    request,
    env,
    {
      success: true,

      application:
        CONFIG.APP_NAME,

      version:
        CONFIG.VERSION,

      message:
        "BloggerSaaS Ultimate V5 Worker is running.",

      api:
        CONFIG.API_PREFIX,

      health:
        CONFIG.HEALTH_PATH,

      ai:
        CONFIG.AI_PATH
    }
  );
}


/* ================================================================
 * 20. GLOBAL REQUEST HANDLER
 * ================================================================ */

async function handleRequest(
  request,
  env,
  ctx
) {
  const requestId =
    createRequestId();

  const url =
    new URL(
      request.url
    );

  /*
   * Incoming Request objects are immutable.
   * Create a new Request so the request ID can
   * safely be attached.
   */
  request =
    new Request(
      request,
      {
        headers:
          new Headers(
            request.headers
          )
      }
    );

  request.headers.set(
    "X-Request-ID",
    requestId
  );

  log(
    env,
    "info",
    "Incoming request",
    {
      requestId,

      method:
        request.method,

      path:
        url.pathname
    }
  );

  /*
   * CORS preflight.
   */
  if (
    request.method ===
    "OPTIONS"
  ) {
    return new Response(
      null,
      {
        status:
          204,

        headers:
          buildHeaders(
            request,
            env
          )
      }
    );
  }

  /*
   * Basic body-size protection.
   */
  if (
    !validateBodySize(
      request
    )
  ) {
    return errorResponse(
      request,
      env,
      413,
      "PAYLOAD_TOO_LARGE",
      "Request body exceeds the permitted size.",
      requestId
    );
  }

  /*
   * API routing.
   */
  if (
    isApiRequest(
      url
    )
  ) {
    const response =
      await routeAPI(
        request,
        env
      );

    return addRequestId(
      response,
      requestId
    );
  }

  /*
   * Root.
   */
  const response =
    await handleRoot(
      request,
      env
    );

  return addRequestId(
    response,
    requestId
  );
}


/* ================================================================
 * 21. REQUEST-ID RESPONSE HEADER
 * ================================================================ */

function addRequestId(
  response,
  requestId
) {
  const headers =
    new Headers(
      response.headers
    );

  headers.set(
    "X-Request-ID",
    requestId
  );

  return new Response(
    response.body,
    {
      status:
        response.status,

      statusText:
        response.statusText,

      headers
    }
  );
}


/* ================================================================
 * 22. GLOBAL ERROR HANDLER
 * ================================================================ */

function handleFatalError(
  request,
  env,
  error,
  requestId
) {
  log(
    env,
    "error",
    "Unhandled Worker error",
    {
      requestId,

      error:
        error instanceof Error
          ? error.message
          : String(error)
    }
  );

  return errorResponse(
    request,
    env,
    500,
    "INTERNAL_SERVER_ERROR",
    "An unexpected server error occurred.",
    requestId
  );
}


/* ================================================================
 * 23. CLOUDFLARE MODULE WORKER ENTRY POINT
 * ================================================================ */

export default {
  async fetch(
    request,
    env,
    ctx
  ) {
    const requestId =
      createRequestId();

    try {
      return await handleRequest(
        request,
        env,
        ctx
      );
    } catch (error) {
      return handleFatalError(
        request,
        env,
        error,
        requestId
      );
    }
  }
};
