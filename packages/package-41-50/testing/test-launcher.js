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


    const reportModule =

      getTestReport();


    if (

      reportModule &&

      typeof reportModule.getReport ===

        "function"

    ) {

      return {

        success: true,

        status: "initialized",

        launcher: getStatus(),

        report:

          reportModule.getReport()

      };

    }


    return getStatus();

  }


  // ─────────────────────────────────────────────
  // Normalize Numeric Value
  // ─────────────────────────────────────────────

  function safeNumber(value) {

    return (

      typeof value === "number" &&

      Number.isFinite(value)

    )

      ? value

      : 0;

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


    if (

      status === "passed" ||

      status === "pass"

    ) {

      return true;

    }


    const total =

      safeNumber(

        testResult.total

      );


    const passed =

      safeNumber(

        testResult.passed

      );


    const failed =

      safeNumber(

        testResult.failed

      );


    return (

      total > 0 &&

      failed === 0 &&

      passed === total

    );

  }


  // ─────────────────────────────────────────────
  // Run Test Suite
  // ─────────────────────────────────────────────

  function runTestSuite() {

    const suite =

      getTestSuite();


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

      const result =

        suite.runTests();


      return (

        result &&

        typeof result === "object"

          ? result

          : {

              success: false,

              status: "invalid-result",

              message:

                "Test Suite returned an invalid result.",

              total: 0,

              passed: 0,

              failed: 1,

              skipped: 0,

              percentage: 0

            }

      );

    }


    catch (error) {

      return {

        success: false,

        status: "error",

        message:

          error &&

          error.message

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

      const generatedReport =

        reportModule.generateReport(

          sourceReport

        );


      return {

        success: true,

        status: "completed",

        report:

          generatedReport

      };

    }


    catch (error) {

      return {

        success: false,

        status: "error",

        message:

          error &&

          error.message

            ? error.message

            : String(error)

      };

    }

  }


  // ─────────────────────────────────────────────
  // Normalize Summary
  // ─────────────────────────────────────────────

  function normalizeSummary(

    testResult,

    reportResult

  ) {

    const reportData =

      reportResult &&

      reportResult.report

        ? reportResult.report

        : null;


    if (

      reportData &&

      reportData.summary

    ) {

      return {

        total:

          safeNumber(

            reportData.summary.total

          ),

        passed:

          safeNumber(

            reportData.summary.passed

          ),

        failed:

          safeNumber(

            reportData.summary.failed

          ),

        skipped:

          safeNumber(

            reportData.summary.skipped

          ),

        percentage:

          safeNumber(

            reportData.summary.percentage

          ),

        status:

          reportData.summary.status ||

          "not-run"

      };

    }


    const total =

      safeNumber(

        testResult &&

        testResult.total

      );


    const passed =

      safeNumber(

        testResult &&

        testResult.passed

      );


    const failed =

      safeNumber(

        testResult &&

        testResult.failed

      );


    const skipped =

      safeNumber(

        testResult &&

        testResult.skipped

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


    return {

      total,

      passed,

      failed,

      skipped,

      percentage,

      status:

        testResult &&

        testResult.status

          ? testResult.status

          : "not-run"

    };

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


      // 3. Determine test status.

      const testsPassed =

        didTestsPass(

          testResult

        );


      // 4. Determine report status.

      const reportGenerated =

        reportResult &&

        reportResult.success === true;


      // 5. Normalize summary.

      const summary =

        normalizeSummary(

          testResult,

          reportResult

        );


      // 6. Final success.

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


      // 7. Consolidated final result.

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

    return (

      launcherState.lastReport

    );

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

    typeof module !==

      "undefined" &&

    module.exports

  ) {

    module.exports =

      testLauncherAPI;

  }


})(
  typeof globalThis !==

    "undefined"

    ? globalThis

    : this

);
