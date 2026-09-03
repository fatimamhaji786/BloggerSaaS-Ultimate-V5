/**
 * =====================================================================
 * BloggerSaaS Ultimate V5
 * Cloudflare Worker V5.1.8 Enterprise
 * =====================================================================
 *
 * File:
 *   worker/worker/worker.js
 *
 * Version:
 *   5.1.8 Enterprise
 *
 * Architecture:
 *
 * Blogger AI Center V2.4.6 Enterprise
 *                |
 *                v
 * Cloudflare Worker V5.1.8 Enterprise
 *                |
 *                +-- Authentication
 *                +-- Operation Validation
 *                +-- Prompt Control
 *                +-- Rate Protection
 *                +-- Request Validation
 *                +-- Gemini AI Proxy
 *                |
 *                v
 *             Gemini API
 *
 *
 * SECURITY PRINCIPLES
 * ---------------------------------------------------------------------
 *
 * 1. GEMINI_API_KEY remains only in Cloudflare Secret.
 *
 * 2. AI instructions are controlled server-side.
 *
 * 3. Browser requests select an approved operation.
 *
 * 4. Arbitrary unrestricted system prompts are not accepted.
 *
 * 5. Firebase ID tokens can authenticate administrators.
 *
 * 6. Optional AI_PROXY_TOKEN can be used for controlled service access.
 *
 * 7. Generated code is returned as content only.
 *    This Worker NEVER automatically publishes generated code.
 *
 *
 * REQUIRED CLOUDFLARE SECRETS
 * ---------------------------------------------------------------------
 *
 * GEMINI_API_KEY
 *
 *
 * RECOMMENDED VARIABLES
 * ---------------------------------------------------------------------
 *
 * GEMINI_MODEL
 * CORS_ORIGINS
 * FIREBASE_PROJECT_ID
 *
 *
 * OPTIONAL SECRETS
 * ---------------------------------------------------------------------
 *
 * AI_PROXY_TOKEN
 *
 *
 * OPTIONAL VARIABLES
 * ---------------------------------------------------------------------
 *
 * REQUIRE_FIREBASE_AUTH=true
 * ALLOW_SERVICE_TOKEN=true
 * MAX_REQUESTS_PER_MINUTE=20
 *
 *
 * APPROVED OPERATIONS
 * ---------------------------------------------------------------------
 *
 * tool-generation
 * seo-generation
 * summary-generation
 * content-generation
 * tool-improvement
 * tool-debugging
 *
 * =====================================================================
 */

"use strict";


/* =====================================================================
 * 1. APPLICATION CONFIGURATION
 * ===================================================================== */

const CONFIG = Object.freeze({

  APP_NAME:
    "BloggerSaaS Ultimate V5",

  VERSION:
    "5.1.8 Enterprise",

  API_PREFIX:
    "/api",

  HEALTH_PATH:
    "/api/health",

  VERSION_PATH:
    "/api/version",

  INFO_PATH:
    "/api/info",

  AI_PATH:
    "/api/ai",

  AI_OPERATIONS_PATH:
    "/api/ai/operations",


  /* ---------------------------------------------------------------
   * Request protection
   * ------------------------------------------------------------- */

  MAX_BODY_BYTES:
    1024 * 1024,


  MAX_PROMPT_CHARACTERS:
    50000,


  MAX_CONTEXT_CHARACTERS:
    100000,


  DEFAULT_MAX_REQUESTS_PER_MINUTE:
    20,


  /* ---------------------------------------------------------------
   * Gemini
   * ------------------------------------------------------------- */

  GEMINI_API_BASE:
    "https://generativelanguage.googleapis.com/v1beta",

  DEFAULT_GEMINI_MODEL:
    "gemini-2.5-flash",


  /* ---------------------------------------------------------------
   * Logging
   * ------------------------------------------------------------- */

  ENABLE_LOGS:
    true,


  /* ---------------------------------------------------------------
   * Firebase
   * ------------------------------------------------------------- */

  FIREBASE_CERT_URL:
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",


  /* ---------------------------------------------------------------
   * Supported operations
   * ------------------------------------------------------------- */

  OPERATIONS:
    Object.freeze([

      "tool-generation",

      "seo-generation",

      "summary-generation",

      "content-generation",

      "tool-improvement",

      "tool-debugging"

    ])

});


/* =====================================================================
 * 2. SECURITY HEADERS
 * ===================================================================== */

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


/* =====================================================================
 * 3. IN-MEMORY RATE LIMIT STORAGE
 *
 * IMPORTANT:
 *
 * Cloudflare Workers do not guarantee global shared memory.
 *
 * This provides lightweight per-isolate protection.
 *
 * For strict global enterprise rate limiting, later use:
 *
 * - Cloudflare Rate Limiting
 * - Durable Objects
 * - Cloudflare KV
 * - Cloudflare WAF
 *
 * ===================================================================== */

const RATE_LIMIT_STORE =
  new Map();


/* =====================================================================
 * 4. FIREBASE CERTIFICATE CACHE
 * ===================================================================== */

let FIREBASE_CERT_CACHE = {

  certificates:
    null,

  expiresAt:
    0

};


