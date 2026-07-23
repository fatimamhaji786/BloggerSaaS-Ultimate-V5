/**
 * BloggerSaaS Ultimate V5
 * Package 41–50
 * Firebase Configuration Example
 *
 * IMPORTANT:
 * This file contains example configuration only.
 *
 * Never place real private credentials, service-account keys,
 * private keys, or sensitive secrets in this file.
 *
 * Safe for development and documentation purposes.
 */

"use strict";


// ─────────────────────────────────────────────
// Firebase Configuration Example
// ─────────────────────────────────────────────

const FIREBASE_CONFIG_EXAMPLE = Object.freeze({

  apiKey:

    "YOUR_FIREBASE_API_KEY",

  authDomain:

    "YOUR_PROJECT_ID.firebaseapp.com",

  databaseURL:

    "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",

  projectId:

    "YOUR_PROJECT_ID",

  storageBucket:

    "YOUR_PROJECT_ID.firebasestorage.app",

  messagingSenderId:

    "YOUR_MESSAGING_SENDER_ID",

  appId:

    "YOUR_FIREBASE_APP_ID"

});


// ─────────────────────────────────────────────
// Required Configuration Fields
// ─────────────────────────────────────────────

const REQUIRED_FIELDS = Object.freeze([

  "apiKey",

  "authDomain",

  "databaseURL",

  "projectId",

  "storageBucket",

  "messagingSenderId",

  "appId"

]);


// ─────────────────────────────────────────────
// Example Placeholder Markers
// ─────────────────────────────────────────────

const EXAMPLE_MARKERS = Object.freeze([

  "YOUR_FIREBASE_API_KEY",

  "YOUR_PROJECT_ID",

  "YOUR_MESSAGING_SENDER_ID",

  "YOUR_FIREBASE_APP_ID",

  "YOUR_FIREBASE_CONFIG",

  "REPLACE_WITH_REAL_VALUE",

  "YOUR_VALUE_HERE"

]);


// ─────────────────────────────────────────────
// Validate Firebase Configuration
// ─────────────────────────────────────────────

function validateFirebaseConfig(

  config

) {

  if (

    !config ||

    typeof config !==

      "object" ||

    Array.isArray(config)

  ) {

    return {

      valid: false,

      errors: [

        "Firebase configuration must be a plain object."

      ]

    };

  }


  const errors = [];


  REQUIRED_FIELDS.forEach(

    function (field) {

      if (

        !Object.prototype.hasOwnProperty.call(

          config,

          field

        )

      ) {

        errors.push(

          `Missing Firebase configuration field: ${field}`

        );

        return;

      }


      if (

        typeof config[field] !==

          "string" ||

        config[field].trim() === ""

      ) {

        errors.push(

          `Firebase configuration field "${field}" must be a non-empty string.`

        );

      }

    }

  );


  if (

    typeof config.authDomain ===

      "string" &&

    config.authDomain.trim() !== "" &&

    !config.authDomain.includes(

      ".firebaseapp.com"

    )

  ) {

    errors.push(

      "Firebase authDomain format appears invalid."

    );

  }


  if (

    typeof config.databaseURL ===

      "string" &&

    config.databaseURL.trim() !== "" &&

    !/^https?:\/\//i.test(

      config.databaseURL

    )

  ) {

    errors.push(

      "Firebase databaseURL must begin with http:// or https://."

    );

  }


  return {

    valid:

      errors.length === 0,

    errors

  };

}


// ─────────────────────────────────────────────
// Detect Example Configuration
// ─────────────────────────────────────────────

function isExampleConfiguration(

  config

) {

  if (

    !config ||

    typeof config !==

      "object"

  ) {

    return true;

  }


  const serializedConfig =

    JSON.stringify(config);


  return EXAMPLE_MARKERS.some(

    function (marker) {

      return serializedConfig.includes(

        marker

      );

    }

  );

}


// ─────────────────────────────────────────────
// Detect Placeholder Values
// ─────────────────────────────────────────────

function getPlaceholderFields(

  config

) {

  const targetConfig =

    config ||

    FIREBASE_CONFIG_EXAMPLE;


  const placeholders = [];


  Object.keys(

    targetConfig

  )

  .forEach(

    function (field) {

      const value =

        targetConfig[field];


      if (

        typeof value !==

          "string"

      ) {

        return;

      }


      const isPlaceholder =

        EXAMPLE_MARKERS.some(

          function (marker) {

            return value.includes(

              marker

            );

          }

        );


      if (

        isPlaceholder

      ) {

        placeholders.push(

          field

        );

      }

    }

  );


  return placeholders;

}


// ─────────────────────────────────────────────
// Production Safety Check
// ─────────────────────────────────────────────

function isProductionSafe(

  config

) {

  const targetConfig =

    config ||

    FIREBASE_CONFIG_EXAMPLE;


  return (

    isExampleConfiguration(

      targetConfig

    ) === true

  );

}


// ─────────────────────────────────────────────
// Safe Configuration Summary
// ─────────────────────────────────────────────

function getConfigurationSummary(

  config

) {

  const targetConfig =

    config ||

    FIREBASE_CONFIG_EXAMPLE;


  const validation =

    validateFirebaseConfig(

      targetConfig

    );


  const example =

    isExampleConfiguration(

      targetConfig

    );


  const placeholders =

    getPlaceholderFields(

      targetConfig

    );


  return {

    valid:

      validation.valid,

    example,

    productionSafe:

      example,

    status:

      example

        ? "EXAMPLE_CONFIGURATION"

        : validation.valid

          ? "CONFIGURATION_AVAILABLE"

          : "INVALID_CONFIGURATION",

    projectId:

      targetConfig.projectId ||

      null,

    authDomain:

      targetConfig.authDomain ||

      null,

    databaseURL:

      targetConfig.databaseURL ||

      null,

    placeholderFields:

      placeholders,

    errors:

      validation.errors

  };

}


// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

const firebaseConfigExampleAPI = {

  FIREBASE_CONFIG_EXAMPLE,

  REQUIRED_FIELDS,

  EXAMPLE_MARKERS,

  validateFirebaseConfig,

  isExampleConfiguration,

  getPlaceholderFields,

  isProductionSafe,

  getConfigurationSummary

};


// ─────────────────────────────────────────────
// Node / Test Export
// ─────────────────────────────────────────────

if (

  typeof module !==

    "undefined" &&

  module.exports

) {

  module.exports =

    firebaseConfigExampleAPI;

}


// ─────────────────────────────────────────────
// Browser Global
// ─────────────────────────────────────────────

if (

  typeof window !==

    "undefined"

) {

  window.BloggerSaaSFirebaseConfigExample =

    firebaseConfigExampleAPI;

}
