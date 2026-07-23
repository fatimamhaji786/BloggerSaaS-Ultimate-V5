/**

* BloggerSaaS Ultimate V5
* Package 41–50
* Dependency Map
* 
* Defines and validates the dependencies required by the package.
* 
* This module performs validation only.
* 
* Safety:
* - Does not install dependencies.
* - Does not modify dependencies.
* - Does not delete dependencies.
* - Does not modify production systems.
* - Does not modify live Firebase data.
* - Does not modify user accounts.
* - Does not deploy automatically.
    */

"use strict";

// ─────────────────────────────────────────────
// Dependency Definitions
// ─────────────────────────────────────────────

const DEPENDENCY_MAP = Object.freeze({

firebase: Object.freeze({

id: "firebase",

name: "Firebase",

required: true,

type: "external",

moduleName: "BloggerSaaSFirebase",

purpose:
  "Firebase initialization and service bridge."

}),

integration: Object.freeze({

id: "integration",

name: "Integration Layer",

required: true,

type: "internal",

moduleName: "BloggerSaaSIntegration",

purpose:
  "Core module integration and event communication."

}),

healthMonitor: Object.freeze({

id: "health-monitor",

name: "Health Monitor",

required: true,

type: "internal",

moduleName: "BloggerSaaSHealth",

purpose:
  "Package health monitoring."

}),

verificationLayer: Object.freeze({

id: "verification-layer",

name: "Verification Layer",

required: true,

type: "internal",

moduleName: "BloggerSaaSVerification",

purpose:
  "Package verification and safety checks."

}),

dashboard: Object.freeze({

id: "dashboard",

name: "Dashboard Bridge",

required: true,

type: "internal",

moduleName: "BloggerSaaSDashboard",

purpose:
  "Dashboard status aggregation and coordination."

}),

finalLayer: Object.freeze({

id: "final-layer",

name: "Final Orchestration Layer",

required: true,

type: "internal",

moduleName: "BloggerSaaSFinal",

purpose:
  "Final package orchestration and readiness calculation."

}),

testSuite: Object.freeze({

id: "test-suite",

name: "Test Suite",

required: true,

type: "internal",

moduleName: "BloggerSaaSTestSuite",

purpose:
  "Automated package diagnostics and testing."

})

});

// ─────────────────────────────────────────────
// Get Dependencies
// ─────────────────────────────────────────────

function getDependencies() {

return DEPENDENCY_MAP;

}

// ─────────────────────────────────────────────
// Get Dependency By ID
// ─────────────────────────────────────────────

function getDependency(

dependencyId

) {

if (

typeof dependencyId !== "string" ||

!dependencyId.trim()

) {

return null;

}

const dependency =

Object.values(

  DEPENDENCY_MAP

).find(

  function (item) {

    return (

      item.id ===

      dependencyId.trim()

    );

  }

);

return dependency || null;

}

// ─────────────────────────────────────────────
// Get Required Dependency IDs
// ─────────────────────────────────────────────

function getRequiredDependencyIds() {

return Object.values(

DEPENDENCY_MAP

)

.filter(

function (dependency) {

  return (

    dependency.required === true

  );

}

)

.map(

function (dependency) {

  return dependency.id;

}

);

}

// ─────────────────────────────────────────────
// Get Required Module Names
// ─────────────────────────────────────────────

function getRequiredModuleNames() {

return Object.values(

DEPENDENCY_MAP

)

.filter(

function (dependency) {

  return (

    dependency.required === true

  );

}

)

.map(

function (dependency) {

  return dependency.moduleName;

}

);

}

// ─────────────────────────────────────────────
// Validate Dependency Registry
// ─────────────────────────────────────────────