/* =====================================================================
 * 5. BASIC UTILITIES
 * ===================================================================== */

function createRequestId() {

  return crypto.randomUUID();

}


function nowISO() {

  return new Date().toISOString();

}


function getEnvString(
  value,
  fallback = ""
) {

  if (
    typeof value === "string" &&
    value.trim()
  ) {

    return value.trim();

  }

  return fallback;

}


function getEnvBoolean(
  value,
  fallback = false
) {

  if (
    typeof value !== "string"
  ) {

    return fallback;

  }


  const normalized =
    value.trim().toLowerCase();


  if (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes"
  ) {

    return true;

  }


  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "no"
  ) {

    return false;

  }


  return fallback;

}


function getEnvNumber(
  value,
  fallback
) {

  const number =
    Number(value);


  if (
    Number.isFinite(number) &&
    number > 0
  ) {

    return Math.floor(number);

  }


  return fallback;

}


/* =====================================================================
 * 6. LOGGING
 *
 * Never log:
 *
 * - Gemini API key
 * - Authorization token
 * - Firebase token
 * - Complete private prompts
 *
 * ===================================================================== */

function log(
  env,
  level,
  message,
  metadata = {}
) {

  if (
    !CONFIG.ENABLE_LOGS
  ) {

    return;

  }


  const payload = {

    application:
      CONFIG.APP_NAME,

    version:
      CONFIG.VERSION,

    level,

    message,

    timestamp:
      nowISO(),

    ...metadata

  };


  if (
    level === "error"
  ) {

    console.error(payload);

  }

  else if (
    level === "warn"
  ) {

    console.warn(payload);

  }

  else {

    console.log(payload);

  }

}


/* =====================================================================
 * 7. CORS
 * ===================================================================== */

function getAllowedCorsOrigins(
  env
) {

  const origins =
    getEnvString(
      env?.CORS_ORIGINS,
      ""
    );


  if (!origins) {

    return [];

  }


  return origins
    .split(",")
    .map(
      origin =>
        origin.trim()
    )
    .filter(Boolean);

}


function getCorsOrigin(
  request,
  env
) {

  const requestOrigin =
    request.headers.get(
      "Origin"
    );


  if (!requestOrigin) {

    return null;

  }


  const allowedOrigins =
    getAllowedCorsOrigins(
      env
    );


  if (
    allowedOrigins.includes(
      requestOrigin
    )
  ) {

    return requestOrigin;

  }


  return null;

}


function corsHeaders(
  request,
  env
) {

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


  if (origin) {

    headers[
      "Access-Control-Allow-Origin"
    ] =
      origin;

  }


  return headers;

}


/* =====================================================================
 * 8. RESPONSE HEADERS
 * ===================================================================== */

function buildHeaders(
  request,
  env,
  extraHeaders = {}
) {

  return {

    ...SECURITY_HEADERS,

    ...corsHeaders(
      request,
      env
    ),

    ...extraHeaders

  };

}


/* =====================================================================
 * 9. JSON RESPONSE
 * ===================================================================== */

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


/* =====================================================================
 * 10. ERROR RESPONSE
 * ===================================================================== */

function errorResponse(
  request,
  env,
  status,
  code,
  message,
  requestId,
  details = null
) {

  const response = {

    success:
      false,

    error: {

      code,

      message

    },

    requestId,

    timestamp:
      nowISO()

  };


  if (details) {

    response.error.details =
      details;

  }


  return jsonResponse(

    request,

    env,

    response,

    status

  );

}


/* =====================================================================
 * 11. REQUEST SIZE VALIDATION
 * ===================================================================== */

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

  const length =
    getContentLength(
      request
    );


  if (
    length !== null &&
    length >
      CONFIG.MAX_BODY_BYTES
  ) {

    return false;

  }


  return true;

}


/* =====================================================================
 * 12. JSON REQUEST PARSER
 * ===================================================================== */

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


  const bodyText =
    await request.text();


  const bodyBytes =
    new TextEncoder()
      .encode(bodyText)
      .byteLength;


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


  if (
    !bodyText.trim()
  ) {

    throw new Error(
      "Request body must not be empty."
    );

  }


  try {

    return JSON.parse(
      bodyText
    );

  }

  catch {

    throw new Error(
      "A valid JSON request body is required."
    );

  }

}


/* =====================================================================
 * 13. BASE64URL UTILITIES
 * ===================================================================== */

function base64UrlToUint8Array(
  value
) {

  const normalized =
    value
      .replace(/-/g, "+")
      .replace(/_/g, "/");


  const padding =
    "=".repeat(
      (4 - normalized.length % 4) % 4
    );


  const base64 =
    normalized +
    padding;


  const binary =
    atob(base64);


  const bytes =
    new Uint8Array(
      binary.length
    );


  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(i);

  }


  return bytes;

}


function decodeBase64UrlJSON(
  value
) {

  const bytes =
    base64UrlToUint8Array(
      value
    );


  const text =
    new TextDecoder()
      .decode(bytes);


  return JSON.parse(text);

}


/* =====================================================================
 * 14. FETCH FIREBASE CERTIFICATES
 * ===================================================================== */

