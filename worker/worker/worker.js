/**
 * ================================================================
 * BloggerSaaS Ultimate V5
 * Cloudflare Worker V5.1.14 Enterprise
 * ===============================================================
 *
 * Secure Firebase Authenticated AI Gateway
 *
 * Architecture:
 *
 * Blogger Frontend
 *       ↓
 * Firebase Authentication
 *       ↓
 * Firebase ID Token
 *       ↓
 * Cloudflare Worker
 *       ↓
 * JWT Verification
 *       ↓
 * Authorized User
 *       ↓
 * Gemini AI API
 *
 * ================================================================
 *
 * REQUIRED CLOUDFLARE SECRET
 *
 * GEMINI_API_KEY
 *
 * REQUIRED CLOUDFLARE VARIABLES
 *
 * FIREBASE_PROJECT_ID
 * CORS_ORIGINS
 *
 * OPTIONAL CLOUDFLARE VARIABLE
 *
 * GEMINI_MODEL
 *
 * ================================================================
 *
 * V5.1.14 FIXES
 *
 * ✓ Production CORS handling
 * ✓ Exact CORS origin matching
 * ✓ Proper OPTIONS preflight handling
 * ✓ Firebase X.509 certificate → SPKI public key extraction
 * ✓ RS256 Firebase ID-token verification
 * ✓ Firebase certificate caching
 * ✓ Automatic certificate refresh for unknown kid
 * ✓ Firebase issuer validation
 * ✓ Firebase audience validation
 * ✓ Firebase expiration validation
 * ✓ Firebase subject validation
 * ✓ Firebase issue-time validation
 * ✓ Security headers
 * ✓ Request IDs
 * ✓ Request-size protection
 * ✓ Safe error responses
 * ✓ No secret/token/full-prompt logging
 * ✓ Gemini upstream diagnostic logging
 * ✓ Gemini status-specific error handling
 *
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
    "5.1.13",

  API_PREFIX:
    "/api",

  MAX_BODY_BYTES:
    1024 * 1024,

  ENABLE_LOGS:
    true,

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
    "gemini-3.5-flash",

  GOOGLE_PUBLIC_KEYS_URL:
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",

  GOOGLE_CERT_CACHE_SECONDS:
    3600,

  CLOCK_SKEW_SECONDS:
    300

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

  "Cache-Control":
    "no-store, no-cache, must-revalidate",

  "Pragma":
    "no-cache"

});


/* ================================================================
 * 3. CERTIFICATE CACHE
 * ================================================================ */

let certificateCache = {

  certificates:
    null,

  expiresAt:
    0

};


/* ================================================================
 * 4. BASIC UTILITIES
 * ================================================================ */

function createRequestId() {

  return crypto.randomUUID();

}


function nowISO() {

  return new Date().toISOString();

}


function getUnixTime() {

  return Math.floor(
    Date.now() / 1000
  );

}


function safeString(value) {

  return typeof value === "string"
    ? value.trim()
    : "";

}


/* ================================================================
 * 5. SAFE LOGGING
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


  if (level === "error") {

    console.error(payload);

    return;

  }


  if (level === "warn") {

    console.warn(payload);

    return;

  }


  console.log(payload);

}


/* ================================================================
 * 6. CORS CONFIGURATION
 * ================================================================ */

function getAllowedOrigins(env) {

  const value =
    safeString(
      env?.CORS_ORIGINS
    );


  if (!value) {

    return [];

  }


  return value
    .split(",")
    .map(
      origin =>
        origin.trim()
    )
    .filter(Boolean);

}


function getRequestOrigin(
  request
) {

  return safeString(
    request.headers.get(
      "Origin"
    )
  );

}


function getCorsOrigin(
  request,
  env
) {

  const requestOrigin =
    getRequestOrigin(
      request
    );


  if (!requestOrigin) {

    return null;

  }


  const allowedOrigins =
    getAllowedOrigins(
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
    ] = origin;

  }


  return headers;

}


function isOriginAllowed(
  request,
  env
) {

  const origin =
    getRequestOrigin(
      request
    );


  /*
   * Direct server-to-server requests may
   * legitimately have no Origin header.
   */

  if (!origin) {

    return true;

  }


  return Boolean(
    getCorsOrigin(
      request,
      env
    )
  );

}


/* ================================================================
 * 7. RESPONSE HEADERS
 * ================================================================ */

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


