/**
 * BloggerSaaS Ultimate V5
 * Package 41–50
 * Core Dashboard Bridge
 *
 * Safe development dashboard status aggregator.
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
  // Dashboard State
  // ─────────────────────────────────────────────

  const dashboardState = {

    initialized: false,

    environment: "safe-development",

    lastUpdated: null,

    health: null,

    firebase: null,

    integration: null,

    verification: null,

    tests: null,

    warnings: [],

    errors: []

  };


  // ─────────────────────────────────────────────
  // Initialize Dashboard
  // ─────────────────────────────────────────────

  function initializeDashboard() {

    if (

      dashboardState.initialized

    ) {

      return getDashboardStatus();

    }


    dashboardState.initialized = true;


    dashboardState.lastUpdated =

      new Date().toISOString();


    return getDashboardStatus();

  }


  // ─────────────────────────────────────────────
  // Update Dashboard Status
  // ─────────────────────────────────────────────

  function updateDashboardStatus(

    status = {}

  ) {

    if (

      !status ||

      typeof status !== "object" ||

      Array.isArray(status)

    ) {

      throw new TypeError(

        "Dashboard status must be a plain object."

      );

    }


    if (

      status.health !== undefined

    ) {

      dashboardState.health =

        status.health;

    }


    if (

      status.firebase !== undefined

    ) {

      dashboardState.firebase =

        status.firebase;

    }


    if (

      status.integration !== undefined

    ) {

      dashboardState.integration =

        status.integration;

    }


    if (

      status.verification !== undefined

    ) {

      dashboardState.verification =

        status.verification;

    }


    if (

      status.tests !== undefined

    ) {

      dashboardState.tests =

        status.tests;

    }


    if (

      Array.isArray(

        status.warnings

      )

    ) {

      dashboardState.warnings =

        [

          ...status.warnings

        ];

    }


    if (

      Array.isArray(

        status.errors

      )

    ) {

      dashboardState.errors =

        [

          ...status.errors

        ];

    }


    dashboardState.lastUpdated =

      new Date().toISOString();


    return getDashboardStatus();

  }


  // ─────────────────────────────────────────────
  // Refresh From Registered Modules
  // ─────────────────────────────────────────────

  function refreshFromModules() {

    const health =

      global.BloggerSaaSHealth;


    const firebase =

      global.BloggerSaaSFirebase;


    const integration =

      global.BloggerSaaSIntegration;


    const verification =

      global.BloggerSaaSVerification;


    const testSuite =

      global.BloggerSaaSTestSuite;


    const updates = {};


    // Health

    if (

      health &&

      typeof health.getHealthStatus ===

        "function"

    ) {

      updates.health =

        health.getHealthStatus();

    }


    // Firebase

    if (

      firebase &&

      typeof firebase.getFirebaseStatus ===

        "function"

    ) {

      updates.firebase =

        firebase.getFirebaseStatus();

    }


    // Integration

    if (

      integration &&

      typeof integration.getIntegrationStatus ===

        "function"

    ) {

      updates.integration =

        integration.getIntegrationStatus();

    }


    // Verification

    if (

      verification &&

      typeof verification.getVerificationStatus ===

        "function"

    ) {

      updates.verification =

        verification.getVerificationStatus();

    }


    // Test Suite

    if (

      testSuite &&

      typeof testSuite.getTestReport ===

        "function"

    ) {

      updates.tests =

        testSuite.getTestReport();

    }


    return updateDashboardStatus(

      updates

    );

  }


  // ─────────────────────────────────────────────
  // Add Warning
  // ─────────────────────────────────────────────

  function addWarning(message) {

    if (

      message === null ||

      message === undefined ||

      String(message).trim() === ""

    ) {

      return false;

    }


    dashboardState.warnings.push({

      message:

        String(message),

      timestamp:

        new Date().toISOString()

    });


    dashboardState.lastUpdated =

      new Date().toISOString();


    return true;

  }


  // ─────────────────────────────────────────────
  // Add Error
  // ─────────────────────────────────────────────

  function addError(message) {

    if (

      message === null ||

      message === undefined ||

      String(message).trim() === ""

    ) {

      return false;

    }


    dashboardState.errors.push({

      message:

        String(message),

      timestamp:

        new Date().toISOString()

    });


    dashboardState.lastUpdated =

      new Date().toISOString();


    return true;

  }


  // ─────────────────────────────────────────────
  // Calculate Overall Status
  // ─────────────────────────────────────────────

  function calculateOverallStatus() {

    if (

      dashboardState.errors.length > 0

    ) {

      return "ERROR";

    }


    if (

      dashboardState.warnings.length > 0

    ) {

      return "WARNING";

    }


    const hasAnyStatus =

      dashboardState.health !== null ||

      dashboardState.firebase !== null ||

      dashboardState.integration !== null ||

      dashboardState.verification !== null ||

      dashboardState.tests !== null;


    if (!hasAnyStatus) {

      return "NO-DATA";

    }


    return "HEALTHY";

  }


  // ─────────────────────────────────────────────
  // Get Dashboard Status
  // ─────────────────────────────────────────────

  function getDashboardStatus() {

    return {

      initialized:

        dashboardState.initialized,

      environment:

        dashboardState.environment,

      overallStatus:

        calculateOverallStatus(),

      lastUpdated:

        dashboardState.lastUpdated,

      health:

        dashboardState.health,

      firebase:

        dashboardState.firebase,

      integration:

        dashboardState.integration,

      verification:

        dashboardState.verification,

      tests:

        dashboardState.tests,

      warningCount:

        dashboardState.warnings.length,

      errorCount:

        dashboardState.errors.length

    };

  }


  // ─────────────────────────────────────────────
  // Create Dashboard Snapshot
  // ─────────────────────────────────────────────

  function createDashboardSnapshot() {

    return {

      generatedAt:

        new Date().toISOString(),

      status:

        getDashboardStatus(),

      warnings:

        [

          ...dashboardState.warnings

        ],

      errors:

        [

          ...dashboardState.errors

        ]

    };

  }


  // ─────────────────────────────────────────────
  // Clear Warnings
  // ─────────────────────────────────────────────

  function clearWarnings() {

    dashboardState.warnings = [];


    dashboardState.lastUpdated =

      new Date().toISOString();


    return true;

  }


  // ─────────────────────────────────────────────
  // Clear Errors
  // ─────────────────────────────────────────────

  function clearErrors() {

    dashboardState.errors = [];


    dashboardState.lastUpdated =

      new Date().toISOString();


    return true;

  }


  // ─────────────────────────────────────────────
  // Shutdown Dashboard
  // ─────────────────────────────────────────────

  function shutdownDashboard() {

    dashboardState.initialized = false;


    dashboardState.lastUpdated =

      new Date().toISOString();


    return true;

  }


  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  const dashboardAPI = {

    initializeDashboard,

    updateDashboardStatus,

    refreshFromModules,

    addWarning,

    addError,

    clearWarnings,

    clearErrors,

    calculateOverallStatus,

    getDashboardStatus,

    createDashboardSnapshot,

    shutdownDashboard,

    state:

      dashboardState

  };


  // ─────────────────────────────────────────────
  // Browser Global
  // ─────────────────────────────────────────────

  global.BloggerSaaSDashboard =

    dashboardAPI;


  // ─────────────────────────────────────────────
  // Node / Test Export
  // ─────────────────────────────────────────────

  if (

    typeof module !== "undefined" &&

    module.exports

  ) {

    module.exports =

      dashboardAPI;

  }


})(

  typeof globalThis !== "undefined"

    ? globalThis

    : this

);