async function getFirebaseCertificates() {

  const now =
    Date.now();


  if (
    FIREBASE_CERT_CACHE.certificates &&
    FIREBASE_CERT_CACHE.expiresAt >
      now
  ) {

    return FIREBASE_CERT_CACHE.certificates;

  }


  const response =
    await fetch(
      CONFIG.FIREBASE_CERT_URL
    );


  if (!response.ok) {

    throw new Error(
      "Unable to retrieve Firebase authentication certificates."
    );

  }


  const certificates =
    await response.json();


  let cacheSeconds =
    3600;


  const cacheControl =
    response.headers.get(
      "Cache-Control"
    ) || "";


  const match =
    cacheControl.match(
      /max-age=(\d+)/
    );


  if (
    match &&
    match[1]
  ) {

    cacheSeconds =
      Number(match[1]);

  }


  FIREBASE_CERT_CACHE = {

    certificates,

    expiresAt:
      now +
      cacheSeconds * 1000

  };


  return certificates;

}


/* =====================================================================
 * 15. FIREBASE ID TOKEN VERIFICATION
 *
 * Verifies:
 *
 * - JWT format
 * - RS256 algorithm
 * - Firebase project audience
 * - Firebase issuer
 * - expiration
 * - issued time
 * - signature
 *
 * ===================================================================== */

async function verifyFirebaseIdToken(
  token,
  env
) {

  const projectId =
    getEnvString(
      env?.FIREBASE_PROJECT_ID
    );


  if (!projectId) {

    throw new Error(
      "FIREBASE_PROJECT_ID is not configured."
    );

  }


  if (
    typeof token !== "string" ||
    !token.trim()
  ) {

    throw new Error(
      "Firebase ID token is required."
    );

  }


  const parts =
    token.split(".");


  if (
    parts.length !== 3
  ) {

    throw new Error(
      "Invalid Firebase ID token format."
    );

  }


  const header =
    decodeBase64UrlJSON(
      parts[0]
    );


  const payload =
    decodeBase64UrlJSON(
      parts[1]
    );


  if (
    header.alg !== "RS256"
  ) {

    throw new Error(
      "Unsupported Firebase token algorithm."
    );

  }


  if (
    typeof header.kid !== "string" ||
    !header.kid
  ) {

    throw new Error(
      "Firebase token key identifier is missing."
    );

  }


  const expectedIssuer =
    `https://securetoken.google.com/${projectId}`;


  if (
    payload.aud !== projectId
  ) {

    throw new Error(
      "Firebase token audience is invalid."
    );

  }


  if (
    payload.iss !== expectedIssuer
  ) {

    throw new Error(
      "Firebase token issuer is invalid."
    );

  }


  if (
    typeof payload.sub !== "string" ||
    !payload.sub ||
    payload.sub.length > 128
  ) {

    throw new Error(
      "Firebase token subject is invalid."
    );

  }


  const nowSeconds =
    Math.floor(
      Date.now() / 1000
    );


  if (
    typeof payload.exp !== "number" ||
    payload.exp <= nowSeconds
  ) {

    throw new Error(
      "Firebase token has expired."
    );

  }


  if (
    typeof payload.iat !== "number" ||
    payload.iat > nowSeconds + 300
  ) {

    throw new Error(
      "Firebase token issue time is invalid."
    );

  }


  const certificates =
    await getFirebaseCertificates();


  const certificate =
    certificates[
      header.kid
    ];


  if (!certificate) {

    throw new Error(
      "Firebase token signing certificate was not found."
    );

  }


  const publicKey =
    await crypto.subtle.importKey(

      "spki",

      pemToArrayBuffer(
        certificate
      ),

      {

        name:
          "RSASSA-PKCS1-v1_5",

        hash:
          "SHA-256"

      },

      false,

      ["verify"]

    );


  const signedData =
    new TextEncoder()
      .encode(
        `${parts[0]}.${parts[1]}`
      );


  const signature =
    base64UrlToUint8Array(
      parts[2]
    );


  const valid =
    await crypto.subtle.verify(

      {

        name:
          "RSASSA-PKCS1-v1_5"

      },

      publicKey,

      signature,

      signedData

    );


  if (!valid) {

    throw new Error(
      "Firebase token signature is invalid."
    );

  }


  return {

    uid:
      payload.sub,

    email:
      typeof payload.email === "string"
        ? payload.email
        : null,

    emailVerified:
      payload.email_verified === true,

    claims:
      payload

  };

}


/* =====================================================================
 * 16. PEM TO ARRAY BUFFER
 * ===================================================================== */

function pemToArrayBuffer(
  pem
) {

  const base64 =
    pem

      .replace(
        /-----BEGIN CERTIFICATE-----/g,
        ""
      )

      .replace(
        /-----END CERTIFICATE-----/g,
        ""
      )

      .replace(
        /\s/g,
        ""
      );


  const binary =
    atob(base64);


  const bytes =
    new Uint8Array(
      binary.length
    );


  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(i);

  }


  return bytes.buffer;

}


