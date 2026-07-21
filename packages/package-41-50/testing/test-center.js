/**
 * BloggerSaaS Ultimate V5
 * Package 41–50
 * Testing Layer
 * Test Center
 */

(function (global) {

  "use strict";

  const testCenterState = {

    initialized: false,

    running: false,

    environment: "safe-development",

    runCount: 0,

    status: "not-run",

    startedAt: null,

    completedAt: null,

    readiness: {

      ready: false,

      score: 0,

      passedChecks: 0,

      totalChecks: 0,

      status: "not-calculated"

    },

    lastResult: null,

    errors: []

  };

  function getIntegrationTest() {

    return (

      global.BloggerSaaSIntegrationTest ||

      null

    );

  }

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

  function getTestLauncher() {

    return (

      global.BloggerSaaSTestLauncher ||

      null

    );

  }

  function getHealth() {

    return (

      global.BloggerSaaSHealth ||

      null

    );

  }

  function getVerification() {

    return (

      global.BloggerSaaSVerification ||

      null

    );

  }

  function registerModules(modules = {}) {

    if (modules.integrationTest) {

      global.BloggerSaaSIntegrationTest =
        modules.integrationTest;

    }

    if (modules.testSuite) {

      global.BloggerSaaSTestSuite =
        modules.testSuite;

    }

    if (modules.testReport) {

      global.BloggerSaaSTestReport =
        modules.testReport;

    }

    if (modules.testLauncher) {

      global.BloggerSaaSTestLauncher =
        modules.testLauncher;

    }

    if (modules.health) {

      global.BloggerSaaSHealth =
        modules.health;

    }

    if (modules.verification) {

      global.BloggerSaaSVerification =
        modules.verification;

    }

    return getStatus();

  }

  function initialize() {

    testCenterState.initialized =
      true;

    testCenterState.status =
      "initialized";

    return getStatus();

  }

  function runHealthCheck() {

    const health =
      getHealth();

    if (!health) {

      return {

        success:
          false,

        status:
          "unavailable",

        message:
          "Health module is unavailable."

      };

    }

    try {

      if (

        typeof health.runHealthCheck ===
        "function"

      ) {

        const result =
          health.runHealthCheck();

        return {

          success:
            result.status === "HEALTHY",

          status:
            result.status,

          result

        };

      }

      return {

        success:
          false,

        status:
          "unsupported",

        message:
          "No supported health API found."

      };

    }

    catch (error) {

      return {

        success:
          false,

        status:
          "error",

        message:
          error.message

      };

    }

  }

  function runVerification() {

    const verification =
      getVerification();

    if (!verification) {

      return {

        success:
          false,

        status:
          "unavailable",

        message:
          "Verification module is unavailable."

      };

    }

    try {

      if (

        typeof verification.runVerification ===
        "function"

      ) {

        const result =
          verification.runVerification();

        return {

          success:
            result.status === "VERIFIED",

          status:
            result.status,

          result

        };

      }

      return {

        success:
          false,

        status:
          "unsupported",

        message:
          "No supported verification API found."

      };

    }

    catch (error) {

      return {

        success:
          false,

        status:
          "error",

        message:
          error.message

      };

    }

  }

  function runTestSuite() {

    const suite =
      getTestSuite();

    if (!suite) {

      return {

        success:
          false,

        status:
          "unavailable",

        message:
          "Test suite is unavailable."

      };

    }

    try {

      let result = null;

      if (

        typeof suite.runAllTests ===
        "function"

      ) {

        result =
          suite.runAllTests();

      }

      else if (

        typeof suite.runTests ===
        "function"

      ) {

        result =
          suite.runTests();

      }

      else if (

        typeof suite.run ===
        "function"

      ) {

        result =
          suite.run();

      }

      else {

        return {

          success:
            false,

          status:
            "unsupported",

          message:
            "No supported test-suite API found."

        };

      }

      return {

        success:

          result &&
          (

            result.success === true ||

            result.passed === true ||

            result.status === "PASS" ||

            result.status === "PASSED"

          ),

        status:
          result.status || "completed",

        result

      };

    }

    catch (error) {

      return {

        success:
          false,

        status:
          "error",

        message:
          error.message

      };

    }

  }

  function runLauncher() {

    const launcher =
      getTestLauncher();

    if (!launcher) {

      return {

        success:
          false,

        status:
          "unavailable",

        message:
          "Test launcher is unavailable."

      };

    }

    try {

      let result = null;

      if (

        typeof launcher.runAndGetSummary ===
        "function"

      ) {

        result =
          launcher.runAndGetSummary();

      }

      else if (

        typeof launcher.runTestSuite ===
        "function"

      ) {

        result =
          launcher.runTestSuite();

      }

      else {

        return {

          success:
            false,

          status:
            "unsupported",

          message:
            "No supported launcher API found."

        };

      }

      return {

        success:

          result &&
          (

            result.success === true ||

            result.passed === true ||

            result.status === "PASS" ||

            result.status === "PASSED"

          ),

        status:
          result.status || "completed",

        result

      };

    }

    catch (error) {

      return {

        success:
          false,

        status:
          "error",

        message:
          error.message

      };

    }

  }

  function generateReport(results) {

    const report =
      getTestReport();

    if (!report) {

      return {

        success:
          false,

        status:
          "unavailable",

        message:
          "Test report module is unavailable."

      };

    }

    try {

      let generated = null;

      if (

        typeof report.generateReport ===
        "function"

      ) {

        generated =
          report.generateReport(results);

      }

      else if (

        typeof report.createReport ===
        "function"

      ) {

        generated =
          report.createReport(results);

      }

      else if (

        typeof report.buildReport ===
        "function"

      ) {

        generated =
          report.buildReport(results);

      }

      else {

        return {

          success:
            false,

          status:
            "unsupported",

          message:
            "No supported report-generation API found."

        };

      }

      return {

        success:
          true,

        status:
          "generated",

        report:
          generated

      };

    }

    catch (error) {

      return {

        success:
          false,

        status:
          "error",

        message:
          error.message

      };

    }

  }

  function calculateReadiness(results) {

    const checks = [

      results.integration.success,

      results.health.success,

      results.verification.success,

      results.tests.success,

      results.launcher.success,

      results.report.success

    ];

    const passedChecks =
      checks.filter(
        check => check === true
      ).length;

    const totalChecks =
      checks.length;

    const score =

      totalChecks > 0

        ? Math.round(

            (

              passedChecks /
              totalChecks

            ) * 100

          )

        : 0;

    let status =
      "not-ready";

    if (score === 100) {

      status =
        "ready";

    }

    else if (score >= 80) {

      status =
        "conditionally-ready";

    }

    testCenterState.readiness = {

      ready:
        score === 100,

      score,

      passedChecks,

      totalChecks,

      status

    };

    return testCenterState.readiness;

  }

  function run() {

    if (testCenterState.running) {

      return {

        success:
          false,

        status:
          "already-running",

        message:
          "Test Center is already running."

      };

    }

    testCenterState.running =
      true;

    testCenterState.status =
      "running";

    testCenterState.runCount++;

    testCenterState.startedAt =
      new Date().toISOString();

    const results = {

      integration: {
        success: false
      },

      health: {
        success: false
      },

      verification: {
        success: false
      },

      tests: {
        success: false
      },

      launcher: {
        success: false
      },

      report: {
        success: false
      }

    };

    try {

      const integrationTest =
        getIntegrationTest();

      if (

        integrationTest &&

        typeof integrationTest.runIntegrationTest ===
        "function"

      ) {

        const result =
          integrationTest.runIntegrationTest();

        results.integration = {

          success:

            result &&
            (

              result.success === true ||

              result.passed === true ||

              result.status === "PASS" ||

              result.status === "PASSED"

            ),

          status:
            result.status || "completed",

          result

        };

      }

      else {

        results.integration = {

          success:
            false,

          status:
            "unavailable",

          message:
            "Integration test module is unavailable."

        };

      }

      results.health =
        runHealthCheck();

      results.verification =
        runVerification();

      results.tests =
        runTestSuite();

      results.launcher =
        runLauncher();

      results.report =
        generateReport(results);

      const readiness =
        calculateReadiness(results);

      const success =
        readiness.ready;

      testCenterState.status =
        success
          ? "passed"
          : "failed";

      testCenterState.completedAt =
        new Date().toISOString();

      testCenterState.running =
        false;

      const finalResult = {

        success,

        status:
          testCenterState.status,

        environment:
          testCenterState.environment,

        startedAt:
          testCenterState.startedAt,

        completedAt:
          testCenterState.completedAt,

        runCount:
          testCenterState.runCount,

        readiness,

        results

      };

      testCenterState.lastResult =
        finalResult;

      return finalResult;

    }

    catch (error) {

      testCenterState.running =
        false;

      testCenterState.status =
        "error";

      testCenterState.completedAt =
        new Date().toISOString();

      const testCenterError = {

        message:
          error.message,

        timestamp:
          new Date().toISOString()

      };

      testCenterState.errors.push(
        testCenterError
      );

      const finalResult = {

        success:
          false,

        status:
          "error",

        environment:
          testCenterState.environment,

        error:
          testCenterError,

        readiness:
          calculateReadiness(results),

        results

      };

      testCenterState.lastResult =
        finalResult;

      return finalResult;

    }

  }

  function getStatus() {

    return {

      initialized:
        testCenterState.initialized,

      running:
        testCenterState.running,

      environment:
        testCenterState.environment,

      runCount:
        testCenterState.runCount,

      status:
        testCenterState.status,

      startedAt:
        testCenterState.startedAt,

      completedAt:
        testCenterState.completedAt,

      readiness:
        Object.assign(

          {},

          testCenterState.readiness

        ),

      errorCount:
        testCenterState.errors.length,

      hasResult:
        testCenterState.lastResult !== null

    };

  }

  function getLastResult() {

    return testCenterState.lastResult;

  }

  function getErrors() {

    return testCenterState.errors.slice();

  }

  function reset() {

    testCenterState.initialized =
      false;

    testCenterState.running =
      false;

    testCenterState.environment =
      "safe-development";

    testCenterState.runCount =
      0;

    testCenterState.status =
      "not-run";

    testCenterState.startedAt =
      null;

    testCenterState.completedAt =
      null;

    testCenterState.lastResult =
      null;

    testCenterState.errors =
      [];

    testCenterState.readiness = {

      ready:
        false,

      score:
        0,

      passedChecks:
        0,

      totalChecks:
        0,

      status:
        "not-calculated"

    };

    return true;

  }

  const testCenterAPI = {

    initialize,

    registerModules,

    run,

    runAllTests:
      run,

    runHealthCheck,

    runVerification,

    runTestSuite,

    runLauncher,

    generateReport,

    calculateReadiness,

    getStatus,

    getLastResult,

    getErrors,

    reset,

    state:
      testCenterState

  };

  if (typeof window !== "undefined") {

    window.BloggerSaaSTestCenter =
      testCenterAPI;

  }

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {

    module.exports =
      testCenterAPI;

  }

})(

  typeof globalThis !== "undefined"

    ? globalThis

    : this

);
