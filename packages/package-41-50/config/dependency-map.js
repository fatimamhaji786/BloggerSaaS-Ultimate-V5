/**

* BloggerSaaS Ultimate V5
* Package 41–50
* Dependency Map
* 
* Defines and validates the dependencies required by the package.
* 
* This module performs validation only.
* It does not install, modify, or delete dependencies.
  */

"use strict";

// ─────────────────────────────────────────────
// Dependency Definitions
// ─────────────────────────────────────────────

const DEPENDENCY_MAP = Object.freeze({

firebase: {

id: "firebase",

name: "Firebase",

required: true,

type: "external",

purpose:
  "Firebase initialization and service bridge."

},

eventBus: {

id: "event-bus",

name: "Event Bus",

required: true,

type: "internal",

purpose:
  "Internal module event communication."

},

moduleRegistry: {

id: "module-registry",

name: "Module Registry",

required: true,

type: "internal",

purpose:
  "Core module registration and retrieval."

},

healthMonitor: {

id: "health-monitor",

name: "Health Monitor",

required: true,

type: "internal",

purpose:
  "Package health monitoring."

},

verificationLayer: {

id: "verification-layer",

name: "Verification Layer",

required: true,

type: "internal",

purpose:
  "Package verification and safety checks."

},

testCenter: {

id: "test-center",

name: "Test Center",

required: true,

type: "internal",

purpose:
  "Diagnostic and test orchestration."

}

});

// ─────────────────────────────────────────────
// Get Dependencies
// ─────────────────────────────────────────────

function getDependencies() {

return DEPENDENCY_MAP;

}

// ─────────────────────────────────────────────
// Get Required Dependency IDs
// ─────────────────────────────────────────────

function getRequiredDependencyIds() {

return Object.values(DEPENDENCY_MAP)

.filter(dependency =>

  dependency.required === true

)

.map(dependency =>

  dependency.id

);

}

// ─────────────────────────────────────────────
// Validate Dependency Registry
// ─────────────────────────────────────────────

function validateDependencyRegistry() {

const errors = [];

const dependencies =

Object.values(DEPENDENCY_MAP);

dependencies.forEach(dependency => {

if (!dependency.id) {

  errors.push(

    "Dependency ID is missing."

  );

}


if (!dependency.name) {

  errors.push(

    `Dependency name is missing for ${dependency.id}.`

  );

}


if (!dependency.type) {

  errors.push(

    `Dependency type is missing for ${dependency.id}.`

  );

}

});

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

const requiredDependencies =

getRequiredDependencyIds();

const registeredIds =

Object.keys(registeredModules);

const missing =

requiredDependencies.filter(

  dependencyId =>

    !registeredIds.includes(

      dependencyId

    )

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
// Dependency Summary
// ─────────────────────────────────────────────

function getDependencySummary() {

const validation =

validateDependencyRegistry();

return {

packageId:

  "package-41-50",

dependencyCount:

  Object.keys(DEPENDENCY_MAP).length,

requiredDependencies:

  getRequiredDependencyIds(),

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

getRequiredDependencyIds,

validateDependencyRegistry,

checkRegisteredModules,

getDependencySummary

};

// ─────────────────────────────────────────────
// Node / Test Export
// ─────────────────────────────────────────────

if (

typeof module !== "undefined" &&

module.exports

) {

module.exports =

dependencyMapAPI;

}

// ─────────────────────────────────────────────
// Browser Global
// ─────────────────────────────────────────────

if (

typeof window !== "undefined"

) {

window.BloggerSaaSDependencyMap =

dependencyMapAPI;

}
