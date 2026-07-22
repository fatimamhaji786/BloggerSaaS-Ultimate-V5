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

          "Test Suite module is unavailable."

      };

    }


    try {

      if (

        typeof suite.runTests ===

        "function"

      ) {

        return suite.runTests();

      }


      return {

        success: false,

        status: "unsupported",

        message:

          "No supported Test Suite API found."

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
  // Generate Test Report
  // ─────────────────────────────────────────────

  function generateReport(

  sourceReport

) {

  const reportModule =

    getTestReport();


  if (

    !reportModule

  ) {

    return {

      success: true,

      status: "fallback",

      report: {

        summary: {

          total:

            sourceReport &&

            sourceReport.total

              ? sourceReport.total

              : 0,

          passed:

            sourceReport &&

            sourceReport.passed

              ? sourceReport.passed

              : 0,

          failed:

            sourceReport &&

            sourceReport.failed

              ? sourceReport.failed

              : 0,

          skipped:

            sourceReport &&

            sourceReport.skipped

              ? sourceReport.skipped

              : 0,

          percentage:

            sourceReport &&

            sourceReport.percentage

              ? sourceReport.percentage

              : 0,

          status:

            sourceReport &&

            sourceReport.status

              ? sourceReport.status

              : "not-run"

        },

        source:

          sourceReport

      }

    };

  }


  try {

    if (

      typeof reportModule.generateReport ===

      "function"

    ) {

      return {

        success: true,

        status: "completed",

        report:

          reportModule.generateReport(

            sourceReport

          )

      };

    }


    return {

      success: false,

      status: "unsupported",

      message:

        "No supported Test Report API found."

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

        "Test Launcher is already running."

    };

  }


  launcherState.running = true;

  launcherState.initialized = true;

  launcherState.status = "running";

  launcherState.runCount++;

  launcherState.startedAt =

    new Date().toISOString();


  try {

    // 1. Run the complete test suite.

    const testResult =

      runTestSuite();


    // 2. Generate a structured report.

    const reportResult =

      generateReport(

        testResult

      );


    // 3. Determine whether tests passed.

    const testsPassed =

      testResult &&

      (

        testResult.status ===

          "passed" ||

        testResult.status ===

          "PASS" ||

        testResult.status ===

          "PASSED" ||

        testResult.success ===

          true

      );


    // 4. Determine whether report generation passed.

    const reportPassed =

      reportResult &&

      reportResult.success ===

        true;


    // 5. Extract report data.

    const reportData =

      reportResult &&

      reportResult.report

        ? reportResult.report

        : null;


    // 6. Create normalized summary.

    const summary =

      reportData &&

      reportData.summary

        ? reportData.summary

        : {

            total:

              testResult &&

              testResult.total

                ? testResult.total

                : 0,

            passed:

              testResult &&

              testResult.passed

                ? testResult.passed

                : 0,

            failed:

              testResult &&

              testResult.failed

                ? testResult.failed

                : 0,

            skipped:

              testResult &&

              testResult.skipped

                ? testResult.skipped

                : 0,

            percentage:

              testResult &&

              testResult.percentage

                ? testResult.percentage

                : 0,

            status:

              testResult &&

              testResult.status

                ? testResult.status

                : "not-run"

          };


    // 7. Final success result.

    const success =

      testsPassed &&

      reportPassed;


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

    launcherState.status =

      "error";

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
