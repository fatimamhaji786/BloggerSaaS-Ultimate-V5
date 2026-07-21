
/**
 * BloggerSaaS Ultimate V5
 * Package 41–50
 * Core Dashboard Bridge
 *
 * Provides safe dashboard status data for the
 * BloggerSaaS Ultimate V5 Enterprise system.
 *
 * This module does not directly modify production
 * Dashboard V2 or live Firebase data.
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
  // Dashboard Initialization
  // ─────────────────────────────────────────────

  function initializeDashboard() {

    if (dashboardState.initialized) {

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

  function updateDashboardStatus(status = {}) {

    if (!status || typeof status !== "object") {

      throw new TypeError(

        "Dashboard status must be an object."

      );

    }


    if (status.health !== undefined) {

      dashboardState.health =

        status.health;

    }


    if (status.firebase !== undefined) {

      dashboardState.firebase =

        status.firebase;

    }


    if (status.integration !== undefined) {

      dashboardState.integration =

        status.integration;

    }


    if (status.verification !== undefined) {

      dashboardState.verification =

        status.verification;

    }


    if (status.tests !== undefined) {

      dashboardState.tests =

        status.tests;

    }


    if (Array.isArray(status.warnings)) {

      dashboardState.warnings =

        [...status.warnings];

    }


    if (Array.isArray(status.errors)) {

      dashboardState.errors =

        [...status.errors];

    }


    dashboardState.lastUpdated =

      new Date().toISOString();


    return getDashboardStatus();

  }


  // ─────────────────────────────────────────────
  // Add Warning
  // ─────────────────────────────────────────────

  function addWarning(message) {

    if (!message) {

      return false;

    }


    dashboardState.warnings.push({

      message: String(message),

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

    if (!message) {

      return false;

    }


    dashboardState.errors.push({

      message: String(message),

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

    if (dashboardState.errors.length > 0) {

      return "ERROR";

    }


    if (dashboardState.warnings.length > 0) {

      return "WARNING";

    }


    return "HEALTHY";

  }


  // ─────────────────────────────────────────────
  // Dashboard Status
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
  // Dashboard Snapshot
  // ─────────────────────────────────────────────

  function createDashboardSnapshot() {

    return {

      generatedAt:

        new Date().toISOString(),

      status:

        getDashboardStatus(),

      warnings:

        [...dashboardState.warnings],

      errors:

        [...dashboardState.errors]

    };

  }


  // ─────────────────────────────────────────────
  // Safe Shutdown
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

    addWarning,

    addError,

    calculateOverallStatus,

    getDashboardStatus,

    createDashboardSnapshot,

    shutdownDashboard,

    state: dashboardState

  };


  // ─────────────────────────────────────────────
  // Browser Global
  // ─────────────────────────────────────────────

  if (typeof window !== "undefined") {

    window.BloggerSaaSDashboard =

      dashboardAPI;

  }


  // ─────────────────────────────────────────────
  // Node / Test Export
  // ─────────────────────────────────────────────

  if (

    typeof module !== "undefined" &&

    module.exports

  ) {

    module.exports = dashboardAPI;

  }


})(

  typeof globalThis !== "undefined"

    ? globalThis

    : this

);
