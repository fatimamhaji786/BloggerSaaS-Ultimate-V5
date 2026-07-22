/**
 * BloggerSaaS Ultimate V5
 * Package 41–50
 * Core Integration Layer
 *
 * Safe development integration controller.
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


    // ─────────────────────────────────────────
    // Register Listener
    // ─────────────────────────────────────────

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


      if (

        !this.listeners[eventName]

      ) {

        this.listeners[eventName] = [];

      }


      this.listeners[eventName].push(

        callback

      );


      return true;

    },


    // ─────────────────────────────────────────
    // Remove Listener
    // ─────────────────────────────────────────

    off(eventName, callback) {

      if (

        typeof eventName !== "string"

      ) {

        return false;

      }


      if (

        !this.listeners[eventName]

      ) {

        return false;

      }


      this.listeners[eventName] =

        this.listeners[eventName].filter(

          listener =>

            listener !== callback

        );


      return true;

    },


    // ─────────────────────────────────────────
    // Emit Event
    // ─────────────────────────────────────────

    emit(

      eventName,

      payload = {}

    ) {

      if (

        typeof eventName !== "string" ||

        !eventName.trim()

      ) {

        return false;

      }


      integrationState.events.push({

        event: eventName,

        timestamp:

          new Date().toISOString(),

        payload

      });


      const listeners = [

        ...(

          this.listeners[eventName] ||

          []

        )

      ];


      listeners.forEach(

        callback => {

          try {

            callback(payload);

          }

          catch (error) {

            integrationState.errors.push({

              event: eventName,

              message:

                error.message,

              timestamp:

                new Date().toISOString()

            });

          }

        }

      );


      return true;

    },


    // ─────────────────────────────────────────
    // Clear Listeners
    // ─────────────────────────────────────────

    clear() {

      this.listeners = {};

    }

  };


  // ─────────────────────────────────────────────
  // Register Module
  // ─────────────────────────────────────────────

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


    if (

      !moduleInstance

    ) {

      throw new Error(

        "Module instance is required."

      );

    }


    if (

      integrationState.modules[

        moduleName

      ]

    ) {

      throw new Error(

        `Module "${moduleName}" is already registered.`

      );

    }


    integrationState.modules[

      moduleName

    ] = moduleInstance;


    eventBus.emit(

      "module:registered",

      {

        moduleName

      }

    );


    return true;

  }


  // ─────────────────────────────────────────────
  // Get Module
  // ─────────────────────────────────────────────

  function getModule(

    moduleName

  ) {

    if (

      typeof moduleName !== "string" ||

      !moduleName.trim()

    ) {

      return null;

    }


    return (

      integrationState.modules[

        moduleName

      ] ||

      null

    );

  }


  // ─────────────────────────────────────────────
  // Integration Status
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
  // Initialize Integration
  // ─────────────────────────────────────────────

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


  // ─────────────────────────────────────────────
  // Shutdown Integration
  // ─────────────────────────────────────────────

  function shutdownIntegration() {

    eventBus.emit(

      "integration:shutdown",

      {}

    );


    integrationState.initialized = false;


    integrationState.modules = {};


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

    state:

      integrationState

  };


  // ─────────────────────────────────────────────
  // Browser Global
  // ─────────────────────────────────────────────

  global.BloggerSaaSIntegration =

    integrationAPI;


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


})(
  typeof globalThis !== "undefined"

    ? globalThis

    : this
);