/* =====================================================================
 * 17. SERVICE TOKEN AUTHENTICATION
 *
 * Optional controlled service access.
 *
 * DO NOT place this permanent secret in a public Blogger page.
 *
 * ===================================================================== */

function validateServiceToken(
  request,
  env
) {

  const configuredToken =
    getEnvString(
      env?.AI_PROXY_TOKEN
    );


  if (!configuredToken) {

    return false;

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

    return false;

  }


  const suppliedToken =
    authorization
      .slice(7)
      .trim();


  if (!suppliedToken) {

    return false;

  }


  return constantTimeEqual(
    suppliedToken,
    configuredToken
  );

}


/* =====================================================================
 * 18. CONSTANT-TIME STRING COMPARISON
 * ===================================================================== */

function constantTimeEqual(
  first,
  second
) {

  if (
    typeof first !== "string" ||
    typeof second !== "string"
  ) {

    return false;

  }


  if (
    first.length !== second.length
  ) {

    return false;

  }


  let result = 0;


  for (
    let i = 0;
    i < first.length;
    i++
  ) {

    result |=
      first.charCodeAt(i) ^
      second.charCodeAt(i);

  }


  return result === 0;

}


/* =====================================================================
 * 19. ENTERPRISE AUTHENTICATION
 *
 * Priority:
 *
 * 1. Firebase ID Token
 * 2. Optional service token
 *
 * ===================================================================== */

async function authenticateRequest(
  request,
  env
) {

  const requireFirebaseAuth =
    getEnvBoolean(
      env?.REQUIRE_FIREBASE_AUTH,
      true
    );


  const allowServiceToken =
    getEnvBoolean(
      env?.ALLOW_SERVICE_TOKEN,
      false
    );


  const authorization =
    request.headers.get(
      "Authorization"
    ) || "";


  if (
    authorization.startsWith(
      "Bearer "
    )
  ) {

    const token =
      authorization
        .slice(7)
        .trim();


    if (token) {

      try {

        const firebaseUser =
          await verifyFirebaseIdToken(
            token,
            env
          );


        return {

          authenticated:
            true,

          method:
            "firebase",

          user:
            firebaseUser

        };

      }

      catch (firebaseError) {

        if (
          allowServiceToken &&
          validateServiceToken(
            request,
            env
          )
        ) {

          return {

            authenticated:
              true,

            method:
              "service-token",

            user:
              null

          };

        }


        if (
          requireFirebaseAuth
        ) {

          return {

            authenticated:
              false,

            code:
              "FIREBASE_AUTH_INVALID",

            message:
              "Valid Firebase authentication is required."

          };

        }

      }

    }

  }


  if (
    allowServiceToken &&
    validateServiceToken(
      request,
      env
    )
  ) {

    return {

      authenticated:
        true,

      method:
        "service-token",

      user:
        null

    };

  }


  if (!requireFirebaseAuth) {

    return {

      authenticated:
        true,

      method:
        "public-development",

      user:
        null

    };

  }


  return {

    authenticated:
      false,

    code:
      "AUTHENTICATION_REQUIRED",

    message:
      "Authentication is required."

  };

}


/* =====================================================================
 * 20. RATE LIMITING
 * ===================================================================== */

function getClientIdentifier(
  request,
  identity = null
) {

  if (
    identity?.user?.uid
  ) {

    return `firebase:${identity.user.uid}`;

  }


  const forwarded =
    request.headers.get(
      "CF-Connecting-IP"
    );


  if (forwarded) {

    return `ip:${forwarded}`;

  }


  return "anonymous";

}


function checkRateLimit(
  request,
  env,
  identity
) {

  const limit =
    getEnvNumber(
      env?.MAX_REQUESTS_PER_MINUTE,
      CONFIG.DEFAULT_MAX_REQUESTS_PER_MINUTE
    );


  const identifier =
    getClientIdentifier(
      request,
      identity
    );


  const now =
    Date.now();


  const windowMs =
    60 * 1000;


  const record =
    RATE_LIMIT_STORE.get(
      identifier
    );


  if (
    !record ||
    now - record.start >= windowMs
  ) {

    RATE_LIMIT_STORE.set(

      identifier,

      {

        start:
          now,

        count:
          1

      }

    );


    return {

      allowed:
        true,

      remaining:
        limit - 1

    };

  }


  record.count += 1;


  if (
    record.count > limit
  ) {

    return {

      allowed:
        false,

      remaining:
        0

    };

  }


  return {

    allowed:
      true,

    remaining:
      Math.max(
        0,
        limit - record.count
      )

  };

}


/* =====================================================================
 * 21. OPERATION VALIDATION
 * ===================================================================== */

function validateOperation(
  operation
) {

  if (
    typeof operation !== "string"
  ) {

    return false;

  }


  return CONFIG.OPERATIONS.includes(
    operation.trim()
  );

}


/* =====================================================================
 * 22. STRING VALIDATION
 * ===================================================================== */

function getSafeString(
  value,
  maxLength = 50000
) {

  if (
    typeof value !== "string"
  ) {

    return "";

  }


  return value
    .trim()
    .slice(
      0,
      maxLength
    );

}


