/**

BloggerSaaS Ultimate V5 Package 41–50 Testing Layer Test Launcher Coordinates: test-suite.js test-report.js Safe development only. This module: Does not modify production systems. Does not modify live Firebase data. Does not modify user accounts. Does not deploy automatically. Does not delete external data. */ 

(function (global) {

"use strict";

// ───────────────────────────────────────────── // Launcher State // ─────────────────────────────────────────────

const launcherState = {

initialized: false, environment: "safe-development", running: false, lastRunAt: null, lastCompletedAt: null, runCount: 0, status: "not-run", lastReport: null, errors: [] 

};

// ───────────────────────────────────────────── // Module Discovery // ─────────────────────────────────────────────

function getTestSuite() {

return ( global.BloggerSaaSTestSuite || null ); 

}

function getTestReport() {

return ( global.BloggerSaaSTestReport || null ); 

}

// ───────────────────────────────────────────── // Validate Dependencies // ─────────────────────────────────────────────

function validateDependencies() {

const dependencies = { testSuite: getTestSuite(), testReport: getTestReport() }; const missing = []; if ( !dependencies.testSuite ) { missing.push( "BloggerSaaSTestSuite" ); } if ( !dependencies.testReport ) { missing.push( "BloggerSaaSTestReport" ); } return { valid: missing.length === 0, dependencies, missing }; 

}

// ───────────────────────────────────────────── // Initialize Launcher // ─────────────────────────────────────────────

function initializeLauncher() {

if ( launcherState.initialized ) { return getLauncherStatus(); } launcherState.initialized = true; launcherState.status = "ready"; return getLauncherStatus(); 

}

// ───────────────────────────────────────────── // Run Test Suite // ─────────────────────────────────────────────

function runTestSuite() {

if ( launcherState.running ) { return { success: false, status: "already-running", message: "Test suite is already running.", report: launcherState.lastReport }; } const dependencyCheck = validateDependencies(); if ( !dependencyCheck.valid ) { launcherState.status = "dependency-error"; const error = { type: "DEPENDENCY_ERROR", message: "Required testing modules are missing.", missing: dependencyCheck.missing, timestamp: new Date().toISOString() }; launcherState.errors.push( error ); return { success: false, status: launcherState.status, error }; } launcherState.running = true; launcherState.status = "running"; launcherState.lastRunAt = new Date().toISOString(); launcherState.runCount++; try { const testSuite = dependencyCheck .dependencies .testSuite; const testReport = dependencyCheck .dependencies .testReport; if ( typeof testSuite.runTests !== "function" ) { throw new Error( "Test suite does not expose runTests()." ); } if ( typeof testReport.generateReport !== "function" ) { throw new Error( "Test report does not expose generateReport()." ); } // Run all registered tests. const rawReport = testSuite.runTests(); // Generate normalized report. const finalReport = testReport.generateReport( rawReport ); launcherState.lastReport = finalReport; launcherState.status = finalReport.status; launcherState.lastCompletedAt = new Date().toISOString(); launcherState.running = false; return { success: finalReport.status === "passed", status: finalReport.status, report: finalReport }; } catch (error) { launcherState.running = false; launcherState.status = "error"; launcherState.lastCompletedAt = new Date().toISOString(); const launcherError = { type: "TEST_LAUNCH_ERROR", message: error.message, timestamp: new Date().toISOString() }; launcherState.errors.push( launcherError ); return { success: false, status: launcherState.status, error: launcherError }; } 

}

// ───────────────────────────────────────────── // Run Tests and Return Summary // ─────────────────────────────────────────────

function runAndGetSummary() {

const result = runTestSuite(); if ( !result.success && !result.report ) { return result; } const report = result.report; return { success: result.success, status: result.status, summary: report.summary || null, categories: report.categories || {}, failures: report.failures || [], warnings: report.warnings || [], report }; 

}

// ───────────────────────────────────────────── // Get Last Report // ─────────────────────────────────────────────

function getLastReport() {

return ( launcherState.lastReport ); 

}

// ───────────────────────────────────────────── // Get Launcher Status // ─────────────────────────────────────────────

function getLauncherStatus() {

return { initialized: launcherState.initialized, environment: launcherState.environment, running: launcherState.running, lastRunAt: launcherState.lastRunAt, lastCompletedAt: launcherState.lastCompletedAt, runCount: launcherState.runCount, status: launcherState.status, hasReport: launcherState.lastReport !== null, errorCount: launcherState.errors.length }; 

}

// ───────────────────────────────────────────── // Get Launcher Errors // ─────────────────────────────────────────────

function getErrors() {

return launcherState.errors.slice(); 

}

// ───────────────────────────────────────────── // Reset Launcher // ─────────────────────────────────────────────

function resetLauncher() {

launcherState.initialized = false; launcherState.running = false; launcherState.lastRunAt = null; launcherState.lastCompletedAt = null; launcherState.runCount = 0; launcherState.status = "not-run"; launcherState.lastReport = null; launcherState.errors = []; return true; 

}

// ───────────────────────────────────────────── // Public API // ─────────────────────────────────────────────

const testLauncherAPI = {

initializeLauncher, validateDependencies, runTestSuite, runAndGetSummary, getLastReport, getLauncherStatus, getErrors, resetLauncher, state: launcherState 

};

// ───────────────────────────────────────────── // Browser Global // ─────────────────────────────────────────────

if (

typeof window !== "undefined" 

) {

window.BloggerSaaSTestLauncher = testLauncherAPI; 

}

// ───────────────────────────────────────────── // Node / Test Export // ─────────────────────────────────────────────

if (

typeof module !== "undefined" && module.exports 

) {

module.exports = testLauncherAPI; 

}

})(

typeof globalThis !== "undefined"

? globalThis : this 

);

