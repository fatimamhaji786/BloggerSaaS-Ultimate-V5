/**

* BloggerSaaS Ultimate V5
* Package 41–50
* Testing Layer
* Test Launcher
* 
* Coordinates execution of the test suite
* and generation of the final test report.
* 
* Safe development only.
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

// ────────────────────────────────────────────
// Launcher State
// ─────────────────────────────────────────────

const launcherState = {

initialized: false,

environment: "safe-development",

running: false,

runCount: 0,

startedAt: null,

completedAt: null,

status: "not-run",

lastReport: null,

errors: []

};

// ─────────────────────────────────────────────
// Module Discovery
// ─────────────────────────────────────────────

function getTestSuite() {

return (

  global.BloggerSaaSTestSuite ||

  null

);

}

function getTestReport() {

return (

  global.BloggerSaaSTestReport ||

  null

);

}

// ─────────────────────────────────────────────
// Initialize Launcher
// ─────────────────────────────────────────────

function initialize() {

launcherState.initialized = true;

launcherState.status = "initialized";

return getStatus();

}

// ─────────────────────────────────────────────
// Run Test Suite
// ─────────────────────────────────────────────

function runTestSuite() {

const suite = getTestSuite();


if (!suite) {

  return {

    success: false,

    status: "unavailable",

    message:

      "Test Suite module is unavailable.",

    total: 0,

    passed: 0,

    failed: 1,

    skipped: 0,

    percentage: 0

  };

}


if (

  typeof suite.runTests !==

  "function"

) {

  return {

    success: false,

    status: "unsupported",

    message:

      "No supported Test Suite API found.",

    total: 0,

    passed: 0,

    failed: 1,

    skipped: 0,

    percentage: 0

  };

}


try {

  return suite.runTests();

}

catch (error) {

  return {

    success: false,

    status: "error",

    message:

      error && error.message

        ? error.message

        : String(error),

    total: 0,

    passed: 0,

    failed: 1,

    skipped: 0,

    percentage: 0

  };

}

}

// ─────────────────────────────────────────────
// Generate Test Report
// ─────────────────────────────────────────────

function generateReport(

sourceReport

) {

const reportModule =

  getTestReport();


if (!reportModule) {

  return {

    success: true,

    status: "fallback",

    report: {

      summary: {

        total:

          sourceReport &&

          typeof sourceReport.total ===

            "number"

            ? sourceReport.total

            : 0,

        passed:

          sourceReport &&

          typeof sourceReport.passed ===

            "number"

            ? sourceReport.passed

            : 0,

        failed:

          sourceReport &&

          typeof sourceReport.failed ===

            "number"

            ? sourceReport.failed

            : 0,

        skipped:

          sourceReport &&

          typeof sourceReport.skipped ===

            "number"

            ? sourceReport.skipped

            : 0,

        percentage:

          sourceReport &&

          typeof sourceReport.percentage ===

            "number"

            ? sourceReport.percentage

            : 0,

        status:

          sourceReport &&

          sourceReport.status

            ? sourceReport.status

            : "not-run"

      },

      source:

        sourceReport || null

    }

  };

}


if (

  typeof reportModule.generateReport !==

  "function"

) {

  return {

    success: false,

    status: "unsupported",

    message:

      "No supported Test Report API found."

  };

}


try {

  return {

    success: true,

    status: "completed",

    report:

      reportModule.generateReport(

        sourceReport

      )

  };

}

catch (error) {

  return {

    success: false,

    status: "error",

    message:

      error && error.message

        ? error.message

        : String(error)

  };

}

}

// ─────────────────────────────────────────────
// Determine Test Success
// ─────────────────────────────────────────────

function didTestsPass(

testResult

) {

if (!testResult) {

  return false;

}


if (

  testResult.success === true

) {

  return true;

}


const status =

  String(

    testResult.status ||

    ""

  ).toLowerCase();


return (

  status === "passed" ||

  status === "pass"

);

}

// ─────────────────────────────────────────────
// Determine Report Success
// ─────────────────────────────────────────────

function didReportGenerate(

reportResult

) {

return (

  reportResult &&

  reportResult.success === true

);

}

// ─────────────────────────────────────────────
// Run Tests and Generate Report
// ─────────────────────────────────────────────

function runAndGetSummary() {

if (

  launcherState.running

) {

  return {

    success: false,

    status: "already-running",

    message:

      "Test Launcher is already running.",

    environment:

      launcherState.environment

  };

}


launcherState.running = true;

launcherState.initialized = true;

launcherState.status = "running";

launcherState.runCount++;

launcherState.startedAt =

  new Date().toISOString();


try {

  // 1. Execute complete test suite.

  const testResult =

    runTestSuite();


  // 2. Generate structured report.

  const reportResult =

    generateReport(

      testResult

    );


  // 3. Determine execution status.

  const testsPassed =

    didTestsPass(

      testResult

    );


  // 4. Determine report status.

  const reportGenerated =

    didReportGenerate(

      reportResult

    );


  // 5. Extract generated report.

  const reportData =

    reportResult &&

    reportResult.report

      ? reportResult.report

      : null;


  // 6. Normalize summary.

  const summary =

    reportData &&

    reportData.summary

      ? reportData.summary

      : {

          total:

            testResult &&

            typeof testResult.total ===

              "number"

              ? testResult.total

              : 0,

          passed:

            testResult &&

            typeof testResult.passed ===

              "number"

              ? testResult.passed

              : 0,

          failed:

            testResult &&

            typeof testResult.failed ===

              "number"

              ? testResult.failed

              : 0,

          skipped:

            testResult &&

            typeof testResult.skipped ===

              "number"

              ? testResult.skipped

              : 0,

          percentage:

            testResult &&

            typeof testResult.percentage ===

              "number"

              ? testResult.percentage

              : 0,

          status:

            testResult &&

            testResult.status

              ? testResult.status

              : "not-run"

        };


  // 7. Final success.

  const success =

    testsPassed &&

    reportGenerated;


  launcherState.status =

    success

      ? "passed"

      : "failed";


  launcherState.completedAt =

    new Date().toISOString();


  launcherState.running = false;


  // 8. Consolidated final result.

  const finalResult = {

    success,

    status:

      launcherState.status,

    environment:

      launcherState.environment,

    runCount:

      launcherState.runCount,

    startedAt:

      launcherState.startedAt,

    completedAt:

      launcherState.completedAt,

    tests:

      testResult,

    report:

      reportResult,

    summary

  };


  launcherState.lastReport =

    finalResult;


  return finalResult;

}


catch (error) {

  launcherState.running = false;

  launcherState.status = "error";

  launcherState.completedAt =

    new Date().toISOString();


  const errorRecord = {

    message:

      error &&

      error.message

        ? error.message

        : String(error),

    timestamp:

      new Date().toISOString()

  };


  launcherState.errors.push(

    errorRecord

  );


  const finalResult = {

    success: false,

    status: "error",

    environment:

      launcherState.environment,

    runCount:

      launcherState.runCount,

    startedAt:

      launcherState.startedAt,

    completedAt:

      launcherState.completedAt,

    error:

      errorRecord

  };


  launcherState.lastReport =

    finalResult;


  return finalResult;

}

}

// ─────────────────────────────────────────────
// Compatibility Aliases
// ─────────────────────────────────────────────

function run() {

return runAndGetSummary();

}

function runAllTests() {

return runAndGetSummary();

}

function runTestSuiteAndReport() {

return runAndGetSummary();

}

// ─────────────────────────────────────────────
// Get Status
// ─────────────────────────────────────────────

function getStatus() {

return {

  initialized:

    launcherState.initialized,

  running:

    launcherState.running,

  environment:

    launcherState.environment,

  runCount:

    launcherState.runCount,

  startedAt:

    launcherState.startedAt,

  completedAt:

    launcherState.completedAt,

  status:

    launcherState.status,

  errorCount:

    launcherState.errors.length,

  hasResult:

    launcherState.lastReport !== null

};

}

// ─────────────────────────────────────────────
// Get Last Result
// ─────────────────────────────────────────────

function getLastResult() {

return launcherState.lastReport;

}

// ─────────────────────────────────────────────
// Get Errors
// ─────────────────────────────────────────────

function getErrors() {

return [

  ...launcherState.errors

];

}

// ─────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────

function reset() {

launcherState.initialized = false;

launcherState.running = false;

launcherState.runCount = 0;

launcherState.startedAt = null;

launcherState.completedAt = null;

launcherState.status = "not-run";

launcherState.lastReport = null;

launcherState.errors = [];

return true;

}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

const testLauncherAPI = {

initialize,

run,

runAllTests,

runTestSuite,

generateReport,

runAndGetSummary,

runTestSuiteAndReport,

getStatus,

getLastResult,

getErrors,

reset,

state:

  launcherState

};

// ─────────────────────────────────────────────
// Browser Global
// ─────────────────────────────────────────────

global.BloggerSaaSTestLauncher =

testLauncherAPI;

// ─────────────────────────────────────────────
// Node / Test Export
// ─────────────────────────────────────────────

if (

typeof module !== "undefined" &&

module.exports

) {

module.exports =

  testLauncherAPI;

}

})(
typeof globalThis !== "undefined"

? globalThis

: this

);