/* =====================================================================
 * 23. AI REQUEST NORMALIZATION
 *
 * Browser request format:
 *
 * {
 *   operation: "tool-generation",
 *   prompt: "...",
 *   context: {...},
 *   generationConfig: {...}
 * }
 *
 * ===================================================================== */

function normalizeEnterpriseAIRequest(
  body
) {

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {

    throw new Error(
      "Request body must be a JSON object."
    );

  }


  const operation =
    getSafeString(
      body.operation,
      100
    );


  if (
    !validateOperation(
      operation
    )
  ) {

    throw new Error(
      "The requested AI operation is not supported."
    );

  }


  const prompt =
    getSafeString(
      body.prompt,
      CONFIG.MAX_PROMPT_CHARACTERS
    );


  if (!prompt) {

    throw new Error(
      "A non-empty prompt is required."
    );

  }


  let context = {};


  if (
    body.context &&
    typeof body.context === "object" &&
    !Array.isArray(body.context)
  ) {

    const serialized =
      JSON.stringify(
        body.context
      );


    if (
      serialized.length <=
      CONFIG.MAX_CONTEXT_CHARACTERS
    ) {

      context =
        body.context;

    }

  }


  let generationConfig =
    sanitizeGenerationConfig(
      body.generationConfig
    );


  return {

    operation,

    prompt,

    context,

    generationConfig

  };

}


/* =====================================================================
 * 24. GENERATION CONFIG SANITIZATION
 * ===================================================================== */

function sanitizeGenerationConfig(
  value
) {

  const defaults = {

    temperature:
      0.4,

    maxOutputTokens:
      8192

  };


  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {

    return defaults;

  }


  const result =
    {

      ...defaults

    };


  if (
    Number.isFinite(
      value.temperature
    )
  ) {

    result.temperature =
      Math.min(
        1.5,
        Math.max(
          0,
          Number(value.temperature)
        )
      );

  }


  if (
    Number.isFinite(
      value.maxOutputTokens
    )
  ) {

    result.maxOutputTokens =
      Math.min(
        16384,
        Math.max(
          256,
          Math.floor(
            Number(
              value.maxOutputTokens
            )
          )
        )
      );

  }


  return result;

}


/* =====================================================================
 * 25. SERVER-SIDE SYSTEM PROMPTS
 *
 * These prompts are controlled by the Worker.
 *
 * The browser does NOT provide unrestricted system instructions.
 *
 * ===================================================================== */

function getSystemInstruction(
  operation
) {

  const common = `
You are the Enterprise AI engine for BloggerSaaS Ultimate V5.

Follow these requirements:

1. Be accurate and practical.
2. Do not claim that generated content has been automatically tested.
3. Do not invent external API credentials.
4. Never include real secrets, API keys, passwords or tokens.
5. Generate original, maintainable and clearly structured output.
6. Generated tools must be responsive and suitable for browser use.
7. Prefer HTML, CSS and vanilla JavaScript unless another technology is explicitly required.
8. Do not automatically publish anything.
9. Return useful structured content.
10. When uncertainty exists, clearly identify assumptions.
`;


  const instructions = {

    "tool-generation": `
${common}

Your task is to design a complete web tool.

Create a sophisticated structured tool specification.

Consider the following sections:

- toolName
- category
- shortDescription
- purpose
- targetUsers
- mainFeatures
- inputs
- outputs
- validation
- uniqueness
- speciality
- additionalInformation
- howToUse
- tips
- seo
- faq
- generatedCode

The generatedCode section should contain:

- html
- css
- javascript

The tool should work in a browser without exposing private credentials.

For calculators and specialised tools, provide meaningful contextual results.

Examples:

Age Calculator:
- age in years, months and days
- total months
- total weeks
- total days
- next birthday date
- weekday of next birthday
- days remaining until birthday
- Western zodiac
- Chinese zodiac where possible
- clearly labelled calendar/date assumptions
- brief tips
- clearly labelled entertainment-only fun content where applicable

BMI Calculator:
- BMI result
- category
- healthy range guidance
- approximate weight difference from a selected reference range
- kg and pound support
- age-aware general lifestyle suggestions
- simple exercise ideas
- balanced food suggestions
- clear disclaimer that the tool is informational and not medical diagnosis

Do not present entertainment predictions as guaranteed facts.
`,



    "seo-generation": `
${common}

Create an enterprise-quality SEO content plan.

Include:

- title ideas
- SEO title
- meta description
- primary keyword
- secondary keywords
- search intent
- target audience
- recommended URL slug
- H1
- H2 structure
- FAQ ideas
- internal link ideas
- content recommendations
- call to action

Avoid keyword stuffing.
`,



    "summary-generation": `
${common}

Create an accurate summary of the supplied text.

Rules:

- Preserve important facts.
- Do not invent missing information.
- Distinguish facts from assumptions.
- Use clear language.
- Respect the requested summary length.

Provide:

- summary
- keyPoints
- importantFacts
- optionalActionItems where appropriate
`,



    "content-generation": `
${common}

Generate high-quality structured content based on the user's request.

Include:

- title
- introduction
- organised sections
- practical information
- conclusion

Make the output suitable for later human review.
`,



    "tool-improvement": `
${common}

Analyse an existing web tool specification or code.

Identify:

- strengths
- weaknesses
- missing features
- accessibility improvements
- mobile improvements
- validation improvements
- usability improvements
- SEO improvements
- performance improvements

Provide improved recommendations and revised code where appropriate.
`,



    "tool-debugging": `
${common}

Analyse the supplied web tool code or error.

Provide:

- probable cause
- explanation
- recommended fix
- corrected code where possible
- testing checklist

Do not claim the code was executed unless execution evidence is provided.
`

  };


  return instructions[
    operation
  ] || common;

}


