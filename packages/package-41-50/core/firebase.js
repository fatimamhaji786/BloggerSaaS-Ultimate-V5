/**
 * BloggerSaaS Ultimate V5
 * Package 41–50
 * Core Firebase Bridge
 *
 * Provides safe Firebase initialization and status
 * management for the package.
 *
 * This module does not modify production data automatically.
 */

(function (global) {

  "use strict";


  // ─────────────────────────────────────────────
  // Firebase State
  // ─────────────────────────────────────────────

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


  // ─────────────────────────────────────────────
  // Firebase Configuration Validation
  // ─────────────────────────────────────────────

  function validateFirebaseConfig(config) {

    if (!config || typeof config !== "object") {

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

      valid: errors.length === 0,

      errors

    };

  }


  // ─────────────────────────────────────────────
  // Firebase SDK Detection
  // ─────────────────────────────────────────────

  function isFirebaseSDKAvailable() {

    return (

      typeof firebase !== "undefined" &&

      typeof firebase.initializeApp === "function"

    );

  }


  // ─────────────────────────────────────────────
  // Safe Firebase Initialization
  // ─────────────────────────────────────────────

  function initializeFirebase(config) {

    const validation =

      validateFirebaseConfig(config);


    if (!validation.valid) {

      firebaseState.errors.push(

        ...validation.errors

      );

      return {

        success: false,

        status: getFirebaseStatus(),

        errors: validation.errors

      };

    }


    firebaseState.configured = true;


    if (!isFirebaseSDKAvailable()) {

      return {

        success: false,

        status: getFirebaseStatus(),

        errors: [

          "Firebase SDK is not available."

        ]

      };

    }


    try {


      if (!firebase.apps.length) {

        firebaseState.app =

          firebase.initializeApp(config);

      }

      else {

        firebaseState.app =

          firebase.app();

      }


      firebaseState.auth =

        firebase.auth();


      firebaseState.database =

        firebase.database();


      firebaseState.initialized = true;

      firebaseState.connected = true;


      return {

        success: true,

        status: getFirebaseStatus()

      };


    }

    catch (error) {


      firebaseState.errors.push({

        message: error.message,

        timestamp: new Date().toISOString()

      });


      return {

        success: false,

        status: getFirebaseStatus(),

        errors: [

          error.message

        ]

      };

    }

  }


  // ─────────────────────────────────────────────
  // Firebase Status
  // ─────────────────────────────────────────────

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


  // ─────────────────────────────────────────────
  // Connection Status
  // ─────────────────────────────────────────────

  function setConnectionStatus(status) {

    firebaseState.connected =

      Boolean(status);


    return getFirebaseStatus();

  }


  // ─────────────────────────────────────────────
  // Safe Shutdown
  // ─────────────────────────────────────────────

  function shutdownFirebase() {

    firebaseState.initialized = false;

    firebaseState.connected = false;

    firebaseState.app = null;

    firebaseState.auth = null;

    firebaseState.database = null;


    return true;

  }


  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  const firebaseAPI = {

    initializeFirebase,

    validateFirebaseConfig,

    isFirebaseSDKAvailable,

    getFirebaseStatus,

    setConnectionStatus,

    shutdownFirebase,

    state: firebaseState

  };


  // ─────────────────────────────────────────────
  // Browser Global
  // ─────────────────────────────────────────────

  if (typeof window !== "undefined") {

    window.BloggerSaaSFirebase =

      firebaseAPI;

  }


  // ─────────────────────────────────────────────
  // Node / Test Export
  // ─────────────────────────────────────────────

  if (

    typeof module !== "undefined" &&

    module.exports

  ) {

    module.exports = firebaseAPI;

  }


})(

  typeof globalThis !== "undefined"

    ? globalThis

    : this

);
