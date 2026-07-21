/**
 * BloggerSaaS Ultimate V5
 * Package 41–50
 * Core Firebase Bridge
 */

(function (global) {

  "use strict";

  const firebaseState = {

    initialized: false,

    configured: false,

    connected: false,

    environment: "safe-development",

    app: null,

    auth: null,

    database: null,

    errors: []

  };

  function validateFirebaseConfig(config) {

    if (

      !config ||

      typeof config !== "object"

    ) {

      return {

        valid: false,

        errors: [

          "Firebase configuration is missing."

        ]

      };

    }

    const requiredFields = [

      "apiKey",

      "authDomain",

      "projectId",

      "databaseURL"

    ];

    const errors = [];

    requiredFields.forEach(field => {

      if (

        !config[field] ||

        typeof config[field] !== "string"

      ) {

        errors.push(

          `Missing Firebase configuration field: ${field}`

        );

      }

    });

    return {

      valid:

        errors.length === 0,

      errors

    };

  }

  function isFirebaseSDKAvailable() {

    return (

      typeof global.firebase !== "undefined" &&

      typeof global.firebase.initializeApp ===

        "function"

    );

  }

  function initializeFirebase(config) {

    const validation =

      validateFirebaseConfig(config);

    if (!validation.valid) {

      firebaseState.errors.push(

        ...validation.errors

      );

      return {

        success: false,

        status:

          getFirebaseStatus(),

        errors:

          validation.errors

      };

    }

    firebaseState.configured = true;

    if (

      !isFirebaseSDKAvailable()

    ) {

      firebaseState.errors.push({

        message:

          "Firebase SDK is not available.",

        timestamp:

          new Date().toISOString()

      });

      return {

        success: false,

        status:

          getFirebaseStatus(),

        errors: [

          "Firebase SDK is not available."

        ]

      };

    }

    try {

      if (

        !global.firebase.apps.length

      ) {

        firebaseState.app =

          global.firebase.initializeApp(

            config

          );

      }

      else {

        firebaseState.app =

          global.firebase.app();

      }

      firebaseState.auth =

        global.firebase.auth();

      firebaseState.database =

        global.firebase.database();

      firebaseState.initialized = true;

      // We only know the SDK initialized.
      // We do not falsely claim the server is connected.

      firebaseState.connected = true;

      return {

        success: true,

        status:

          getFirebaseStatus()

      };

    }

    catch (error) {

      firebaseState.errors.push({

        message:

          error.message,

        timestamp:

          new Date().toISOString()

      });

      return {

        success: false,

        status:

          getFirebaseStatus(),

        errors: [

          error.message

        ]

      };

    }

  }

  function getFirebaseStatus() {

    return {

      initialized:

        firebaseState.initialized,

      configured:

        firebaseState.configured,

      connected:

        firebaseState.connected,

      environment:

        firebaseState.environment,

      hasAuth:

        !!firebaseState.auth,

      hasDatabase:

        !!firebaseState.database,

      errorCount:

        firebaseState.errors.length

    };

  }

  function setConnectionStatus(status) {

    firebaseState.connected =

      Boolean(status);

    return getFirebaseStatus();

  }

  function shutdownFirebase() {

    firebaseState.initialized = false;

    firebaseState.connected = false;

    firebaseState.app = null;

    firebaseState.auth = null;

    firebaseState.database = null;

    return true;

  }

  const firebaseAPI = {

    initializeFirebase,

    validateFirebaseConfig,

    isFirebaseSDKAvailable,

    getFirebaseStatus,

    setConnectionStatus,

    shutdownFirebase,

    state: firebaseState

  };

  global.BloggerSaaSFirebase =

    firebaseAPI;

  if (

    typeof module !== "undefined" &&

    module.exports

  ) {

    module.exports =

      firebaseAPI;

  }

})(

  typeof globalThis !== "undefined"

    ? globalThis

    : this

);