/* ================================================================
 * 8. JSON RESPONSE
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
 * 9. ERROR RESPONSE
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
 * 10. REQUEST SIZE VALIDATION
 * ================================================================ */

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

  const size =
    getContentLength(
      request
    );


  if (
    size !== null &&
    size > CONFIG.MAX_BODY_BYTES
  ) {

    return false;

  }


  return true;

}


/* ================================================================
 * 11. SAFE JSON READER
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

    const error =
      new Error(
        "Content-Type must be application/json."
      );

    error.code =
      "INVALID_CONTENT_TYPE";

    throw error;

  }


  const bodyText =
    await request.text();


  const bodyBytes =
    new TextEncoder()
      .encode(
        bodyText
      )
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


  if (!bodyText.trim()) {

    const error =
      new Error(
        "Request body must not be empty."
      );

    error.code =
      "EMPTY_BODY";

    throw error;

  }


  try {

    return JSON.parse(
      bodyText
    );

  } catch {

    const error =
      new Error(
        "A valid JSON request body is required."
      );

    error.code =
      "INVALID_JSON";

    throw error;

  }

}


/* ================================================================
 * 12. BASE64URL UTILITIES
 * ================================================================ */

function base64UrlToUint8Array(
  value
) {

  const base64 =
    value
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      );


  const padding =
    "=".repeat(
      (
        4 -
        (
          base64.length % 4
        )
      ) % 4
    );


  const binary =
    atob(
      base64 +
      padding
    );


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
      binary.charCodeAt(
        i
      );

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
      .decode(
        bytes
      );


  return JSON.parse(
    text
  );

}


/* ================================================================
 * 13. JWT PARSER
 * ================================================================ */

