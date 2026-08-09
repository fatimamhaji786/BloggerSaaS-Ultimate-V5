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
 *   Production Cloudflare Worker foundation for
 *   BloggerSaaS Ultimate V5.
 *
 * Capabilities:
 *   - Production Module Worker
 *   - Root endpoint
 *   - API routing
 *   - CORS handling
 *   - Security headers
 *   - Request IDs
 *   - Health endpoint
 *   - Version endpoint
 *   - API information endpoint
 *   - Method validation
 *   - Request-size protection
 *   - Safe JSON parsing
 *   - Centralized error handling
 *   - Gemini AI proxy
 *
 * Cloudflare secret required for AI:
 *
 *   GEMINI_API_KEY
 *
 * Optional variable:
 *
 *   GEMINI_MODEL
 *
 * Default model:
 *
 *   gemini-2.5-flash
 *
 * IMPORTANT:
 *   No secrets are hard-coded in this file.
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

  GEMINI_API_BASE:
    "https://generativelanguage.googleapis.com/v1beta",

  GEMINI_MODEL:
    "gemini-2.5-flash"
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
 * 3. REQUEST / TIME UTILITIES
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
 * 5. RESPONSE HELPERS
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
 * 6. LOGGING
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
 * 7. REQUEST VALIDATION
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


function getContentLength(request) {
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


/* ================================================================
 * 8. REQUEST BODY SIZE PROTECTION
 * ================================================================ */

function validateDeclaredBodySize(
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


/**
 * Read the request body while enforcing the
 * maximum byte limit.
 *
 * This protects requests even when the client
 * does not provide Content-Length.
 */
async function readBodyText(
  request
) {
  if (!request.body) {
    return "";
  }

  const reader =
    request.body.getReader();

  const chunks = [];

  let totalBytes = 0;

  try {
    while (true) {
      const {
        done,
        value
      } = await reader.read();

      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      totalBytes +=
        value.byteLength;

      if (
        totalBytes >
        CONFIG.MAX_BODY_BYTES
      ) {
        try {
          await reader.cancel();
        } catch {
          // Ignore cancellation errors.
        }

        throw new RequestBodyTooLargeError();
      }

      chunks.push(value);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Ignore release errors.
    }
  }

  const combined =
    new Uint8Array(
      totalBytes
    );

  let offset = 0;

  for (const chunk of chunks) {
    combined.set(
      chunk,
      offset
    );

    offset +=
      chunk.byteLength;
  }

  return new TextDecoder(
    "utf-8"
  ).decode(combined);
}


class RequestBodyTooLargeError
  extends Error {
  constructor() {
    super(
      "Request body exceeds the permitted size."
    );

    this.name =
      "RequestBodyTooLargeError";
  }
}


/* ================================================================
 * 9. JSON BODY PARSER
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

  if (
    !validateDeclaredBodySize(
      request
    )
  ) {
    throw new RequestBodyTooLargeError();
  }

  const text =
    await readBodyText(
      request
    );

  if (!text.trim()) {
    throw new Error(
      "Request body is empty."
    );
  }

  try {
    return JSON.parse(text);

  } catch {
    throw new Error(
      "Request body contains invalid JSON."
    );
  }
}


/* ================================================================
 * 10. HEALTH ENDPOINT
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

      status: "ok",

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
 * 11. VERSION ENDPOINT
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
 * 12. API INFORMATION ENDPOINT
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

      ai: {
        provider:
          "Google Gemini API",

        model:
          env?.GEMINI_MODEL ||
          CONFIG.GEMINI_MODEL,

        configured:
          Boolean(
            env?.GEMINI_API_KEY
          )
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
 * 13. GEMINI CONFIGURATION
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
    getGeminiModel(
      env
    );

  return (
    `${CONFIG.GEMINI_API_BASE}` +
    `/models/${encodeURIComponent(model)}` +
    `:generateContent`
  );
}


/* ================================================================
 * 14. GEMINI REQUEST NORMALIZATION
 * ================================================================ */

function normalizeGeminiRequest(
  body
) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    throw new Error(
      "AI request must be a JSON object."
    );
  }

  /*
   * Supported simple format:
   *
   * {
   *   "prompt": "Hello"
   * }
   */

  if (
    typeof body.prompt ===
    "string"
  ) {
    const prompt =
      body.prompt.trim();

    if (!prompt) {
      throw new Error(
        "The prompt cannot be empty."
      );
    }

    return {
      contents: [
        {
          role: "user",

          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
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
        : {})
    };
  }


  /*
   * Advanced format:
   *
   * {
   *   "contents": [...]
   * }
   */

  if (
    Array.isArray(
      body.contents
    ) &&
    body.contents.length > 0
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
        : {})
    };
  }


  throw new Error(
    "AI request requires either a non-empty 'prompt' or a 'contents' array."
  );
}


/* ================================================================
 * 15. GEMINI AI ENDPOINT
 * ================================================================ */