function validateDependencyRegistry() {

const errors = [];

const dependencies =

Object.values(

  DEPENDENCY_MAP

);

dependencies.forEach(

function (dependency) {


  if (

    typeof dependency.id !==

    "string" ||

    !dependency.id.trim()

  ) {

    errors.push(

      "Dependency ID is missing."

    );

  }


  if (

    typeof dependency.name !==

    "string" ||

    !dependency.name.trim()

  ) {

    errors.push(

      `Dependency name is missing for ${dependency.id || "unknown"}.`

    );

  }


  if (

    dependency.required !== true &&

    dependency.required !== false

  ) {

    errors.push(

      `Dependency required flag is invalid for ${dependency.id || "unknown"}.`

    );

  }


  if (

    dependency.type !==

    "internal" &&

    dependency.type !==

    "external"

  ) {

    errors.push(

      `Dependency type is invalid for ${dependency.id || "unknown"}.`

    );

  }


  if (

    typeof dependency.moduleName !==

    "string" ||

    !dependency.moduleName.trim()

  ) {

    errors.push(

      `Dependency module name is missing for ${dependency.id || "unknown"}.`

    );

  }


  if (

    typeof dependency.purpose !==

    "string" ||

    !dependency.purpose.trim()

  ) {

    errors.push(

      `Dependency purpose is missing for ${dependency.id || "unknown"}.`

    );

  }

}

);

const ids =

dependencies.map(

  function (dependency) {

    return dependency.id;

  }

);

const duplicateIds =

ids.filter(

  function (id, index) {

    return (

      ids.indexOf(id) !==

      index

    );

  }

);

duplicateIds.forEach(

function (id) {

  errors.push(

    `Duplicate dependency ID detected: ${id}.`

  );

}

);

return {

valid:

  errors.length === 0,

errors,

count:

  dependencies.length

};

}

// ─────────────────────────────────────────────
// Check Registered Modules
// ─────────────────────────────────────────────

function checkRegisteredModules(

registeredModules = {}

) {

if (

registeredModules === null ||

typeof registeredModules !==

"object" ||

Array.isArray(

  registeredModules

)

) {

return {

  valid: false,

  missing:

    getRequiredDependencyIds(),

  registered: [],

  required:

    getRequiredDependencyIds(),

  message:

    "Registered modules must be a plain object."

};

}

const requiredDependencies =

getRequiredDependencyIds();

const registeredIds =

Object.keys(

  registeredModules

);

const missing =

requiredDependencies.filter(

  function (dependencyId) {

    return (

      !registeredIds.includes(

        dependencyId

      )

    );

  }

);

return {

valid:

  missing.length === 0,

missing,

registered:

  registeredIds,

required:

  requiredDependencies

};

}

// ─────────────────────────────────────────────
// Check Actual Global Modules
// ─────────────────────────────────────────────

function checkGlobalModules(

globalObject

) {

const target =

globalObject ||

(

  typeof globalThis !==

  "undefined"

    ? globalThis

    : {}

);

const dependencies =

Object.values(

  DEPENDENCY_MAP

);

const missing = [];

const available = [];

dependencies.forEach(

function (dependency) {

  if (

    target[

      dependency.moduleName

    ]

  ) {

    available.push(

      dependency.moduleName

    );

  }

  else if (

    dependency.required === true

  ) {

    missing.push(

      dependency.moduleName

    );

  }

}

);

return {

valid:

  missing.length === 0,

missing,

available,

required:

  getRequiredModuleNames()

};

}

// ─────────────────────────────────────────────
// Dependency Summary
// ─────────────────────────────────────────────

function getDependencySummary() {

const validation =

validateDependencyRegistry();

return {

packageId:

  "package-41-50",

dependencyCount:

  Object.keys(

    DEPENDENCY_MAP

  ).length,

requiredDependencies:

  getRequiredDependencyIds(),

requiredModules:

  getRequiredModuleNames(),

valid:

  validation.valid,

errors:

  validation.errors

};

}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

const dependencyMapAPI = {

DEPENDENCY_MAP,

getDependencies,

getDependency,

getRequiredDependencyIds,

getRequiredModuleNames,

validateDependencyRegistry,

checkRegisteredModules,

checkGlobalModules,

getDependencySummary

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

dependencyMapAPI;

}

// ─────────────────────────────────────────────
// Browser Global
// ─────────────────────────────────────────────

if (

typeof globalThis !==

"undefined"

) {

globalThis.BloggerSaaSDependencyMap =

dependencyMapAPI;

}
