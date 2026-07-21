/**
 * BloggerSaaS Ultimate V5
 * Package 41–50
 * Core Dashboard Bridge
 */

(function (global) {

  "use strict";

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

  function initializeDashboard() {

    if (dashboardState.initialized) {

      return getDashboardStatus();

    }

    dashboardState.initialized = true;

    dashboardState.lastUpdated =
      new Date().toISOString();

    return getDashboardStatus();

  }

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

  function addWarning(message) {

    if (!message) {

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

  function addError(message) {

    if (!message) {

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

  function calculateOverallStatus() {

    if (dashboardState.errors.length > 0) {

      return "ERROR";

    }

    if (dashboardState.warnings.length > 0) {

      return "WARNING";

    }

    return "HEALTHY";

  }

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

  function shutdownDashboard() {

    dashboardState.initialized = false;

    dashboardState.lastUpdated =
      new Date().toISOString();

    return true;

  }

  const dashboardAPI = {

    initializeDashboard,

    updateDashboardStatus,

    addWarning,

    addError,

    calculateOverallStatus,

    getDashboardStatus,

    createDashboardSnapshot,

    shutdownDashboard,

    state:
      dashboardState

  };

  if (typeof window !== "undefined") {

    window.BloggerSaaSDashboard =
      dashboardAPI;

  }

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
