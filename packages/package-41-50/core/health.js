/**
 * BloggerSaaS Ultimate V5
 * Package 41–50
 * Core Health Monitoring
 *
 * Safe development health monitoring layer.
 *
 * Safety:
 * - Does not modify production systems.
 * - Does not modify live Firebase data.
 * - Does not modify user accounts.
 * - Does not deploy automatically.
 * - Does not delete external data.
 */

(function (global) {

  "use strict";


  // ─────────────────────────────────────────────
  // Health State
  // ─────────────────────────────────────────────

  const healthState = {

    initialized: false,

    environment: "safe-development",

    status: "UNKNOWN",

    lastCheckAt: null,

    checks: {},

    errors: [],

    warnings: []

  };


  // ─────────────────────────────────────────────
  // Module Discovery
  // ─────────────────────────────────────────────

  function getModule(moduleName) {

    return (

      global[moduleName] ||

      null

    );

  }


  function getManifest() {

    return getModule(

      "BloggerSaaSManifest"

    );

  }


  function getIntegration() {

    return getModule(

      "BloggerSaaSIntegration"

    );

  }


  function getFirebase() {

    return getModule(

      "BloggerSaaSFirebase"

    );

  }


  // ─────────────────────────────────────────────
  // Initialize Health Monitoring
  // ─────────────────────────────────────────────

  function initializeHealth() {

    healthState.initialized = true;

    healthState.status = "INITIALIZED";

    return getHealthStatus();

  }


  // ─────────────────────────────────────────────
  // Manifest Health Check
  // ─────────────────────────────────────────────

  function checkManifest() {

    const manifest = getManifest();

    if (!manifest) {

      return {

        success: false,

        status: "FAILED",

        message:

          "Manifest module is unavailable."

      };

    }

    if (

      typeof manifest

        .getPackageManifest !==

      "function"

    ) {

      return {

        success: false,

        status: "FAILED",

        message:

          "Manifest API is unavailable."

      };

    }

    const packageManifest =

      manifest.getPackageManifest();

    if (!packageManifest) {

      return {

        success: false,

        status: "FAILED",

        message:

          "Package manifest could not be loaded."

      };

    }

    return {

      success: true,

      status: "HEALTHY",

      message:

        "Package manifest is available.",

      packageId:

        packageManifest.id,

      version:

        packageManifest.version

    };

  }


  // ─────────────────────────────────────────────
  // Integration Health Check
  // ─────────────────────────────────────────────

  function checkIntegration() {

    const integration =

      getIntegration();

    if (!integration) {

      return {

        success: false,

        status: "FAILED",

        message:

          "Integration module is unavailable."

      };

    }

    if (

      typeof integration

        .getIntegrationStatus !==

      "function"

    ) {

      return {

        success: false,

        status: "FAILED",

        message:

          "Integration status API is unavailable."

      };

    }

    const status =

      integration

        .getIntegrationStatus();

    return {

      success:

        status.initialized === true,

      status:

        status.initialized === true

          ? "HEALTHY"

          : "WARNING",

      message:

        status.initialized === true

          ? "Integration layer is initialized."

          : "Integration layer is not initialized.",

      registeredModules:

        status.registeredModules || [],

      errorCount:

        status.errorCount || 0

    };

  }


  // ─────────────────────────────────────────────
  // Firebase Health Check
  // ─────────────────────────────────────────────

  function checkFirebase() {

    const firebase =

      getFirebase();

    if (!firebase) {

      return {

        success: false,

        status: "FAILED",

        message:

          "Firebase bridge is unavailable."

      };

    }

    if (

      typeof firebase

        .getFirebaseStatus !==

      "function"

    ) {

      return {

        success: false,

        status: "FAILED",

        message:

          "Firebase status API is unavailable."

      };

    }

    const status =

      firebase

        .getFirebaseStatus();

    return {

      success: true,

      status:

        status.initialized === true

          ? "HEALTHY"

          : "WARNING",

      message:

        status.initialized === true

          ? "Firebase bridge is initialized."

          : "Firebase bridge is available but not initialized.",

      initialized:

        status.initialized,

      configured:

        status.configured,

      connected:

        status.connected

    };

  }


  // ─────────────────────────────────────────────
  // Run Complete Health Check
  // ─────────────────────────────────────────────

  function runHealthCheck() {

    healthState.lastCheckAt =

      new Date().toISOString();

    healthState.errors = [];

    healthState.warnings = [];

    const checks = {

      manifest:

        checkManifest(),

      integration:

        checkIntegration(),

      firebase:

        checkFirebase()

    };

    healthState.checks = checks;

    Object.keys(checks)

      .forEach(

        function (checkName) {

          const check =

            checks[checkName];

          if (

            check.success !== true

          ) {

            if (

              check.status ===

              "FAILED"

            ) {

              healthState.errors.push({

                check:

                  checkName,

                message:

                  check.message

              });

            }

            else {

              healthState.warnings.push({

                check:

                  checkName,

                message:

                  check.message

              });

            }

          }

        }

      );

    const hasErrors =

      healthState.errors.length > 0;

    const hasWarnings =

      healthState.warnings.length > 0;

    healthState.status =

      hasErrors

        ? "UNHEALTHY"

        : hasWarnings

          ? "WARNING"

          : "HEALTHY";

    return getHealthStatus();

  }


  // ─────────────────────────────────────────────
  // Get Health Status
  // ─────────────────────────────────────────────

  function getHealthStatus() {

    return {

      initialized:

        healthState.initialized,

      environment:

        healthState.environment,

      status:

        healthState.status,

      lastCheckAt:

        healthState.lastCheckAt,

      checks:

        Object.assign(

          {},

          healthState.checks

        ),

      errors:

        healthState.errors.slice(),

      warnings:

        healthState.warnings.slice()

    };

  }


  // ─────────────────────────────────────────────
  // Reset Health State
  // ─────────────────────────────────────────────

  function resetHealth() {

    healthState.initialized = false;

    healthState.status = "UNKNOWN";

    healthState.lastCheckAt = null;

    healthState.checks = {};

    healthState.errors = [];

    healthState.warnings = [];

    return true;

  }


  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  const healthAPI = {

    initializeHealth,

    runHealthCheck,

    getHealthStatus,

    resetHealth,

    checkManifest,

    checkIntegration,

    checkFirebase,

    state:

      healthState

  };


  // ─────────────────────────────────────────────
  // Browser Global
  // ─────────────────────────────────────────────

  global.BloggerSaaSHealth =

    healthAPI;


  // ─────────────────────────────────────────────
  // Node / Test Export
  // ─────────────────────────────────────────────

  if (

    typeof module !== "undefined" &&

    module.exports

  ) {

    module.exports =

      healthAPI;

  }


})(
  typeof globalThis !== "undefined"

    ? globalThis

    : this

);
