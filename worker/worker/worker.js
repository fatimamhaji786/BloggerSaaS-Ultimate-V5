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
 *   5.1.7
 *
 * Purpose:
 *   Production API foundation and Gemini AI proxy.
 *
 * Capabilities:
 *   - Module Worker
 *   - Root endpoint
 *   - API routing
 *   - Hardened CORS
 *   - Security headers
 *   - Request IDs
 *   - Health endpoint
 *   - Version endpoint
 *   - API information endpoint
 *   - Request method validation
 *   - JSON parsing
 *   - Request-size protection
 *   - Centralized error handling
 *   - AI proxy authentication
 *   - Gemini AI proxy
 *   - Gemini API key stored only in Cloudflare Secret
 *
 * Required Cloudflare Secrets:
 *   GEMINI_API_KEY
 *   AI_PROXY_TOKEN
 *
 * Optional Cloudflare Variables:
 *   GEMINI_MODEL
 *   CORS_ORIGINS
 *
 * Default Gemini model:
 *   gemini-3.6-flash
 *
 * IMPORTANT:
 *   No API key or AI proxy token is hard-coded in this file.
 * ================================================================
 */

"use strict";


/* ================================================================
 * 1. APPLICATION CONFIGURATION
 * ================================================================ */

const CONFIG = Object.freeze({

  APP_NAME:
    "BloggerSaaS Ultimate V5",

  VERSION:
    "5.1.7",

  API_PREFIX:
    "/api",

  MAX_BODY_BYTES:
    1024 * 1024, // 1 MB

  ENABLE_LOGS:
    true,

  DEFAULT_CORS_ORIGINS:
    "",

  HEALTH_PATH:
    "/api/health",

  VERSION_PATH:
    "/api/version",

  INFO_PATH:
    "/api/info",

  AI_PATH:
    "/api/ai",

  GEMINI_API_BASE:
    "https://generativelanguage.googleapis.com/v1beta",

  DEFAULT_GEMINI_MODEL:
    "gemini-3.6-flash"

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
 * 3. REQUEST UTILITIES
 * ================================================================ */

function createRequestId() {

  return crypto.randomUUID();

}


function nowISO() {

  return new Date().toISOString();

}


/* ================================================================
 * 4. CORS — PRODUCTION HARDENED
 * ================================================================ */

function getAllowedCorsOrigins(env) {

  const configuredOrigins =
    typeof env?.CORS_ORIGINS === "string" &&
    env.CORS_ORIGINS.trim()
      ? env.CORS_ORIGINS
      : CONFIG.DEFAULT_CORS_ORIGINS;

  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

}


function getCorsOrigin(request, env) {

  const requestOrigin =
    request.headers.get("Origin");

  /*
   * Requests without Origin do not require
   * Access-Control-Allow-Origin.
   */

  if (!requestOrigin) {

    return null;

  }


  const allowedOrigins =
    getAllowedCorsOrigins(env);


  /*
   * Exact origin matching.
   *
   * Never reflect arbitrary Origin headers.
   */

  if (
    allowedOrigins.includes(
      requestOrigin
    )
  ) {

    return requestOrigin;

  }


  return null;

}


function corsHeaders(request, env) {

  const origin =
    getCorsOrigin(
      request,
      env
    );


  const headers = {

    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With, X-Request-ID",

    "Access-Control-Expose-Headers":
      "X-Request-ID",

    "Access-Control-Max-Age":
      "86400",

    "Vary":
      "Origin"

  };


  /*
   * Only return ACAO for explicitly
   * configured origins.
   */

  if (origin) {

    headers[
      "Access-Control-Allow-Origin"
    ] = origin;

  }


  return headers;

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

      success:
        false,

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

    console.error(
      payload
    );

  } else if (level === "warn") {

    console.warn(
      payload
    );

  } else {

    console.log(
      payload
    );

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
    !Number.isFinite(
      number
    )
  ) {

    return null;

  }


  return number;

}


function validateBodySize(request) {

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

async function readJSON(request) {

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


  /*
   * Read the body ourselves so the actual UTF-8
   * byte size is checked even when Content-Length
   * is unavailable.
   */

  const bodyText =
    await request.text();


  const bodyBytes =
    new TextEncoder().encode(
      bodyText
    ).byteLength;


  if (
    bodyBytes >
    CONFIG.MAX_BODY_BYTES
  ) {

    const error =
      new Error(
        "Request body exceeds the permitted size."
      );

    error.code =
      "PAYLOAD_TOO_LARGE";

    throw error;

  }


  if (!bodyText.trim()) {

    throw new Error(
      "Request body must not be empty."
    );

  }


  try {

    return JSON.parse(
      bodyText
    );

  } catch {

    throw new Error(
      "A valid JSON request body is required."
    );

  }

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

      success:
        true,

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

      success:
        true,

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

      success:
        true,

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
 * 15. AI REQUEST NORMALIZATION
 * ================================================================ */

function normalizeAIRequest(
  body
) {

  /*
   * Supported format #1:
   *
   * {
   *   "prompt": "Hello"
   * }
   *
   * Supported format #2:
   *
   * {
   *   "contents": [
   *     {
   *       "role": "user",
   *       "parts": [
   *         {
   *           "text": "Hello"
   *         }
   *       ]
   *     }
   *   ]
   * }
   *
   * Optional:
   *
   * generationConfig
   * systemInstruction
   * tools
   */


  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {

    throw new Error(
      "Request body must be a JSON object."
    );

  }


  /* ------------------------------------------------------------
   * Direct Gemini contents
   * ---------------------------------------------------------- */

  if (
    Array.isArray(
      body.contents
    )
  ) {

    if (
      body.contents.length === 0
    ) {

      throw new Error(
        "contents must not be empty."
      );

    }


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

      ...(Array.isArray(
        body.tools
      )
        ? {
            tools:
              body.tools
          }
        : {})

    };

  }


  /* ------------------------------------------------------------
   * Simple prompt format
   * ---------------------------------------------------------- */

  if (
    typeof body.prompt ===
    "string"
  ) {

    const prompt =
      body.prompt.trim();


    if (!prompt) {

      throw new Error(
        "prompt must not be empty."
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

      ...(Array.isArray(
        body.tools
      )
        ? {
            tools:
              body.tools
          }
        : {})

    };

  }


  throw new Error(
    "Provide either a non-empty prompt or a contents array."
  );

}


/* ================================================================
 * 16. AI PROXY TOKEN AUTHENTICATION
 * ================================================================ */

function validateAIProxyToken(
  request,
  env
) {

  const configuredToken =
    env?.AI_PROXY_TOKEN;


  if (
    typeof configuredToken !==
      "string" ||
    !configuredToken.trim()
  ) {

    return {

      valid:
        false,

      code:
        "AI_PROXY_TOKEN_NOT_CONFIGURED",

      message:
        "AI proxy authentication is not configured."

    };

  }


  const authorization =
    request.headers.get(
      "Authorization"
    ) || "";


  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {

    return {

      valid:
        false,

      code:
        "AI_PROXY_UNAUTHORIZED",

      message:
        "Valid AI proxy authorization is required."

    };

  }


  const suppliedToken =
    authorization
      .slice(7)
      .trim();


  if (!suppliedToken) {

    return {

      valid:
        false,

      code:
        "AI_PROXY_UNAUTHORIZED",

      message:
        "Valid AI proxy authorization is required."

    };

  }


  if (
    suppliedToken !==
    configuredToken.trim()
  ) {

    return {

      valid:
        false,

      code:
        "AI_PROXY_UNAUTHORIZED",

      message:
        "Valid AI proxy authorization is required."

    };

  }


  return {

    valid:
      true

  };

}


/* ================================================================
 * 17. GEMINI MODEL
 * ================================================================ */

function getGeminiModel(
  env
) {

  const model =
    env?.GEMINI_MODEL;


  if (
    typeof model ===
      "string" &&
    model.trim()
  ) {

    return model.trim();

  }


  return CONFIG.DEFAULT_GEMINI_MODEL;

}


/* ================================================================
 * 18. GEMINI RESPONSE NORMALIZATION
 * ================================================================ */

function normalizeGeminiResponse(
  providerData,
  requestId,
  model
) {

  const text =
    providerData
      ?.candidates?.[0]
      ?.content?.parts
      ?.filter(
        part =>
          typeof part?.text ===
          "string"
      )
      ?.map(
        part =>
          part.text
      )
      ?.join("") || "";


  const candidate =
    providerData
      ?.candidates?.[0];


  return {

    success:
      true,

    data: {

      text,

      model:
        model || null,

      finishReason:
        candidate?.finishReason ||
        null

    },

    requestId

  };

}


/* ================================================================
 * 19. GEMINI AI PROXY
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


  /* ------------------------------------------------------------
   * Method validation
   * ---------------------------------------------------------- */

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


  /* ------------------------------------------------------------
   * AI proxy authentication
   * ---------------------------------------------------------- */

  const proxyAuth =
    validateAIProxyToken(
      request,
      env
    );


  if (!proxyAuth.valid) {

    return errorResponse(

      request,

      env,

      proxyAuth.code ===
        "AI_PROXY_TOKEN_NOT_CONFIGURED"
        ? 503
        : 401,

      proxyAuth.code,

      proxyAuth.message,

      requestId

    );

  }


  /* ------------------------------------------------------------
   * Gemini API secret validation
   * ---------------------------------------------------------- */

  const apiKey =
    env?.GEMINI_API_KEY;


  if (
    typeof apiKey !==
      "string" ||
    !apiKey.trim()
  ) {

    return errorResponse(

      request,

      env,

      503,

      "GEMINI_API_KEY_NOT_CONFIGURED",

      "Gemini API service is not configured.",

      requestId

    );

  }


  /* ------------------------------------------------------------
   * Content-Length protection
   * ---------------------------------------------------------- */

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
      error?.code ===
      "PAYLOAD_TOO_LARGE"
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
   * Normalize AI request
   * ---------------------------------------------------------- */

  let geminiPayload;


  try {

    geminiPayload =
      normalizeAIRequest(
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
   * Determine Gemini model
   * ---------------------------------------------------------- */

  const model =
    getGeminiModel(
      env
    );


  /* ------------------------------------------------------------
   * Build Gemini endpoint
   * ---------------------------------------------------------- */

  const endpoint =
    `${CONFIG.GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`;


  /* ------------------------------------------------------------
   * Log request metadata only
   *
   * Never log the API key or proxy token.
   * ---------------------------------------------------------- */

  log(

    env,

    "info",

    "Gemini AI request",

    {

      requestId,

      model

    }

  );


  /* ------------------------------------------------------------
   * Call Gemini
   * ---------------------------------------------------------- */

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
              apiKey

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

      "GEMINI_UPSTREAM_ERROR",

      "Unable to connect to the Gemini API.",

      requestId

    );

  }


  /* ------------------------------------------------------------
   * Read Gemini response once
   * ---------------------------------------------------------- */

  const responseText =
    await upstreamResponse.text();


  /* ------------------------------------------------------------
   * Log upstream status
   * ---------------------------------------------------------- */

  log(

    env,

    upstreamResponse.ok
      ? "info"
      : "error",

    "Gemini upstream response",

    {

      requestId,

      model,

      status:
        upstreamResponse.status

    }

  );


  /* ------------------------------------------------------------
   * Successful Gemini response
   * ---------------------------------------------------------- */

  if (
    upstreamResponse.ok
  ) {

    let providerData;


    try {

      providerData =
        JSON.parse(
          responseText
        );

    } catch {

      return errorResponse(

        request,

        env,

        502,

        "GEMINI_INVALID_RESPONSE",

        "Gemini returned an invalid JSON response.",

        requestId

      );

    }


    return jsonResponse(

      request,

      env,

      normalizeGeminiResponse(

        providerData,

        requestId,

        model

      ),

      200

    );

  }


  /* ------------------------------------------------------------
   * Gemini upstream failure
   *
   * Do not expose the raw provider response to the browser.
   * ---------------------------------------------------------- */

  let upstreamStatus =
    upstreamResponse.status;


  /*
   * Keep provider HTTP status where it is a valid
   * client/server response status.
   */

  if (
    !Number.isInteger(
      upstreamStatus
    ) ||
    upstreamStatus < 400 ||
    upstreamStatus > 599
  ) {

    upstreamStatus =
      502;

  }


  return errorResponse(

    request,

    env,

    upstreamStatus,

    "GEMINI_UPSTREAM_ERROR",

    "Gemini AI request was rejected by the upstream service.",

    requestId

  );

}


/* ================================================================
 * 20. API ROUTER
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


  /* ------------------------------------------------------------
   * Health
   * ---------------------------------------------------------- */

  if (
    path ===
    CONFIG.HEALTH_PATH
  ) {

    return handleHealth(
      request,
      env
    );

  }


  /* ------------------------------------------------------------
   * Version
   * ---------------------------------------------------------- */

  if (
    path ===
    CONFIG.VERSION_PATH
  ) {

    return handleVersion(
      request,
      env
    );

  }


  /* ------------------------------------------------------------
   * Information
   * ---------------------------------------------------------- */

  if (
    path ===
    CONFIG.INFO_PATH
  ) {

    return handleInfo(
      request,
      env
    );

  }


  /* ------------------------------------------------------------
   * AI
   * ---------------------------------------------------------- */

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


  /* ------------------------------------------------------------
   * Unknown API route
   * ---------------------------------------------------------- */

  return errorResponse(

    request,

    env,

    404,

    "API_ROUTE_NOT_FOUND",

    "The requested API route does not exist.",

    request.headers.get(
      "X-Request-ID"
    ) || createRequestId()

  );

}


/* ================================================================
 * 21. ROOT RESPONSE
 * ================================================================ */

async function handleRoot(
  request,
  env
) {

  return jsonResponse(

    request,

    env,

    {

      success:
        true,

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
 * 22. REQUEST-ID RESPONSE HEADER
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
 * 23. GLOBAL REQUEST HANDLER
 * ================================================================ */

async function handleRequest(
  request,
  env,
  ctx
) {

  const requestId =
    request.headers.get(
      "X-Request-ID"
    ) ||
    createRequestId();


  const url =
    new URL(
      request.url
    );


  /* ------------------------------------------------------------
   * Clone request and attach request ID
   * ---------------------------------------------------------- */

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


  /* ------------------------------------------------------------
   * Logging
   * ---------------------------------------------------------- */

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

    return addRequestId(

      new Response(

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

      ),

      requestId

    );

  }


  /* ------------------------------------------------------------
   * Request-size protection
   * ---------------------------------------------------------- */

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
   * Root
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
 * 24. GLOBAL FATAL ERROR HANDLER
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
 * 25. CLOUDFLARE MODULE WORKER ENTRY POINT
 * ================================================================ */

export default {

  async fetch(
    request,
    env,
    ctx
  ) {

    const requestId =
      request.headers.get(
        "X-Request-ID"
      ) ||
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


/* ================================================================
 * END OF FILE
 * ================================================================ */
