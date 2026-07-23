/**
 * BloggerSaaS Ultimate V5
 * Package 41–50
 * Testing Layer
 * Integration Test
 *
 * Coordinates the complete safe-development verification flow.
 *
 * Flow:
 * 1. Initialize Test Center
 * 2. Run Test Suite
 * 3. Generate Test Report
 * 4. Run Final Layer
 * 5. Return consolidated integration result
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
  // Integration Test State
  // ─────────────────────────────────────────────

  const integrationState = {

    initialized: false,

    running: false,

    environment:
      "safe-development",

    runCount: 0,

    startedAt: null,

    completedAt: null,

    status:
      "not-run",

    lastResult: null,

    errors: []

  };


  // ─────────────────────────────────────────────
  // Module Discovery
  // ─────────────────────────────────────────────

  function getTestCenter() {

    return (

      global.BloggerSaaSTestCenter ||

      null

    );

  }


  function getTestLauncher() {

    return (

      global.BloggerSaaSTestLauncher ||

      null

    );

  }


  function getTestReport() {

    return (

      global.BloggerSaaSTestReport ||

      null

    );

  }


  function getFinalLayer() {

    return (

      global.BloggerSaaSFinal ||

      null

    );

  }


  // ─────────────────────────────────────────────
  // Safe Error Message
  // ─────────────────────────────────────────────

  function getErrorMessage(error) {

    if (

      error &&

      typeof error.message ===

        "string"

    ) {

      return error.message;

    }


    return String(error);

  }


  // ─────────────────────────────────────────────
  // Normalize Status
  // ─────────────────────────────────────────────

  function normalizeStatus(status) {

    return (

      typeof status ===

        "string"

        ? status.trim().toLowerCase()

        : ""

    );

  }


  // ─────────────────────────────────────────────
  // Determine Success
  // ─────────────────────────────────────────────

  function isSuccessful(result) {

    if (!result) {

      return false;

    }


    if (

      result.success === true

    ) {

      return true;

    }


    const status =

      normalizeStatus(

        result.status

      );


    return (

      status === "passed" ||

      status === "pass" ||

      status === "healthy" ||

      status === "verified" ||

      status === "ready" ||

      status === "completed"

    );

  }


  // ─────────────────────────────────────────────
  // Initialize Integration Test
  // ─────────────────────────────────────────────

  function initialize() {

    integrationState.initialized = true;

    integrationState.status =

      "initialized";


    return getStatus();

  }


  // ─────────────────────────────────────────────
  // Run Test Center
  // ─────────────────────────────────────────────

  function runTestCenter() {

    const testCenter =

      getTestCenter();


    if (!testCenter) {

      return {

        success: false,

        status:
          "unavailable",

        message:
          "Test Center module is unavailable."

      };

    }


    try {

      if (

        typeof testCenter.run !==

          "function"

      ) {

        return {

          success: false,

          status:
            "unsupported",

          message:
            "No supported Test Center API found."

        };

      }


      const result =

        testCenter.run();


      return {

        success:

          isSuccessful(

            result

          ),

        status:

          isSuccessful(

            result

          )

            ? "passed"

            : "failed",

        result

      };

    }

    catch (error) {

      return {

        success: false,

        status:
          "error",

        message:

          getErrorMessage(

            error

          )

      };

    }

  }


  // ─────────────────────────────────────────────
  // Run Test Launcher
  // ─────────────────────────────────────────────

  function runTestLauncher() {

    const launcher =

      getTestLauncher();


    if (!launcher) {

      return {

        success: false,

        status:
          "unavailable",

        message:
          "Test Launcher module is unavailable."

      };

    }


    try {

      if (

        typeof launcher.runAndGetSummary ===

          "function"

      ) {

        const result =

          launcher.runAndGetSummary();


        return {

          success:

            isSuccessful(

              result

            ),

          status:

            isSuccessful(

              result

                )

              ? "passed"

              : "failed",

          result

        };

      }


      if (

        typeof launcher.run ===

          "function"

      ) {

        const result =

          launcher.run();


        return {

          success:

            isSuccessful(

              result

            ),

          status:

            isSuccessful(

              result

            )

              ? "passed"

              : "failed",

          result

        };

      }


      return {

        success: false,

        status:
          "unsupported",

        message:
          "No supported Test Launcher API found."

      };

    }

    catch (error) {

      return {

        success: false,

        status:
          "error",

        message:

          getErrorMessage(

            error

          )

      };

    }

  }


  // ─────────────────────────────────────────────
  // Generate Report
  // ─────────────────────────────────────────────

  function generateReport(

    sourceResult

  ) {

    const report =

      getTestReport();


    if (!report) {

      return {

        success: false,

        status:
          "unavailable",

        message:
          "Test Report module is unavailable."

      };

    }


    try {

      if (

        typeof report.generateReport !==

          "function"

      ) {

        return {

          success: false,

          status:
            "unsupported",

          message:
            "No supported Test Report API found."

        };

      }


      const sourceReport =

        sourceResult &&

        sourceResult.result

          ? sourceResult.result

          : sourceResult;


      const result =

        report.generateReport(

          sourceReport

        );


      return {

        success: true,

        status:
          "completed",

        result

      };

    }

    catch (error) {

      return {

        success: false,

        status:
          "error",

        message:

          getErrorMessage(

            error

          )

      };

    }

  }


  // ─────────────────────────────────────────────
  // Run Final Layer
  // ─────────────────────────────────────────────

  function runFinalLayer() {

    const finalLayer =

      getFinalLayer();


    if (!finalLayer) {

      return {

        success: false,

        status:
          "unavailable",

        message:
          "Final Layer module is unavailable."

      };

    }


    try {

      if (

        typeof finalLayer.startFinalLayer !==

          "function"

      ) {

        return {

          success: false,

          status:
            "unsupported",

          message:
            "No supported Final Layer API found."

        };

      }


      const result =

        finalLayer.startFinalLayer();


      return {

        success:

          isSuccessful(

            result

          ),

        status:

          isSuccessful(

            result

          )

            ? "passed"

            : "failed",

        result

      };

    }

    catch (error) {

      return {

        success: false,

        status:
          "error",

        message:

          getErrorMessage(

            error

          )

      };

    }

  }


  // ─────────────────────────────────────────────
  // Calculate Integration Readiness
  // ─────────────────────────────────────────────

  function calculateReadiness(

    results

  ) {

    const checks = [

      {

        name:
          "Test Center",

        passed:

          !!(

            results &&

            results.testCenter &&

            results.testCenter.success === true

          )

      },

      {

        name:
          "Test Launcher",

        passed:

          !!(

            results &&

            results.launcher &&

            results.launcher.success === true

          )

      },

      {

        name:
          "Test Report",

        passed:

          !!(

            results &&

            results.report &&

            results.report.success === true

          )

      },

      {

        name:
          "Final Layer",

        passed:

          !!(

            results &&

            results.final &&

            results.final.success === true

          )

      }

    ];


    const passedChecks =

      checks.filter(

        function (check) {

          return (

            check.passed === true

          );

        }

      ).length;


    const totalChecks =

      checks.length;


    const score =

      totalChecks > 0

        ? Math.round(

            (

              passedChecks /

              totalChecks

            ) *

            100

          )

        : 0;


    let status =

      "not-ready";


    if (

      score === 100

    ) {

      status =

        "ready";

    }

    else if (

      score >= 75

    ) {

      status =

        "conditionally-ready";

    }


    return {

      ready:

        score === 100,

      score,

      status,

      passedChecks,

      totalChecks,

      checks

    };

  }


  // ─────────────────────────────────────────────
  // Run Complete Integration Test
  // ─────────────────────────────────────────────

  function runIntegrationTest() {

    if (

      integrationState.running

    ) {

      return {

        success: false,

        status:
          "already-running",

        message:
          "Integration Test is already running."

      };

    }


    integrationState.initialized = true;

    integrationState.running = true;

    integrationState.status =

      "running";

    integrationState.runCount++;


    integrationState.startedAt =

      new Date().toISOString();


    const results = {

      testCenter: {

        success: false,

        status:
          "not-run"

      },

      launcher: {

        success: false,

        status:
          "not-run"

      },

      report: {

        success: false,

        status:
          "not-run"

      },

      final: {

        success: false,

        status:
          "not-run"

      }

    };


    try {


      // 1. Test Center

      results.testCenter =

        runTestCenter();


      // 2. Test Launcher

      results.launcher =

        runTestLauncher();


      // 3. Test Report

      results.report =

        generateReport(

          results.launcher

        );


      // 4. Final Layer

      results.final =

        runFinalLayer();


      // 5. Calculate Readiness

      const readiness =

        calculateReadiness(

          results

        );


      const success =

        readiness.ready;


      integrationState.status =

        success

          ? "passed"

          : "failed";


      integrationState.completedAt =

        new Date().toISOString();


      integrationState.running =

        false;


      const finalResult = {

        success,

        status:

          integrationState.status,

        environment:

          integrationState.environment,

        runCount:

          integrationState.runCount,

        startedAt:

          integrationState.startedAt,

        completedAt:

          integrationState.completedAt,

        readiness,

        results

      };


      integrationState.lastResult =

        finalResult;


      return finalResult;

    }


    catch (error) {

      integrationState.running =

        false;

      integrationState.status =

        "error";


      integrationState.completedAt =

        new Date().toISOString();


      const errorRecord = {

        message:

          getErrorMessage(

            error

          ),

        timestamp:

          new Date().toISOString()

      };


      integrationState.errors.push(

        errorRecord

      );


      const readiness =

        calculateReadiness(

          results

        );


      const finalResult = {

        success: false,

        status:
          "error",

        environment:

          integrationState.environment,

        error:

          errorRecord,

        readiness,

        results

      };


      integrationState.lastResult =

        finalResult;


      return finalResult;

    }

  }


  // ─────────────────────────────────────────────
  // Compatibility Aliases
  // ─────────────────────────────────────────────

  function run() {

    return runIntegrationTest();

  }


  function execute() {

    return runIntegrationTest();

  }


  function runAllTests() {

    return runIntegrationTest();

  }


  // ─────────────────────────────────────────────
  // Get Status
  // ─────────────────────────────────────────────

  function getStatus() {

    return {

      initialized:

        integrationState.initialized,

      running:

        integrationState.running,

      environment:

        integrationState.environment,

      runCount:

        integrationState.runCount,

      startedAt:

        integrationState.startedAt,

      completedAt:

        integrationState.completedAt,

      status:

        integrationState.status,

      errorCount:

        integrationState.errors.length,

      hasResult:

        integrationState.lastResult !== null

    };

  }


  // ─────────────────────────────────────────────
  // Get Last Result
  // ─────────────────────────────────────────────

  function getLastResult() {

    return (

      integrationState.lastResult

    );

  }


  // ─────────────────────────────────────────────
  // Get Errors
  // ─────────────────────────────────────────────

  function getErrors() {

    return [

      ...integrationState.errors

    ];

  }


  // ─────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────

  function reset() {

    integrationState.initialized = false;

    integrationState.running = false;

    integrationState.runCount = 0;

    integrationState.startedAt = null;

    integrationState.completedAt = null;

    integrationState.status =

      "not-run";

    integrationState.lastResult =

      null;

    integrationState.errors = [];


    return true;

  }


  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  const integrationTestAPI = {

    initialize,

    run,

    execute,

    runAllTests,

    runIntegrationTest,

    runTestCenter,

    runTestLauncher,

    generateReport,

    runFinalLayer,

    calculateReadiness,

    getStatus,

    getLastResult,

    getErrors,

    reset,

    state:

      integrationState

  };


  // ─────────────────────────────────────────────
  // Browser Global
  // ─────────────────────────────────────────────

  global.BloggerSaaSIntegrationTest =

    integrationTestAPI;


  // ─────────────────────────────────────────────
  // Node / Test Export
  // ─────────────────────────────────────────────

  if (

    typeof module !==

      "undefined" &&

    module.exports

  ) {

    module.exports =

      integrationTestAPI;

  }


})(
  typeof globalThis !==

    "undefined"

    ? globalThis

    : this

);