async function handleAI(
  request,
  env
) {
  const requestId =
    request.headers.get(
      "X-Request-ID"
    );


  /* ------------------------------------------------------------
   * Method
   * ---------------------------------------------------------- */

  if (
    request.method !==
    "POST"
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


  /* ------------------------------------------------------------
   * Gemini secret
   * ---------------------------------------------------------- */

  if (
    !env ||
    !env.GEMINI_API_KEY
  ) {
    return errorResponse(
      request,
      env,
      503,
      "AI_SERVICE_NOT_CONFIGURED",
      "GEMINI_API_KEY is not configured in the Cloudflare Worker.",
      requestId
    );
  }


  /* ------------------------------------------------------------
   * Declared body-size protection
   * ---------------------------------------------------------- */

  if (
    !validateDeclaredBodySize(
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


  /* ------------------------------------------------------------
   * Parse JSON
   * ---------------------------------------------------------- */

  let body;

  try {
    body =
      await readJSON(
        request
      );

  } catch (error) {
    if (
      error instanceof
      RequestBodyTooLargeError
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


  /* ------------------------------------------------------------
   * Normalize request
   * ---------------------------------------------------------- */

  let geminiPayload;

  try {
    geminiPayload =
      normalizeGeminiRequest(
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


  /* ------------------------------------------------------------
   * Logging
   *
   * Never log the API key or complete user prompt.
   * ---------------------------------------------------------- */

  log(
    env,
    "info",
    "Gemini AI request",
    {
      requestId,

      model:
        getGeminiModel(
          env
        )
    }
  );


  /* ------------------------------------------------------------
   * Call Gemini
   * ---------------------------------------------------------- */

  let upstreamResponse;

  try {
    upstreamResponse =
      await fetch(
        getGeminiEndpoint(
          env
        ),
        {
          method: "POST",

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
      "Gemini upstream request failed",
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
      "The Gemini AI service could not be reached.",
      requestId
    );
  }


  /* ------------------------------------------------------------
   * Read Gemini response
   * ---------------------------------------------------------- */

  let responseText;

  try {
    responseText =
      await upstreamResponse.text();

  } catch (error) {
    log(
      env,
      "error",
      "Unable to read Gemini response",
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
      "AI_UPSTREAM_RESPONSE_ERROR",
      "The Gemini service returned an unreadable response.",
      requestId
    );
  }


  /* ------------------------------------------------------------
   * Gemini error response
   * ---------------------------------------------------------- */

  if (
    !upstreamResponse.ok
  ) {
    log(
      env,
      "warn",
      "Gemini API returned an error",
      {
        requestId,

        status:
          upstreamResponse.status
      }
    );

    /*
     * Do not expose the API key.
     *
     * The upstream body is returned as a safe
     * JSON envelope where possible.
     */

    let upstreamData;

    try {
      upstreamData =
        JSON.parse(
          responseText
        );

    } catch {
      upstreamData = {
        message:
          "Gemini API returned an error."
      };
    }

    return jsonResponse(
      request,
      env,
      {
        success: false,

        error: {
          code:
            "AI_UPSTREAM_ERROR",

          message:
            "Gemini API request failed.",

          upstreamStatus:
            upstreamResponse.status
        },

        requestId,

        details:
          upstreamData?.error ||
          upstreamData
      },
      upstreamResponse.status
    );
  }


  /* ------------------------------------------------------------
   * Successful Gemini response
   * ---------------------------------------------------------- */

  let parsedResponse;

  try {
    parsedResponse =
      JSON.parse(
        responseText
      );

  } catch {
    /*
     * Gemini normally returns JSON.
     * If the upstream response is not JSON,
     * return it safely as text.
     */

    return new Response(
      responseText,
      {
        status: 200,

        headers:
          buildHeaders(
            request,
            env,
            {
              "Content-Type":
                upstreamResponse
                  .headers
                  .get(
                    "Content-Type"
                  ) ||
                "text/plain; charset=utf-8"
            }
          )
      }
    );
  }


  return jsonResponse(
    request,
    env,
    {
      success: true,

      requestId,

      model:
        getGeminiModel(
          env
        ),

      response:
        parsedResponse,

      timestamp:
        nowISO()
    },
    200
  );
}


/* ================================================================
 * 16. API ROUTER
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


  if (
    path ===
    CONFIG.HEALTH_PATH
  ) {
    if (
      !isMethodAllowed(
        request,
        ["GET"]
      )
    ) {
      return errorResponse(
        request,
        env,
        405,
        "METHOD_NOT_ALLOWED",
        "Health endpoint requires GET.",
        request.headers.get(
          "X-Request-ID"
        )
      );
    }

    return handleHealth(
      request,
      env
    );
  }


  if (
    path ===
    CONFIG.VERSION_PATH
  ) {
    if (
      !isMethodAllowed(
        request,
        ["GET"]
      )
    ) {
      return errorResponse(
        request,
        env,
        405,
        "METHOD_NOT_ALLOWED",
        "Version endpoint requires GET.",
        request.headers.get(
          "X-Request-ID"
        )
      );
    }

    return handleVersion(
      request,
      env
    );
  }


  if (
    path ===
    CONFIG.INFO_PATH
  ) {
    if (
      !isMethodAllowed(
        request,
        ["GET"]
      )
    ) {
      return errorResponse(
        request,
        env,
        405,
        "METHOD_NOT_ALLOWED",
        "Info endpoint requires GET.",
        request.headers.get(
          "X-Request-ID"
        )
      );
    }

    return handleInfo(
      request,
      env
    );
  }


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
 * 17. ROOT RESPONSE
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
 * 18. REQUEST-ID RESPONSE HEADER
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
 * 19. GLOBAL REQUEST HANDLER
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
   * Clone the request headers so the
   * request ID can be attached safely.
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


  /* ------------------------------------------------------------
   * CORS preflight
   * ---------------------------------------------------------- */

  if (
    request.method ===
    "OPTIONS"
  ) {
    return new Response(
      null,
      {
        status: 204,

        headers:
          buildHeaders(
            request,
            env
          )
      }
    );
  }


  /* ------------------------------------------------------------
   * Basic declared request-size protection
   * ---------------------------------------------------------- */

  if (
    !validateDeclaredBodySize(
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


  /* ------------------------------------------------------------
   * API routing
   * ---------------------------------------------------------- */

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


  /* ------------------------------------------------------------
   * Root endpoint
   * ---------------------------------------------------------- */

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
 * 20. GLOBAL ERROR HANDLER
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
 * 21. CLOUDFLARE MODULE WORKER ENTRY POINT
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
