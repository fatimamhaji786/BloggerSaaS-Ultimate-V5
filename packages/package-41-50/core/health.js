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

    status: "UNKNOWN",

    environment: "safe-development",

    initialized: false,

    lastChecked: null,

    checks: {},

    warnings: [],

    errors: []

  };


  // ─────────────────────────────────────────────
  // Check Result Factory
  // ─────────────────────────────────────────────

  function createCheckResult(

    name,

    status,

    message,

    details = {}

  ) {

    return {

      name,

      status,

      message,

      details,

      timestamp:

        new Date().toISOString()

    };

  }


  // ─────────────────────────────────────────────
  // Firebase Check
  // ─────────────────────────────────────────────

  function checkFirebase() {

    const firebase =

      global.BloggerSaaSFirebase;


    const available =

      !!firebase;


    const apiValid =

      available &&

      typeof firebase.getFirebaseStatus ===

        "function";


    let status = "HEALTHY";


    let message =

      "Firebase bridge API is available.";


    if (!available) {

      status = "WARNING";


      message =

        "Firebase bridge is not registered.";

    }


    else if (!apiValid) {

      status = "ERROR";


      message =

        "Firebase bridge API is incomplete.";

    }


    return (

      healthState.checks.firebase =

        createCheckResult(

          "firebase",

          status,

          message,

          {

            available,

            apiValid

          }

        )

    );

  }


  // ─────────────────────────────────────────────
  // Integration Check
  // ─────────────────────────────────────────────

  function checkIntegration() {

    const integration =

      global.BloggerSaaSIntegration;


    const available =

      !!integration;


    const apiValid =

      available &&

      typeof integration.initializeIntegration ===

        "function" &&

      typeof integration.registerModule ===

        "function" &&

      typeof integration.getModule ===

        "function" &&

      typeof integration.getIntegrationStatus ===

        "function";


    const status =

      apiValid

        ? "HEALTHY"

        : "WARNING";


    const message =

      apiValid

        ? "Integration layer is available."

        : "Integration layer requires review.";


    return (

      healthState.checks.integration =

        createCheckResult(

          "integration",

          status,

          message,

          {

            available,

            apiValid

          }

        )

    );

  }


  // ─────────────────────────────────────────────
  // Dashboard Check
  // ─────────────────────────────────────────────

  function checkDashboard() {

    const dashboard =

      global.BloggerSaaSDashboard;


    const available =

      !!dashboard;


    const apiValid =

      available &&

      typeof dashboard.initializeDashboard ===

        "function" &&

      typeof dashboard.getDashboardStatus ===

        "function";


    return (

      healthState.checks.dashboard =

        createCheckResult(

          "dashboard",

          apiValid

            ? "HEALTHY"

            : "WARNING",

          apiValid

            ? "Dashboard bridge is available."

            : "Dashboard bridge requires review.",

          {

            available,

            apiValid

          }

        )

    );

  }


  // ─────────────────────────────────────────────
  // Verification Check
  // ─────────────────────────────────────────────

  function checkVerification() {

    const verification =

      global.BloggerSaaSVerification;


    const available =

      !!verification;


    const apiValid =

      available &&

      typeof verification.runVerification ===

        "function" &&

      typeof verification.getVerificationStatus ===

        "function";


    return (

      healthState.checks.verification =

        createCheckResult(

          "verification",

          apiValid

            ? "HEALTHY"

            : "WARNING",

          apiValid

            ? "Verification layer is available."

            : "Verification layer requires review.",

          {

            available,

            apiValid

          }

        )

    );

  }


  // ─────────────────────────────────────────────
  // Safety Check
  // ─────────────────────────────────────────────

  function checkSafety() {

    const manifest =

      global.PACKAGE_MANIFEST;


    // If manifest is not loaded,
    // do not silently claim safety.

    if (!manifest) {

      return (

        healthState.checks.safety =

          createCheckResult(

            "safety",

            "WARNING",

            "Package manifest is unavailable.",

            {

              manifestAvailable: false

            }

          )

      );

    }


    const safetyRules =

      manifest.safety || {};


    const requiredRules = [

      "productionModification",

      "liveFirebaseModification",

      "userAccountModification",

      "automaticDeployment",

      "externalDataDeletion"

    ];


    const missingRules =

      requiredRules.filter(

        function (rule) {

          return (

            safetyRules[rule] !== false

          );

        }

      );


    const safe =

      missingRules.length === 0;


    return (

      healthState.checks.safety =

        createCheckResult(

          "safety",

          safe

            ? "HEALTHY"

            : "ERROR",

          safe

            ? "Production safety rules are active."

            : "One or more safety rules failed.",

          {

            manifestAvailable: true,

            safetyRules:

              Object.assign(

                {},

                safetyRules

              ),

            failedRules:

              missingRules

          }

        )

    );

  }


  // ─────────────────────────────────────────────
  // Environment Check
  // ─────────────────────────────────────────────

  function checkEnvironment() {

    const safe =

      healthState.environment ===

      "safe-development";


    return (

      healthState.checks.environment =

        createCheckResult(

          "environment",

          safe

            ? "HEALTHY"

            : "WARNING",

          safe

            ? "Safe development environment detected."

            : "Environment requires review.",

          {

            environment:

              healthState.environment

          }

        )

    );

  }


  // ─────────────────────────────────────────────
  // Calculate Overall Health
  // ─────────────────────────────────────────────

  function calculateOverallHealth() {

    const results =

      Object.values(

        healthState.checks

      );


    if (

      results.some(

        function (check) {

          return check.status === "ERROR";

        }

      )

    ) {

      return "ERROR";

    }


    if (

      results.some(

        function (check) {

          return check.status === "WARNING";

        }

      )

    ) {

      return "WARNING";

    }


    if (

      results.length === 0

    ) {

      return "UNKNOWN";

    }


    return "HEALTHY";

  }


  // ─────────────────────────────────────────────
  // Run Health Check
  // ─────────────────────────────────────────────

  function runHealthCheck() {

    healthState.warnings = [];

    healthState.errors = [];


    checkFirebase();

    checkIntegration();

    checkDashboard();

    checkVerification();

    checkSafety();

    checkEnvironment();


    Object.values(

      healthState.checks

    ).forEach(

      function (check) {

        if (

          check.status === "WARNING"

        ) {

          healthState.warnings.push(

            check

          );

        }


        if (

          check.status === "ERROR"

        ) {

          healthState.errors.push(

            check

          );

        }

      }

    );


    healthState.status =

      calculateOverallHealth();


    healthState.lastChecked =

      new Date().toISOString();


    return getHealthStatus();

  }


  // ─────────────────────────────────────────────
  // Get Health Status
  // ─────────────────────────────────────────────

  function getHealthStatus() {

    return {

      status:

        healthState.status,

      environment:

        healthState.environment,

      initialized:

        healthState.initialized,

      lastChecked:

        healthState.lastChecked,

      checkCount:

        Object.keys(

          healthState.checks

        ).length,

      warningCount:

        healthState.warnings.length,

      errorCount:

        healthState.errors.length,

      checks:

        Object.assign(

          {},

          healthState.checks

        )

    };

  }


  // ─────────────────────────────────────────────
  // Initialize Health
  // ─────────────────────────────────────────────

  function initializeHealth() {

    if (

      healthState.initialized

    ) {

      return getHealthStatus();

    }


    healthState.initialized = true;


    return runHealthCheck();

  }


  // ─────────────────────────────────────────────
  // Reset Health
  // ─────────────────────────────────────────────

  function resetHealth() {

    healthState.status =

      "UNKNOWN";


    healthState.initialized =

      false;


    healthState.lastChecked =

      null;


    healthState.checks = {};


    healthState.warnings = [];


    healthState.errors = [];


    return getHealthStatus();

  }


  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  const healthAPI = {

    initializeHealth,

    runHealthCheck,

    getHealthStatus,

    calculateOverallHealth,

    resetHealth,

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