/* =====================================================================
 * 26. BUILD GEMINI PAYLOAD
 * ===================================================================== */

function buildGeminiPayload(
  requestData
) {

  const contextText =
    Object.keys(
      requestData.context
    ).length

      ? `

CONTEXT:
${JSON.stringify(
  requestData.context,
  null,
  2
)}
`

      : "";


  const userPrompt = `
APPROVED OPERATION:
${requestData.operation}

USER REQUEST:
${requestData.prompt}

${contextText}

Return a structured, practical response suitable for human review.
`;


  return {

    systemInstruction: {

      parts: [

        {

          text:
            getSystemInstruction(
              requestData.operation
            )

        }

      ]

    },


    contents: [

      {

        role:
          "user",

        parts: [

          {

            text:
              userPrompt

          }

        ]

      }

    ],


    generationConfig:
      requestData.generationConfig

  };

}


/* =====================================================================
 * 27. GEMINI MODEL
 * ===================================================================== */

function getGeminiModel(
  env
) {

  return getEnvString(

    env?.GEMINI_MODEL,

    CONFIG.DEFAULT_GEMINI_MODEL

  );

}


/* =====================================================================
 * 28. EXTRACT GEMINI TEXT
 * ===================================================================== */

function extractGeminiText(
  providerData
) {

  const candidate =
    providerData
      ?.candidates?.[0];


  const parts =
    candidate
      ?.content
      ?.parts;


  if (
    !Array.isArray(parts)
  ) {

    return "";

  }


  return parts

    .filter(

      part =>
        typeof part?.text ===
        "string"

    )

    .map(
      part =>
        part.text
    )

    .join("")
    .trim();

}


/* =====================================================================
 * 29. EXTRACT JSON FROM AI RESPONSE
 *
 * Attempts to detect JSON when the AI returns:
 *
 * ```json
 * {...}
 * ```
 *
 * ===================================================================== */

function extractStructuredJSON(
  text
) {

  if (
    typeof text !== "string" ||
    !text.trim()
  ) {

    return null;

  }


  const cleaned =
    text.trim();


  try {

    return JSON.parse(
      cleaned
    );

  }

  catch {

    /* Continue */

  }


  const fenced =
    cleaned.match(
      /```json\s*([\s\S]*?)```/i
    );


  if (
    fenced &&
    fenced[1]
  ) {

    try {

      return JSON.parse(
        fenced[1].trim()
      );

    }

    catch {

      /* Continue */

    }

  }


  const objectStart =
    cleaned.indexOf("{");


  const objectEnd =
    cleaned.lastIndexOf("}");


  if (
    objectStart >= 0 &&
    objectEnd > objectStart
  ) {

    const possibleJSON =
      cleaned.slice(

        objectStart,

        objectEnd + 1

      );


    try {

      return JSON.parse(
        possibleJSON
      );

    }

    catch {

      return null;

    }

  }


  return null;

}


/* =====================================================================
 * 30. NORMALIZE GEMINI RESPONSE
 * ===================================================================== */

function normalizeGeminiResponse(
  providerData,
  requestId,
  model,
  operation
) {

  const candidate =
    providerData
      ?.candidates?.[0];


  const text =
    extractGeminiText(
      providerData
    );


  const structured =
    extractStructuredJSON(
      text
    );


  return {

    success:
      true,

    operation,

    data: {

      text,

      structured,

      model,

      finishReason:
        candidate?.finishReason ||
        null

    },

    requestId,

    timestamp:
      nowISO()

  };

}


/* =====================================================================
 * 31. HEALTH ENDPOINT
 * ===================================================================== */

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


/* =====================================================================
 * 32. VERSION ENDPOINT
 * ===================================================================== */

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
        "Enterprise Module Worker",

      timestamp:
        nowISO()

    }

  );

}


/* =====================================================================
 * 33. API INFORMATION ENDPOINT
 * ===================================================================== */

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
          CONFIG.AI_PATH,

        operations:
          CONFIG.AI_OPERATIONS_PATH

      },


      approvedOperations:
        CONFIG.OPERATIONS,


      capabilities: [

        "Firebase Authentication",

        "Optional Service Authentication",

        "Structured AI Operations",

        "Enterprise Tool Generation",

        "SEO Generation",

        "Summary Generation",

        "Content Generation",

        "Tool Improvement",

        "Tool Debugging",

        "Request Validation",

        "Request Size Protection",

        "Rate Protection",

        "Server-Side Prompt Control",

        "Gemini AI Proxy",

        "Security Headers",

        "Hardened CORS",

        "Request IDs",

        "Centralized Error Handling"

      ]

    }

  );

}


