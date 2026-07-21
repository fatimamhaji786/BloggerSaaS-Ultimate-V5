/**
 * BloggerSaaS Ultimate V5
 * Package 41–50
 * Core Integration Layer
 *
 * Coordinates package modules in a safe development environment.
 *
 * This module does not automatically modify production systems.
 */

(function (global) {

  "use strict";


  // ─────────────────────────────────────────────
  // Integration State
  // ─────────────────────────────────────────────

  const integrationState = {

    initialized: false,

    environment: "safe-development",

    modules: {},

    events: [],

    errors: []

  };


  // ─────────────────────────────────────────────
  // Event Bus
  // ─────────────────────────────────────────────

  const eventBus = {

    listeners: {},


    on(eventName, callback) {

      if (typeof callback !== "function") {

        throw new TypeError(
          "Event listener must be a function."
        );

      }

      if (!this.listeners[eventName]) {

        this.listeners[eventName] = [];

      }

      this.listeners[eventName].push(callback);

    },


    emit(eventName, payload = {}) {

      integrationState.events.push({

        event: eventName,

        timestamp: new Date().toISOString(),

        payload

      });

      const listeners =
        this.listeners[eventName] || [];

      listeners.forEach(callback => {

        try {

          callback(payload);

        } catch (error) {

          integrationState.errors.push({

            event: eventName,

            message: error.message,

            timestamp: new Date().toISOString()

          });

        }

      });

    },


    clear() {

      this.listeners = {};

    }

  };


  // ─────────────────────────────────────────────
  // Module Registration
  // ─────────────────────────────────────────────

  function registerModule(moduleName, moduleInstance) {

    if (!moduleName) {

      throw new Error(
        "Module name is required."
      );

    }

    if (!moduleInstance) {

      throw new Error(
        "Module instance is required."
      );

    }

    integrationState.modules[moduleName] =
      moduleInstance;

    eventBus.emit(

      "module:registered",

      {

        moduleName

      }

    );

    return true;

  }


  // ─────────────────────────────────────────────
  // Module Retrieval
  // ─────────────────────────────────────────────

  function getModule(moduleName) {

    return integrationState.modules[moduleName] || null;

  }


  // ─────────────────────────────────────────────
  // Module Status
  // ─────────────────────────────────────────────

  function getIntegrationStatus() {

    return {

      initialized:
        integrationState.initialized,

      environment:
        integrationState.environment,

      registeredModules:
        Object.keys(
          integrationState.modules
        ),

      eventCount:
        integrationState.events.length,

      errorCount:
        integrationState.errors.length

    };

  }


  // ─────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────

  function initializeIntegration() {

    if (integrationState.initialized) {

      return getIntegrationStatus();

    }

    integrationState.initialized = true;

    eventBus.emit(

      "integration:initialized",

      {

        environment:
          integrationState.environment

      }

    );

    return getIntegrationStatus();

  }


  // ─────────────────────────────────────────────
  // Safe Shutdown
  // ─────────────────────────────────────────────

  function shutdownIntegration() {

    eventBus.emit(

      "integration:shutdown",

      {}

    );

    integrationState.initialized = false;

    eventBus.clear();

    return true;

  }


  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  const integrationAPI = {

    initializeIntegration,

    shutdownIntegration,

    registerModule,

    getModule,

    getIntegrationStatus,

    eventBus,

    state: integrationState

  };


  // ─────────────────────────────────────────────
  // Browser Global
  // ─────────────────────────────────────────────

  if (typeof window !== "undefined") {

    window.BloggerSaaSIntegration =
      integrationAPI;

  }


  // ─────────────────────────────────────────────
  // Node / Test Export
  // ─────────────────────────────────────────────

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {

    module.exports =
      integrationAPI;

  }


})(typeof globalThis !== "undefined"
  ? globalThis
  : this);