function parseJWT(
  token
) {

  if (
    typeof token !== "string"
  ) {

    throw new Error(
      "Invalid authentication token."
    );

  }


  const parts =
    token.split(".");


  if (
    parts.length !== 3
  ) {

    throw new Error(
      "Invalid authentication token format."
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


  return {

    header,

    payload,

    signature:
      base64UrlToUint8Array(
        parts[2]
      ),

    signingInput:
      new TextEncoder()
        .encode(
          `${parts[0]}.${parts[1]}`
        )

  };

}


/* ================================================================
 * 14. FIREBASE PUBLIC CERTIFICATES
 * ================================================================ */

async function getFirebaseCertificates(
  forceRefresh = false
) {

  const now =
    Date.now();


  if (
    !forceRefresh &&
    certificateCache.certificates &&
    certificateCache.expiresAt > now
  ) {

    return certificateCache.certificates;

  }


  const response =
    await fetch(
      CONFIG.GOOGLE_PUBLIC_KEYS_URL,
      {

        headers: {

          "Accept":
            "application/json"

        },

        cf: {

          cacheTtl:
            300,

          cacheEverything:
            true

        }

      }
    );


  if (!response.ok) {

    throw new Error(
      "Unable to retrieve Firebase verification certificates."
    );

  }


  const certificates =
    await response.json();


  const cacheControl =
    response.headers.get(
      "Cache-Control"
    ) || "";


  const maxAgeMatch =
    cacheControl.match(
      /max-age=(\d+)/
    );


  const maxAgeSeconds =
    maxAgeMatch
      ? Math.min(
          Number(
            maxAgeMatch[1]
          ),
          CONFIG.GOOGLE_CERT_CACHE_SECONDS
        )
      : CONFIG.GOOGLE_CERT_CACHE_SECONDS;


  certificateCache = {

    certificates,

    expiresAt:
      now +
      (
        maxAgeSeconds *
        1000
      )

  };


  return certificates;

}


/* ================================================================
 * 15. PEM / X.509 CERTIFICATE UTILITIES
 * ================================================================ */

function pemToDer(
  pem
) {

  const clean =
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
    atob(
      clean
    );


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
      binary.charCodeAt(
        i
      );

  }


  return bytes;

}


function readDERLength(
  bytes,
  offset
) {

  const first =
    bytes[offset];


  if (
    first < 0x80
  ) {

    return {

      length:
        first,

      nextOffset:
        offset + 1

    };

  }


  const byteCount =
    first & 0x7f;


  if (
    byteCount === 0 ||
    byteCount > 4
  ) {

    throw new Error(
      "Invalid DER length."
    );

  }


  let length =
    0;


  for (
    let i = 0;
    i < byteCount;
    i++
  ) {

    length =
      (
        length * 256
      ) +
      bytes[
        offset + 1 + i
      ];

  }


  return {

    length,

    nextOffset:
      offset +
      1 +
      byteCount

  };

}


function readDERElement(
  bytes,
  offset
) {

  if (
    offset >= bytes.length
  ) {

    throw new Error(
      "Invalid DER element offset."
    );

  }


  const tag =
    bytes[offset];


  const lengthInfo =
    readDERLength(
      bytes,
      offset + 1
    );


  const valueStart =
    lengthInfo.nextOffset;


  const valueEnd =
    valueStart +
    lengthInfo.length;


  if (
    valueEnd > bytes.length
  ) {

    throw new Error(
      "Invalid DER element length."
    );

  }


  return {

    tag,

    start:
      offset,

    valueStart,

    valueEnd,

    end:
      valueEnd

  };

}


/**
 * Extract SubjectPublicKeyInfo from X.509 certificate.
 */

function extractSubjectPublicKeyInfo(
  certificateDer
) {

  const root =
    readDERElement(
      certificateDer,
      0
    );


  if (
    root.tag !== 0x30
  ) {

    throw new Error(
      "Firebase certificate is not a DER SEQUENCE."
    );

  }


  const tbs =
    readDERElement(
      certificateDer,
      root.valueStart
    );


  if (
    tbs.tag !== 0x30
  ) {

    throw new Error(
      "Invalid Firebase TBSCertificate."
    );

  }


  let offset =
    tbs.valueStart;


  const first =
    readDERElement(
      certificateDer,
      offset
    );


  if (
    first.tag === 0xa0
  ) {

    offset =
      first.end;

  }


  const serialNumber =
    readDERElement(
      certificateDer,
      offset
    );


  offset =
    serialNumber.end;


  const signature =
    readDERElement(
      certificateDer,
      offset
    );


  offset =
    signature.end;


  const issuer =
    readDERElement(
      certificateDer,
      offset
    );


  offset =
    issuer.end;


  const validity =
    readDERElement(
      certificateDer,
      offset
    );


  offset =
    validity.end;


  const subject =
    readDERElement(
      certificateDer,
      offset
    );


  offset =
    subject.end;


  const spki =
    readDERElement(
      certificateDer,
      offset
    );


  if (
    spki.tag !== 0x30
  ) {

    throw new Error(
      "Firebase certificate public-key structure is invalid."
    );

  }


  return certificateDer.slice(
    spki.start,
    spki.end
  );

}


/* ================================================================
 * 16. FIREBASE JWT SIGNATURE VERIFICATION
 * ================================================================ */

async function verifyWithCertificate(
  parsedToken,
  certificate
) {

  const certificateDer =
    pemToDer(
      certificate
    );


  const spki =
    extractSubjectPublicKeyInfo(
      certificateDer
    );


  const cryptoKey =
    await crypto.subtle.importKey(

      "spki",

      spki,

      {

        name:
          "RSASSA-PKCS1-v1_5",

        hash:
          "SHA-256"

      },

      false,

      ["verify"]

    );


  return crypto.subtle.verify(

    {

      name:
        "RSASSA-PKCS1-v1_5"

    },

    cryptoKey,

    parsedToken.signature,

    parsedToken.signingInput

  );

}


async function verifyFirebaseSignature(
  parsedToken
) {

  const algorithm =
    parsedToken.header?.alg;


  if (
    algorithm !== "RS256"
  ) {

    throw new Error(
      "Unsupported Firebase token algorithm."
    );

  }


  const keyId =
    safeString(
      parsedToken.header?.kid
    );


  if (!keyId) {

    throw new Error(
      "Firebase token key ID is missing."
    );

  }


  let certificates =
    await getFirebaseCertificates();


  let certificate =
    certificates[keyId];


  if (!certificate) {

    certificates =
      await getFirebaseCertificates(
        true
      );


    certificate =
      certificates[keyId];

  }


  if (!certificate) {

    throw new Error(
      "Firebase token signing certificate was not found."
    );

  }


  return verifyWithCertificate(
    parsedToken,
    certificate
  );

}


/* ================================================================
 * 17. FIREBASE TOKEN CLAIM VALIDATION
 * ================================================================ */

function validateFirebaseClaims(
  payload,
  env
) {

  const projectId =
    safeString(
      env?.FIREBASE_PROJECT_ID
    );


  if (!projectId) {

    throw new Error(
      "Firebase project authentication is not configured."
    );

  }


  const expectedIssuer =
    `https://securetoken.google.com/${projectId}`;


  const expectedAudience =
    projectId;


  if (
    payload.iss !== expectedIssuer
  ) {

    throw new Error(
      "Invalid Firebase token issuer."
    );

  }


  if (
    payload.aud !== expectedAudience
  ) {

    throw new Error(
      "Invalid Firebase token audience."
    );

  }


  if (
    typeof payload.sub !== "string" ||
    !payload.sub ||
    payload.sub.length > 128
  ) {

    throw new Error(
      "Invalid Firebase token subject."
    );

  }


  const now =
    getUnixTime();


  if (
    typeof payload.exp !== "number" ||
    payload.exp <=
      now -
      CONFIG.CLOCK_SKEW_SECONDS
  ) {

    throw new Error(
      "Firebase token has expired."
    );

  }


  if (
    typeof payload.iat !== "number" ||
    payload.iat >
      now +
      CONFIG.CLOCK_SKEW_SECONDS
  ) {

    throw new Error(
      "Invalid Firebase token issue time."
    );

  }


  if (
    typeof payload.auth_time === "number" &&
    payload.auth_time >
      now +
      CONFIG.CLOCK_SKEW_SECONDS
  ) {

    throw new Error(
      "Invalid Firebase authentication time."
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

    provider:
      payload.firebase?.sign_in_provider ||
      null

  };

}


/* ================================================================
 * 18. FIREBASE AUTHENTICATION
 * ================================================================ */

async function authenticateFirebaseRequest(
  request,
  env
) {

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

      authenticated:
        false,

      code:
        "FIREBASE_AUTH_REQUIRED",

      message:
        "Firebase authentication is required."

    };

  }


  const token =
    authorization
      .slice(7)
      .trim();


  if (!token) {

    return {

      authenticated:
        false,

      code:
        "FIREBASE_AUTH_REQUIRED",

      message:
        "Firebase authentication is required."

    };

  }


  try {

    const parsedToken =
      parseJWT(
        token
      );


    const signatureValid =
      await verifyFirebaseSignature(
        parsedToken
      );


    if (!signatureValid) {

      return {

        authenticated:
          false,

        code:
          "FIREBASE_AUTH_INVALID",

        message:
          "Firebase authentication token is invalid."

      };

    }


    const user =
      validateFirebaseClaims(
        parsedToken.payload,
        env
      );


    return {

      authenticated:
        true,

      user

    };

  } catch (error) {

    log(

      env,

      "warn",

      "Firebase token verification failed",

      {

        reason:
          error instanceof Error
            ? error.message
            : "verification-error"

      }

    );


    return {

      authenticated:
        false,

      code:
        "FIREBASE_AUTH_INVALID",

      message:
        "Firebase authentication token could not be verified."

    };

  }

}


