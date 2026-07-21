/**
 * BloggerSaaS Ultimate V5
 * Package 41–50
 * Core Integration Layer
 */

(function (global) {

  "use strict";

  const integrationState = {

    initialized: false,

    environment: "safe-development",

    modules: {},

    events: [],

    errors: []

  };

  const eventBus = {

    listeners: {},

    on(eventName, callback) {

      if (

        typeof eventName !== "string" ||

        !eventName.trim()

      ) {

        throw new Error(

          "Event name is required."

        );

      }

      if (

        typeof callback !== "function"

      ) {

        throw new TypeError(

          "Event listener must be a function."

        );

      }

      if (!this.listeners[eventName]) {

        this.listeners[eventName] = [];

      }

      this.listeners[eventName].push(callback);

      return true;

    },

    off(eventName, callback) {

      if (!this.listeners[eventName]) {

        return false;

      }

      this.listeners[eventName] =

        this.listeners[eventName].filter(

          listener => listener !== callback

        );

      return true;

    },

    emit(eventName, payload = {}) {

      integrationState.events.push({

        event: eventName,

        timestamp:

          new Date().toISOString(),

        payload

      });

      const listeners =

        this.listeners[eventName] || [];

      listeners.forEach(callback => {

        try {

          callback(payload);

        }

        catch (error) {

          integrationState.errors.push({

            event: eventName,

            message: error.message,

            timestamp:

              new Date().toISOString()

          });

        }

      });

    },

    clear() {

      this.listeners = {};

    }

  };

  function registerModule(

    moduleName,

    moduleInstance

  ) {

    if (

      typeof moduleName !== "string" ||

      !moduleName.trim()

    ) {

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

  function getModule(moduleName) {

    return (

      integrationState.modules[moduleName] ||

      null

    );

  }

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

  function initializeIntegration() {

    if (

      integrationState.initialized

    ) {

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

  function shutdownIntegration() {

    eventBus.emit(

      "integration:shutdown",

      {}

    );

    integrationState.initialized = false;

    eventBus.clear();

    return true;

  }

  const integrationAPI = {

    initializeIntegration,

    shutdownIntegration,

    registerModule,

    getModule,

    getIntegrationStatus,

    eventBus,

    state: integrationState

  };

  global.BloggerSaaSIntegration =

    integrationAPI;

  if (

    typeof module !== "undefined" &&

    module.exports

  ) {

    module.exports =

      integrationAPI;

  }

})(

  typeof globalThis !== "undefined"

    ? globalThis

    : this

);
