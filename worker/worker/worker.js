
/**
 * ================================================================
 * BloggerSaaS Ultimate V5
 * Production Cloudflare Worker
 * ================================================================
 *
 * File:
 *   worker/worker/worker.js
 *
 * Purpose:
 *   Production API foundation for BloggerSaaS Ultimate V5.
 *
 * Current capabilities:
 *   - Production Module Worker
 *   - API routing
 *   - CORS handling
 *   - Security headers
 *   - Request IDs
 *   - Health endpoint
 *   - Version endpoint
 *   - API metadata endpoint
 *   - Method validation
 *   - JSON parsing
 *   - Request-size protection
 *   - Centralized error handling
 *   - Optional AI proxy foundation
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
  VERSION: "5.1.0",
  API_PREFIX: "/api",

  MAX_BODY_BYTES: 1024 * 1024, // 1 MB

  ENABLE_LOGS: true,

  DEFAULT_CORS_ORIGINS: "*",

  HEALTH_PATH: "/api/health",
  VERSION_PATH: "/api/version",
  INFO_PATH: "/api/info",
  AI_PATH: "/api/ai"
});


/* ================================================================
 * 2. SECURITY HEADERS
 * ================================================================ */

const SECURITY_HEADERS = Object.freeze({
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Resource-Policy": "cross-origin",
  "Cache-Control": "no-store"
});


/* ================================================================
 * 3. UTILITY FUNCTIONS
 * ================================================================ */

function createRequestId() {
  return crypto.randomUUID();
}


function nowISO() {
  return new Date().toISOString();
}


function getCorsOrigin(request, env) {
  const requestOrigin = request.headers.get("Origin");

  const configuredOrigins =
    env?.CORS_ORIGINS ||
    CONFIG.DEFAULT_CORS_ORIGINS;

  if (configuredOrigins === "*") {
    return "*";
  }

  const allowed = configuredOrigins
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


function buildHeaders(request, env, extra = {}) {
  return {
    ...SECURITY_HEADERS,
    ...corsHeaders(request, env),
    ...extra
  };
}


/* ================================================================
 * 4.  HELPERS
 * ================================================================ */

function jsonResponse(
  request,
  env,
  data,
  status = 200,
  extraHeaders = {}
) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: buildHeaders(
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
  return new Response(text, {
    status,
    headers: buildHeaders(
      request,
      env,
      {
        "Content-Type":
          "text/plain; charset=utf-8"
      }
    )
  });
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

      timestamp: nowISO()
    },
    status
  );
}


/* ================================================================
 * 5. LOGGING
 * ================================================================ */

function log(env, level, message, metadata = {}) {
  if (!CONFIG.ENABLE_LOGS) {
    return;
  }

  const payload = {
    app: CONFIG.APP_NAME,
    version: CONFIG.VERSION,
    level,
    message,
    timestamp: nowISO(),
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
 * 6. REQUEST VALIDATION
 * ================================================================ */

function isApiRequest(url) {
  return url.pathname === CONFIG.API_PREFIX ||
    url.pathname.startsWith(`${CONFIG.API_PREFIX}/`);
}


function isMethodAllowed(request, methods) {
  return methods.includes(request.method);
}


function getContentLength(request) {
  const value =
    request.headers.get("Content-Length");

  if (!value) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}


function validateBodySize(request) {
  const contentLength =
    getContentLength(request);

  if (
    contentLength !== null &&
    contentLength > CONFIG.MAX_BODY_BYTES
  ) {
    return false;
  }

  return true;
}


/* ================================================================
 * 7. JSON BODY PARSER
 * ================================================================ */

async function readJSON(request) {
  const contentType =
    request.headers.get("Content-Type") || "";

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    throw new Error(
      "Content-Type must be application/json"
    );
  }

  return await request.json();
}


/* ================================================================
 * 8. HEALTH ENDPOINT
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
 * 9. VERSION ENDPOINT
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
 * 10. API INFORMATION ENDPOINT
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
 * 11. AI PROXY FOUNDATION
 * ================================================================
 *
 * The endpoint is intentionally disabled until the following
 * Cloudflare Worker secrets/variables are configured:
 *
 *   AI_API_URL
 *   AI_API_KEY
 *
 * Nothing sensitive is stored in source code.
 * ================================================================ */

async function handleAI(
  request,
  env
) {
  if (request.method !== "POST") {
    return errorResponse(
      request,
      env,
      405,
      "METHOD_NOT_ALLOWED",
      "AI endpoint requires POST.",
      request.headers.get("X-Request-ID")
    );
  }

  if (
    !env ||
    !env.AI_API_URL ||
    !env.AI_API_KEY
  ) {
    return errorResponse(
      request,
      env,
      503,
      "AI_SERVICE_NOT_CONFIGURED",
      "AI service is not configured.",
      request.headers.get("X-Request-ID")
    );
  }

  if (!validateBodySize(request)) {
    return errorResponse(
      request,
      env,
      413,
      "PAYLOAD_TOO_LARGE",
      "Request body exceeds the permitted size.",
      request.headers.get("X-Request-ID")
    );
  }

  let body;

  try {
    body = await readJSON(request);
  } catch {
    return errorResponse(
      request,
      env,
      400,
      "INVALID_JSON",
      "A valid JSON request body is required.",
      request.headers.get("X-Request-ID")
    );
  }

  /*
   * Forward only the JSON payload.
   *
   * Authorization is generated from the Worker secret and
   * is never exposed to the browser.
   */

  const upstreamResponse = await fetch(
    env.AI_API_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "Authorization":
          `Bearer ${env.AI_API_KEY}`
      },

      body:
        JSON.stringify(body)
    }
  );

  const responseText =
    await upstreamResponse.text();

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
 * 12. API ROUTER
 * ================================================================ */

async function routeAPI(
  request,
  env
) {
  const url =
    new URL(request.url);

  const path =
    url.pathname;

  if (path === CONFIG.HEALTH_PATH) {
    return handleHealth(
      request,
      env
    );
  }

  if (path === CONFIG.VERSION_PATH) {
    return handleVersion(
      request,
      env
    );
  }

  if (path === CONFIG.INFO_PATH) {
    return handleInfo(
      request,
      env
    );
  }

  if (
    path === CONFIG.AI_PATH ||
    path.startsWith(`${CONFIG.AI_PATH}/`)
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
    request.headers.get("X-Request-ID")
  );
}


/* ================================================================
 * 13. ROOT RESPONSE
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
        CONFIG.HEALTH_PATH
    }
  );
}


/* ================================================================
 * 14. GLOBAL REQUEST HANDLER
 * ================================================================ */

async function handleRequest(
  request,
  env,
  ctx
) {
  const requestId =
    createRequestId();

  const url =
    new URL(request.url);

  /*
   * Attach request ID to the request context through
   * a cloned header set. The original request remains
   * untouched.
   */

  request = new Request(
    request,
    {
      headers: new Headers(request.headers)
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
      method: request.method,
      path: url.pathname
    }
  );

  /* ------------------------------------------------------------
   * CORS preflight
   * ---------------------------------------------------------- */

  if (request.method === "OPTIONS") {
    return new Response(
      null,
      {
        status: 204,
        headers: buildHeaders(
          request,
          env
        )
      }
    );
  }


  /* ------------------------------------------------------------
   * Basic request-size protection
   * ---------------------------------------------------------- */

  if (!validateBodySize(request)) {
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

  if (isApiRequest(url)) {
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
 * 15. REQUEST-ID RESPONSE HEADER
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
 * 16. GLOBAL ERROR HANDLER
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
 * 17. CLOUDFLARE MODULE WORKER ENTRY POINT
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