/* =====================================================================
 * 34. AI OPERATIONS ENDPOINT
 * ===================================================================== */

async function handleOperations(
  request,
  env
) {

  return jsonResponse(

    request,

    env,

    {

      success:
        true,

      operations:
        CONFIG.OPERATIONS.map(

          operation => ({

            operation,

            available:
              true

          })

        ),

      version:
        CONFIG.VERSION

    }

  );

}


/* =====================================================================
 * 35. GEMINI AI REQUEST
 * ===================================================================== */

async function handleAI(
  request,
  env,
  requestId
) {

  /* ---------------------------------------------------------------
   * Method validation
   * ------------------------------------------------------------- */

  if (
    request.method !== "POST"
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


  /* ---------------------------------------------------------------
   * Authentication
   * ------------------------------------------------------------- */

  const identity =
    await authenticateRequest(
      request,
      env
    );


  if (
    !identity.authenticated
  ) {

    return errorResponse(

      request,

      env,

      401,

      identity.code ||
        "UNAUTHORIZED",

      identity.message ||
        "Authentication is required.",

      requestId

    );

  }


  /* ---------------------------------------------------------------
   * Rate limiting
   * ------------------------------------------------------------- */

  const rateLimit =
    checkRateLimit(

      request,

      env,

      identity

    );


  if (
    !rateLimit.allowed
  ) {

    return errorResponse(

      request,

      env,

      429,

      "RATE_LIMITED",

      "Too many AI requests. Please wait before trying again.",

      requestId

    );

  }


  /* ---------------------------------------------------------------
   * Body size
   * ------------------------------------------------------------- */

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


  /* ---------------------------------------------------------------
   * Parse JSON
   * ------------------------------------------------------------- */

  let body;


  try {

    body =
      await readJSON(
        request
      );

  }

  catch (error) {

    return errorResponse(

      request,

      env,

      error?.code ===
      "PAYLOAD_TOO_LARGE"
        ? 413
        : 400,

      error?.code ||
        "INVALID_JSON",

      error instanceof Error
        ? error.message
        : "Invalid request body.",

      requestId

    );

  }


  /* ---------------------------------------------------------------
   * Normalize enterprise request
   * ------------------------------------------------------------- */

  let requestData;


  try {

    requestData =
      normalizeEnterpriseAIRequest(
        body
      );

  }

  catch (error) {

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


  /* ---------------------------------------------------------------
   * Gemini secret
   * ------------------------------------------------------------- */

  const apiKey =
    getEnvString(
      env?.GEMINI_API_KEY
    );


  if (!apiKey) {

    return errorResponse(

      request,

      env,

      503,

      "GEMINI_API_KEY_NOT_CONFIGURED",

      "AI service is not configured.",

      requestId

    );

  }


  /* ---------------------------------------------------------------
   * Model
   * ------------------------------------------------------------- */

  const model =
    getGeminiModel(
      env
    );


  /* ---------------------------------------------------------------
   * Build controlled payload
   * ------------------------------------------------------------- */

  const geminiPayload =
    buildGeminiPayload(
      requestData
    );


  /* ---------------------------------------------------------------
   * Endpoint
   * ------------------------------------------------------------- */

  const endpoint =
    `${CONFIG.GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`;


  /* ---------------------------------------------------------------
   * Safe logging
   * ------------------------------------------------------------- */

  log(

    env,

    "info",

    "Enterprise AI request",

    {

      requestId,

      operation:
        requestData.operation,

      model,

      authentication:
        identity.method

    }

  );


  /* ---------------------------------------------------------------
   * Gemini request
   * ------------------------------------------------------------- */

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

  }

  catch (error) {

    log(

      env,

      "error",

      "Gemini connection failed",

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

      "GEMINI_CONNECTION_ERROR",

      "Unable to connect to the AI provider.",

      requestId

    );

  }


  const responseText =
    await upstreamResponse.text();


  /* ---------------------------------------------------------------
   * Upstream error
   * ------------------------------------------------------------- */

  if (
    !upstreamResponse.ok
  ) {

    log(

      env,

      "error",

      "Gemini rejected request",

      {

        requestId,

        status:
          upstreamResponse.status,

        operation:
          requestData.operation

      }

    );


    let status =
      upstreamResponse.status;


    if (
      !Number.isInteger(status) ||
      status < 400 ||
      status > 599
    ) {

      status = 502;

    }


    return errorResponse(

      request,

      env,

      status,

      "GEMINI_UPSTREAM_ERROR",

      "The AI provider rejected the request.",

      requestId

    );

  }


  /* ---------------------------------------------------------------
   * Parse provider response
   * ------------------------------------------------------------- */

  let providerData;


  try {

    providerData =
      JSON.parse(
        responseText
      );

  }

  catch {

    return errorResponse(

      request,

      env,

      502,

      "GEMINI_INVALID_RESPONSE",

      "The AI provider returned an invalid response.",

      requestId

    );

  }


  /* ---------------------------------------------------------------
   * Normalize
   * ------------------------------------------------------------- */

  const normalized =
    normalizeGeminiResponse(

      providerData,

      requestId,

      model,

      requestData.operation

    );


  return jsonResponse(

    request,

    env,

    normalized,

    200,

    {

      "X-RateLimit-Remaining":
        String(
          rateLimit.remaining
        )

    }

  );

}


/* =====================================================================
 * 36. API ROUTER
 * ===================================================================== */

async function routeAPI(
  request,
  env,
  requestId
) {

  const url =
    new URL(
      request.url
    );


  const path =
    url.pathname;


  /* ---------------------------------------------------------------
   * Health
   * ------------------------------------------------------------- */

  if (
    path ===
    CONFIG.HEALTH_PATH
  ) {

    return handleHealth(
      request,
      env
    );

  }


  /* ---------------------------------------------------------------
   * Version
   * ------------------------------------------------------------- */

  if (
    path ===
    CONFIG.VERSION_PATH
  ) {

    return handleVersion(
      request,
      env
    );

  }


  /* ---------------------------------------------------------------
   * Information
   * ------------------------------------------------------------- */

  if (
    path ===
    CONFIG.INFO_PATH
  ) {

    return handleInfo(
      request,
      env
    );

  }


  /* ---------------------------------------------------------------
   * AI operations
   * ------------------------------------------------------------- */

  if (
    path ===
    CONFIG.AI_OPERATIONS_PATH
  ) {

    return handleOperations(
      request,
      env
    );

  }


  /* ---------------------------------------------------------------
   * AI
   * ------------------------------------------------------------- */

  if (
    path ===
    CONFIG.AI_PATH
  ) {

    return handleAI(

      request,

      env,

      requestId

    );

  }


  /* ---------------------------------------------------------------
   * Unknown route
   * ------------------------------------------------------------- */

  return errorResponse(

    request,

    env,

    404,

    "API_ROUTE_NOT_FOUND",

    "The requested API route does not exist.",

    requestId

  );

}


/* =====================================================================
 * 37. ROOT ENDPOINT
 * ===================================================================== */

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
        "BloggerSaaS Ultimate V5 Enterprise Worker is running.",

      architecture:
        "Secure AI Gateway",

      api:
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

      }

    }

  );

}