/* ================================================================
 * 19. GEMINI MODEL
 * ================================================================ */

function getGeminiModel(
  env
) {

  const model =
    safeString(
      env?.GEMINI_MODEL
    );


  if (model) {

    return model;

  }


  return CONFIG.DEFAULT_GEMINI_MODEL;

}


/* ================================================================
 * 20. AI REQUEST NORMALIZATION
 * ================================================================ */

function normalizeAIRequest(
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
        : {})

    };

  }


  if (
    typeof body.prompt === "string"
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
        : {})

    };

  }


  throw new Error(
    "Provide either a non-empty prompt or contents array."
  );

}


/* ================================================================
 * 21. GEMINI RESPONSE NORMALIZATION
 * ================================================================ */

function normalizeGeminiResponse(
  providerData,
  requestId,
  model
) {

  const candidate =
    providerData?.candidates?.[0];


  const text =
    candidate?.content?.parts
      ?.filter(
        part =>
          typeof part?.text === "string"
      )
      ?.map(
        part =>
          part.text
      )
      ?.join("") || "";


  return {

    success:
      true,

    data: {

      text,

      model,

      finishReason:
        candidate?.finishReason ||
        null

    },

    requestId

  };

}


/* ================================================================
 * 22. HEALTH ENDPOINT
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

      authentication:
        "Firebase ID Token",

      corsConfigured:
        getAllowedOrigins(
          env
        ).length > 0,

      timestamp:
        nowISO()

    }

  );

}


/* ================================================================
 * 23. VERSION ENDPOINT
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

      authentication:
        "Firebase Authenticated Gateway"

    }

  );

}


/* ================================================================
 * 24. API INFORMATION ENDPOINT
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

      authentication:
        {

          type:
            "Firebase ID Token",

          browserSecretRequired:
            false

        },

      cors:
        {

          configured:
            getAllowedOrigins(
              env
            ).length > 0

        },

      endpoints:
        {

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


/* ================================================================
 * 25. GEMINI PROVIDER ERROR DIAGNOSTICS
 * ================================================================ */

