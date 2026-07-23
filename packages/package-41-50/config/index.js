/**

* BloggerSaaS Ultimate V5
* Package 41–50
* Configuration Index
* 
* Central configuration registry.
* 
* Responsibilities:
* - Safely register package configuration modules.
* - Retrieve registered configuration modules.
* - Validate configuration registration.
* - Expose configuration status.
* - Support safe development and testing.
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
// Configuration State
// ─────────────────────────────────────────────

const configurationState = {

initialized: false,

environment: "safe-development",

sources: {},

errors: []

};

// ─────────────────────────────────────────────
// Validate Configuration Name
// ─────────────────────────────────────────────

function validateConfigName(configName) {

return (

  typeof configName === "string" &&

  configName.trim().length > 0

);

}

// ─────────────────────────────────────────────
// Validate Configuration Object
// ─────────────────────────────────────────────

function isValidConfigObject(configObject) {

return (

  configObject !== null &&

  typeof configObject === "object" &&

  !Array.isArray(configObject)

);

}

// ─────────────────────────────────────────────
// Configuration Registration
// ─────────────────────────────────────────────

function registerConfig(

configName,

configObject,

options = {}

) {

if (

  !validateConfigName(configName)

) {

  throw new Error(

    "Configuration name must be a non-empty string."

  );

}


if (

  !isValidConfigObject(configObject)

) {

  throw new TypeError(

    "Configuration object must be a non-null plain object."

  );

}


const overwrite =

  options.overwrite === true;


if (

  hasConfig(configName) &&

  !overwrite

) {

  throw new Error(

    `Configuration "${configName}" is already registered.`

  );

}


configurationState.sources[

  configName.trim()

] = configObject;


return true;

}

// ─────────────────────────────────────────────
// Configuration Retrieval
// ─────────────────────────────────────────────

function getConfig(configName) {

if (

  !validateConfigName(configName)

) {

  return null;

}


return (

  configurationState.sources[

    configName.trim()

  ] ||

  null

);

}

// ─────────────────────────────────────────────
// Configuration Existence Check
// ─────────────────────────────────────────────

function hasConfig(configName) {

if (

  !validateConfigName(configName)

) {

  return false;

}


return Object.prototype.hasOwnProperty.call(

  configurationState.sources,

  configName.trim()

);

}

// ─────────────────────────────────────────────
// List Registered Configurations
// ─────────────────────────────────────────────

function listConfigs() {

return Object.keys(

  configurationState.sources

);

}

// ─────────────────────────────────────────────
// Get All Configurations
// ─────────────────────────────────────────────

function getAllConfigs() {

return Object.assign(

  {},

  configurationState.sources

);

}

// ─────────────────────────────────────────────
// Configuration Validation
// ─────────────────────────────────────────────

function validateConfig(configName) {

const config =

  getConfig(configName);


if (!config) {

  return {

    valid: false,

    configName,

    status: "FAILED",

    message:

      "Configuration is not registered."

  };

}


return {

  valid: true,

  configName,

  status: "HEALTHY",

  message:

    "Configuration is registered."

};

}

// ─────────────────────────────────────────────
// Validate All Configurations
// ─────────────────────────────────────────────

function validateAllConfigs() {

const configs = listConfigs();

const results = {};

configs.forEach(

  function (configName) {

    results[configName] =

      validateConfig(configName);

  }

);

return results;

}

// ─────────────────────────────────────────────
// Initialize Configuration System
// ─────────────────────────────────────────────

function initializeConfig() {

if (

  configurationState.initialized

) {

  return getConfigStatus();

}


configurationState.initialized = true;


return getConfigStatus();

}

// ─────────────────────────────────────────────
// Configuration Status
// ─────────────────────────────────────────────

function getConfigStatus() {

const registeredConfigs =

  listConfigs();


return {

  initialized:

    configurationState.initialized,

  environment:

    configurationState.environment,

  registeredConfigs,

  configCount:

    registeredConfigs.length,

  errorCount:

    configurationState.errors.length

};

}

// ─────────────────────────────────────────────
// Record Configuration Error
// ─────────────────────────────────────────────

function recordError(error) {

const message =

  error &&

  error.message

    ? error.message

    : String(error);


configurationState.errors.push({

  message,

  timestamp:

    new Date().toISOString()

});


return false;

}

// ─────────────────────────────────────────────
// Safe Reset
// ─────────────────────────────────────────────

function resetConfig() {

configurationState.sources = {};

configurationState.errors = [];

configurationState.initialized = false;


return true;

}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

const configurationAPI = {

initializeConfig,

registerConfig,

getConfig,

hasConfig,

listConfigs,

getAllConfigs,

validateConfig,

validateAllConfigs,

getConfigStatus,

recordError,

resetConfig,

state:

  configurationState

};

// ─────────────────────────────────────────────
// Browser Global
// ─────────────────────────────────────────────

global.BloggerSaaSConfig =

configurationAPI;

// ─────────────────────────────────────────────
// Node / Test Export
// ─────────────────────────────────────────────

if (

typeof module !== "undefined" &&

module.exports

) {

module.exports =

  configurationAPI;

}

})(
typeof globalThis !== "undefined"

? globalThis

: this

);
