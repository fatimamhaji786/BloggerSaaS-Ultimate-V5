/**

* BloggerSaaS Ultimate V5
* Package 41–50
* Testing Layer
* Test Report
* 
* Formats and summarizes results produced by test-suite.js.
* 
* Safe development only.
* 
* This module:
* - Does not modify production systems.
* - Does not modify live Firebase data.
* - Does not modify user accounts.
* - Does not deploy automatically.
* - Does not delete external data.
    */

(function (global) {

"use strict";

// ─────────────────────────────────────────────
// Report State
// ─────────────────────────────────────────────

const reportState = {

initialized: false,

environment: "safe-development",

generatedAt: null,

sourceReport: null,

summary: {

  total: 0,

  passed: 0,

  failed: 0,

  skipped: 0,

  percentage: 0,

  status: "not-run"

},

categories: {},

failures: [],

warnings: [],

status: "not-generated"

};

// ─────────────────────────────────────────────
// Utility Helpers
// ─────────────────────────────────────────────

function getTestSuite() {

return (

  global.BloggerSaaSTestSuite ||

  null

);

}

function safeNumber(value) {

const number = Number(value);


return Number.isFinite(number)

  ? number

  : 0;

}

function normalizeStatus(status) {

if (

  typeof status !== "string"

) {

  return "unknown";

}


const normalized =

  status

    .trim()

    .toLowerCase();


if (

  normalized === "passed" ||

  normalized === "pass"

) {

  return "passed";

}


if (

  normalized === "failed" ||

  normalized === "fail" ||

  normalized === "error"

) {

  return "failed";

}


if (

  normalized === "skipped" ||

  normalized === "skip"

) {

  return "skipped";

}


if (

  normalized === "pending"

) {

  return "pending";

}


return "unknown";

}

function cloneObject(value) {

if (

  value === null ||

  value === undefined

) {

  return value;

}


if (

  typeof structuredClone ===

  "function"

) {

  try {

    return structuredClone(value);

  }

  catch (error) {

    // Continue to fallback.

  }

}


try {

  return JSON.parse(

    JSON.stringify(value)

  );

}

catch (error) {

  return value;

}

}

// ─────────────────────────────────────────────
// Empty Report
// ─────────────────────────────────────────────

function createEmptyReport() {

return {

  initialized: false,

  environment:

    reportState.environment,

  generatedAt: null,

  sourceReport: null,

  summary: {

    total: 0,

    passed: 0,

    failed: 0,

    skipped: 0,

    percentage: 0,

    status: "not-run"

  },

  categories: {},

  failures: [],

  warnings: [],

  status: "not-generated"

};

}

// ─────────────────────────────────────────────
// Category Summary
// ─────────────────────────────────────────────

function buildCategorySummary(

tests

) {

const categories = {};


if (

  !Array.isArray(tests)

) {

  return categories;

}


tests.forEach(

  function (test) {

    if (

      !test ||

      typeof test !== "object"

    ) {

      return;

    }


    const category =

      typeof test.category ===

      "string" &&

      test.category.trim()

        ? test.category.trim()

        : "general";


    if (

      !categories[category]

    ) {

      categories[category] = {

        total: 0,

        passed: 0,

        failed: 0,

        skipped: 0,

        pending: 0,

        unknown: 0,

        percentage: 0,

        status: "not-run"

      };

    }


    const categoryReport =

      categories[category];


    categoryReport.total++;


    const status =

      normalizeStatus(

        test.status

      );


    if (

      status === "passed"

    ) {

      categoryReport.passed++;

    }

    else if (

      status === "failed"

    ) {

      categoryReport.failed++;

    }

    else if (

      status === "skipped"

    ) {

      categoryReport.skipped++;

    }

    else if (

      status === "pending"

    ) {

      categoryReport.pending++;

    }

    else {

      categoryReport.unknown++;

    }

  }

);


Object.keys(

  categories

).forEach(

  function (category) {

    const report =

      categories[category];


    report.percentage =

      report.total > 0

        ? Math.round(

            (

              report.passed /

              report.total

            ) * 100

          )

        : 0;


    if (

      report.failed > 0 ||

      report.unknown > 0

    ) {

      report.status =

        "failed";

    }

    else if (

      report.pending > 0 ||

      report.skipped > 0

    ) {

      report.status =

        "warning";

    }

    else if (

      report.total > 0 &&

      report.passed ===

        report.total

    ) {

      report.status =

        "passed";

    }

    else {

      report.status =

        "partial";

    }

  }

);


return categories;

}

// ─────────────────────────────────────────────
// Failure Collection
// ─────────────────────────────────────────────

function collectFailures(

tests

) {

if (

  !Array.isArray(tests)

) {

  return [];

}


return tests

  .filter(

    function (test) {

      return (

        test &&

        normalizeStatus(

          test.status

        ) === "failed"

      );

    }

  )

  .map(

    function (test) {

      return {

        name:

          test.name ||

          "Unnamed test",

        category:

          test.category ||

          "general",

        status: "failed",

        message:

          test.message ||

          "Test failed without an error message.",

        startedAt:

          test.startedAt ||

          null,

        completedAt:

          test.completedAt ||

          null

      };

    }

  );

}

// ─────────────────────────────────────────────
// Warning Collection
// ─────────────────────────────────────────────

function collectWarnings(

tests

) {

if (

  !Array.isArray(tests)

) {

  return [];

}


return tests

  .filter(

    function (test) {

      if (!test) {

        return false;

      }


      const status =

        normalizeStatus(

          test.status

        );


      return (

        status === "pending" ||

        status === "skipped" ||

        status === "unknown"

      );

    }

  )

  .map(

    function (test) {

      return {

        name:

          test.name ||

          "Unnamed test",

        category:

          test.category ||

          "general",

        status:

          normalizeStatus(

            test.status

          ),

        message:

          test.message ||

          "Test requires attention."

      };

    }

  );

}

// ─────────────────────────────────────────────
// Determine Overall Status
// ─────────────────────────────────────────────

function determineReportStatus(

total,

passed,

failed,

skipped

) {

if (

  total === 0

) {

  return "not-run";

}


if (

  failed > 0

) {

  return "failed";

}


if (

  passed === total

) {

  return "passed";

}


if (

  passed > 0 &&

  (

    skipped > 0 ||

    passed < total

  )

) {

  return "partial";

}


return "warning";

}

// ─────────────────────────────────────────────
// Generate Report
// ─────────────────────────────────────────────

function generateReport(

sourceReport

) {

const testSuite =

  getTestSuite();


const report =

  sourceReport ||

  (

    testSuite &&

    typeof testSuite.getTestReport ===

    "function"

      ? testSuite.getTestReport()

      : null

  );


if (

  !report ||

  typeof report !== "object"

) {

  return createEmptyReport();

}


const tests =

  Array.isArray(

    report.tests

  )

    ? report.tests

    : [];


const total =

  safeNumber(

    report.total

  ) || tests.length;


const passed =

  safeNumber(

    report.passed

  );


const failed =

  safeNumber(

    report.failed

  );


const skipped =

  safeNumber(

    report.skipped

  );


const percentage =

  total > 0

    ? Math.round(

        (

          passed /

          total

        ) * 100

      )

    : 0;


const status =

  determineReportStatus(

    total,

    passed,

    failed,

    skipped

  );


const categorySummary =

  buildCategorySummary(

    tests

  );


const failures =

  collectFailures(

    tests

  );


const warnings =

  collectWarnings(

    tests

  );


reportState.initialized = true;


reportState.generatedAt =

  new Date().toISOString();


reportState.sourceReport =

  cloneObject(report);


reportState.summary = {

  total,

  passed,

  failed,

  skipped,

  percentage,

  status

};


reportState.categories =

  categorySummary;


reportState.failures =

  failures;


reportState.warnings =

  warnings;


reportState.status =

  status;


return getReport();

}

// ─────────────────────────────────────────────
// Get Complete Report
// ─────────────────────────────────────────────

function getReport() {

return {

  initialized:

    reportState.initialized,

  environment:

    reportState.environment,

  generatedAt:

    reportState.generatedAt,

  sourceReport:

    cloneObject(

      reportState.sourceReport

    ),

  summary:

    Object.assign(

      {},

      reportState.summary

    ),

  categories:

    cloneObject(

      reportState.categories

    ),

  failures:

    cloneObject(

      reportState.failures

    ),

  warnings:

    cloneObject(

      reportState.warnings

    ),

  status:

    reportState.status

};

}

// ─────────────────────────────────────────────
// Get Human-Readable Summary
// ─────────────────────────────────────────────

function getSummaryText() {

const summary =

  reportState.summary;


if (

  reportState.status ===

  "not-generated"

) {

  return (

    "Test report has not been generated."

  );

}


return (

  "Test Suite Status: " +

  summary.status.toUpperCase() +

  " | " +

  "Passed: " +

  summary.passed +

  "/" +

  summary.total +

  " | " +

  "Failed: " +

  summary.failed +

  " | " +

  "Skipped: " +

  summary.skipped +

  " | " +

  "Success Rate: " +

  summary.percentage +

  "%"

);

}

// ─────────────────────────────────────────────
// Get Failed Tests
// ─────────────────────────────────────────────

function getFailures() {

return cloneObject(

  reportState.failures

);

}

// ─────────────────────────────────────────────
// Get Warnings
// ─────────────────────────────────────────────

function getWarnings() {

return cloneObject(

  reportState.warnings

);

}

// ─────────────────────────────────────────────
// Is Test Suite Healthy?
// ─────────────────────────────────────────────

function isHealthy() {

return (

  reportState.status === "passed" &&

  reportState.summary.total > 0 &&

  reportState.summary.failed === 0 &&

  reportState.summary.skipped === 0 &&

  reportState.summary.passed ===

    reportState.summary.total

);

}

// ─────────────────────────────────────────────
// Get Report Status
// ─────────────────────────────────────────────

function getStatus() {

return {

  initialized:

    reportState.initialized,

  environment:

    reportState.environment,

  generatedAt:

    reportState.generatedAt,

  status:

    reportState.status,

  summary:

    Object.assign(

      {},

      reportState.summary

    ),

  failureCount:

    reportState.failures.length,

  warningCount:

    reportState.warnings.length

};

}

// ─────────────────────────────────────────────
// Reset Report
// ─────────────────────────────────────────────

function resetReport() {

reportState.initialized = false;

reportState.generatedAt = null;

reportState.sourceReport = null;

reportState.summary = {

  total: 0,

  passed: 0,

  failed: 0,

  skipped: 0,

  percentage: 0,

  status: "not-run"

};

reportState.categories = {};

reportState.failures = [];

reportState.warnings = [];

reportState.status =

  "not-generated";


return true;

}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

const testReportAPI = {

generateReport,

getReport,

getSummaryText,

getFailures,

getWarnings,

isHealthy,

getStatus,

resetReport,

state: reportState

};

// ─────────────────────────────────────────────
// Browser Global
// ─────────────────────────────────────────────

if (

typeof window !== "undefined"

) {

window.BloggerSaaSTestReport =

  testReportAPI;

}

// ─────────────────────────────────────────────
// Node / Test Export
// ─────────────────────────────────────────────

if (

typeof module !== "undefined" &&

module.exports

) {

module.exports =

  testReportAPI;

}

})(
typeof globalThis !== "undefined"

? globalThis

: this

);