function parseGeminiProviderError(
  responseText
) {

  const MAX_DIAGNOSTIC_LENGTH =
    1200;


  if (
    !responseText
  ) {

    return {

      type:
        "empty",

      message:
        "Gemini returned an empty response body."

    };

  }


  try {

    const data =
      JSON.parse(
        responseText
      );


    const error =
      data?.error;


    if (
      error &&
      typeof error === "object"
    ) {

      return {

        type:
          "provider_error",

        code:
          typeof error.code === "number"
            ? error.code
            : null,

        status:
          typeof error.status === "string"
            ? error.status
            : null,

        message:
          typeof error.message === "string"
            ? error.message.slice(
                0,
                MAX_DIAGNOSTIC_LENGTH
              )
            : null

      };

    }


    return {

      type:
        "json_response",

      message:
        JSON.stringify(
          data
        ).slice(
          0,
          MAX_DIAGNOSTIC_LENGTH
        )

    };

  } catch {

    return {

      type:
        "text_response",

      message:
        String(
          responseText
        ).slice(
          0,
          MAX_DIAGNOSTIC_LENGTH
        )

    };

  }

}


/* ================================================================
 * 26. GEMINI AI ENDPOINT
 * ================================================================ */

async function handleAI(
  request,
  env,
  requestId
) {

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


  /*
   * Firebase authentication
   */

  const authentication =
    await authenticateFirebaseRequest(
      request,
      env
    );


  if (
    !authentication.authenticated
  ) {

    return errorResponse(

      request,

      env,

      401,

      authentication.code,

      authentication.message,

      requestId

    );

  }


  /*
   * Gemini API secret
   */

  const apiKey =
    safeString(
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


  /*
   * Body size validation
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
   * Parse request
   */

  let body;


  try {

    body =
      await readJSON(
        request
      );

  } catch (error) {

    const status =
      error?.code ===
      "PAYLOAD_TOO_LARGE"
        ? 413
        : 400;


    return errorResponse(

      request,

      env,

      status,

      error?.code ||
        "INVALID_REQUEST",

      error instanceof Error
        ? error.message
        : "Invalid request.",

      requestId

    );

  }


  /*
   * Normalize AI request
   */

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


  const model =
    getGeminiModel(
      env
    );


  const endpoint =
    `${CONFIG.GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`;


  /*
   * Safe metadata logging.
   *
   * Never log:
   * - Firebase token
   * - Gemini API key
   * - full prompt
   */

  log(

    env,

    "info",

    "Authorized AI request",

    {

      requestId,

      model,

      authenticated:
        true,

      emailVerified:
        authentication.user.emailVerified

    }

  );


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

      "Gemini connection failed",

      {

        requestId,

        model

      }

    );


    return errorResponse(

      request,

      env,

      502,

      "GEMINI_UPSTREAM_ERROR",

      "Unable to connect to the AI provider.",

      requestId

    );

  }


  /*
   * Read the provider response exactly once.
   */

  const responseText =
    await upstreamResponse.text();


  /* ============================================================
   * Successful Gemini response
   * ============================================================ */

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

      log(

        env,

        "error",

        "Gemini returned invalid JSON",

        {

          requestId,

          model,

          status:
            upstreamResponse.status

        }

      );


      return errorResponse(

        request,

        env,

        502,

        "GEMINI_INVALID_RESPONSE",

        "AI provider returned an invalid response.",

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

      )

    );

  }


  /* ============================================================
   * Gemini provider rejected request
   *
   * IMPORTANT:
   *
   * We deliberately do NOT return the raw provider response
   * to the browser.
   *
   * Sanitized diagnostic information is written to Cloudflare
   * logs so we can determine whether the problem is:
   *
   * 400 = request format
   * 401 = API authentication
   * 403 = access/permission
   * 404 = model unavailable/not found
   * 429 = quota/rate limit
   * 5xx = Gemini server-side issue
   * ============================================================ */

  const providerDiagnostic =
    parseGeminiProviderError(
      responseText
    );


  log(

    env,

    "warn",

    "Gemini request rejected",

    {

      requestId,

      model,

      status:
        upstreamResponse.status,

      statusText:
        upstreamResponse.statusText ||
        null,

      providerError:
        providerDiagnostic

    }

  );


  let clientStatus =
    502;

  let clientCode =
    "GEMINI_UPSTREAM_ERROR";

  let clientMessage =
    "AI provider could not process the request.";


  if (
    upstreamResponse.status ===
    400
  ) {

    clientStatus =
      400;

    clientCode =
      "GEMINI_BAD_REQUEST";

    clientMessage =
      "The AI provider rejected the request format.";

  } else if (
    upstreamResponse.status ===
    401
  ) {

    clientCode =
      "GEMINI_AUTH_ERROR";

    clientMessage =
      "The AI provider authentication failed.";

  } else if (
    upstreamResponse.status ===
    403
  ) {

    clientCode =
      "GEMINI_ACCESS_DENIED";

    clientMessage =
      "The AI provider denied access to the requested model or API.";

  } else if (
    upstreamResponse.status ===
    404
  ) {

    clientCode =
      "GEMINI_MODEL_NOT_FOUND";

    clientMessage =
      "The configured Gemini model was not found or is unavailable.";

  } else if (
    upstreamResponse.status ===
    429
  ) {

    clientStatus =
      429;

    clientCode =
      "GEMINI_RATE_LIMITED";

    clientMessage =
      "The AI provider rate limit or quota has been reached.";

  } else if (
    upstreamResponse.status >=
    500
  ) {

    clientCode =
      "GEMINI_UPSTREAM_ERROR";

    clientMessage =
      "The AI provider returned a server error.";

  }


  return errorResponse(

    request,

    env,

    clientStatus,

    clientCode,

    clientMessage,

    requestId

  );

}