/* =====================================================================
 * 38. REQUEST ID RESPONSE HEADER
 * ===================================================================== */

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


/* =====================================================================
 * 39. API REQUEST DETECTION
 * ===================================================================== */

function isAPIRequest(
  url
) {

  return (

    url.pathname ===
      CONFIG.API_PREFIX ||

    url.pathname.startsWith(
      `${CONFIG.API_PREFIX}/`
    )

  );

}


/* =====================================================================
 * 40. GLOBAL REQUEST HANDLER
 * ===================================================================== */

async function handleRequest(
  originalRequest,
  env,
  ctx
) {

  const requestId =
    originalRequest.headers.get(
      "X-Request-ID"
    ) ||
    createRequestId();


  const headers =
    new Headers(
      originalRequest.headers
    );


  headers.set(
    "X-Request-ID",
    requestId
  );


  const request =
    new Request(

      originalRequest,

      {

        headers

      }

    );


  const url =
    new URL(
      request.url
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


  /* ---------------------------------------------------------------
   * OPTIONS / CORS
   * ------------------------------------------------------------- */

  if (
    request.method ===
    "OPTIONS"
  ) {

    const origin =
      request.headers.get(
        "Origin"
      );


    if (
      origin &&
      !getCorsOrigin(
        request,
        env
      )
    ) {

      return addRequestId(

        errorResponse(

          request,

          env,

          403,

          "CORS_ORIGIN_DENIED",

          "This origin is not authorized.",

          requestId

        ),

        requestId

      );

    }


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


  /* ---------------------------------------------------------------
   * Body size protection
   * ------------------------------------------------------------- */

  if (
    !validateBodySize(
      request
    )
  ) {

    return addRequestId(

      errorResponse(

        request,

        env,

        413,

        "PAYLOAD_TOO_LARGE",

        "Request body exceeds the permitted size.",

        requestId

      ),

      requestId

    );

  }


  /* ---------------------------------------------------------------
   * API
   * ------------------------------------------------------------- */

  if (
    isAPIRequest(
      url
    )
  ) {

    const response =
      await routeAPI(

        request,

        env,

        requestId

      );


    return addRequestId(

      response,

      requestId

    );

  }


  /* ---------------------------------------------------------------
   * Root
   * ------------------------------------------------------------- */

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


/* =====================================================================
 * 41. FATAL ERROR HANDLER
 * ===================================================================== */

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


  return addRequestId(

    errorResponse(

      request,

      env,

      500,

      "INTERNAL_SERVER_ERROR",

      "An unexpected server error occurred.",

      requestId

    ),

    requestId

  );

}


/* =====================================================================
 * 42. CLOUDFLARE MODULE WORKER ENTRY POINT
 * ===================================================================== */

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

    }

    catch (error) {

      return handleFatalError(

        request,

        env,

        error,

        requestId

      );

    }

  }

};


/* =====================================================================
 * END OF FILE
 * BloggerSaaS Ultimate V5
 * Worker V5.1.8 Enterprise
 * ===================================================================== */