/* ================================================================
 * 27. API ROUTER
 * ================================================================ */

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


  if (
    path ===
    CONFIG.HEALTH_PATH
  ) {

    return handleHealth(
      request,
      env
    );

  }


  if (
    path ===
    CONFIG.VERSION_PATH
  ) {

    return handleVersion(
      request,
      env
    );

  }


  if (
    path ===
    CONFIG.INFO_PATH
  ) {

    return handleInfo(
      request,
      env
    );

  }


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


  return errorResponse(

    request,

    env,

    404,

    "API_ROUTE_NOT_FOUND",

    "The requested API route does not exist.",

    requestId

  );

}


/* ================================================================
 * 28. ROOT ENDPOINT
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
        "BloggerSaaS Ultimate V5 Firebase Authenticated AI Gateway is running.",

      api:
        CONFIG.API_PREFIX,

      authentication:
        "Firebase ID Token",

      corsConfigured:
        getAllowedOrigins(
          env
        ).length > 0,

      endpoints:
        {

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


/* ================================================================
 * 29. ADD REQUEST ID
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
 * 30. REQUEST HANDLER
 * ================================================================ */

async function handleRequest(
  request,
  env,
  ctx,
  requestId
) {

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


  /*
   * CORS preflight
   */

  if (
    request.method ===
    "OPTIONS"
  ) {

    if (
      !isOriginAllowed(
        request,
        env
      )
    ) {

      return errorResponse(

        request,

        env,

        403,

        "CORS_ORIGIN_NOT_ALLOWED",

        "The request origin is not permitted.",

        requestId

      );

    }


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
   * Reject disallowed browser origins.
   *
   * Requests without Origin are allowed because
   * they may be server-to-server or direct health checks.
   */

  if (
    !isOriginAllowed(
      request,
      env
    )
  ) {

    return errorResponse(

      request,

      env,

      403,

      "CORS_ORIGIN_NOT_ALLOWED",

      "The request origin is not permitted.",

      requestId

    );

  }


  /*
   * API request
   */

  if (
    url.pathname ===
      CONFIG.API_PREFIX ||
    url.pathname.startsWith(
      `${CONFIG.API_PREFIX}/`
    )
  ) {

    return routeAPI(

      request,

      env,

      requestId

    );

  }


  /*
   * Root request
   */

  return handleRoot(
    request,
    env
  );

}


/* ================================================================
 * 31. FATAL ERROR HANDLER
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
 * 32. CLOUDFLARE WORKER ENTRY POINT
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

      const response =
        await handleRequest(

          request,

          env,

          ctx,

          requestId

        );


      return addRequestId(

        response,

        requestId

      );

    } catch (error) {

      const response =
        handleFatalError(

          request,

          env,

          error,

          requestId

        );


      return addRequestId(

        response,

        requestId

      );

    }

  }

};


/* ================================================================
 * END OF FILE
 *
 * BloggerSaaS Ultimate V5
 * Cloudflare Worker V5.1.14 Enterprise
 * ================================================================
 */
