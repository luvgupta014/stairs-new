/**
 * STAIRS Talent Hub - Test Suite Runner
 * 
 * This script provides a comprehensive testing interface for all
 * registration and data validation tests.
 * 
 * Usage:
 *   node tests/run.js              - Run all tests
 *   node tests/run.js --cleanup    - Cleanup test data
 *   node tests/run.js --basic      - Run basic registration test
 *   node tests/run.js --all        - Run all user types registration test
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader(text) {
  log('\n' + '='.repeat(60), 'magenta');
  log(`  ${text}`, 'magenta');
  log('='.repeat(60) + '\n', 'magenta');
}

async function runTest(testName, testPath) {
  log(`\n📋 Running: ${testName}`, 'cyan');
  log('─'.repeat(50) + '\n', 'cyan');
  
  try {
    // Clear the require cache to ensure fresh execution
    delete require.cache[require.resolve(testPath)];
    
    // Import and run the test
    await require(testPath);
    return true;
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    return false;
  }
}

async function runCleanup() {
  log('\n📋 Running: Database Cleanup', 'cyan');
  log('─'.repeat(50) + '\n', 'cyan');
  
  try {
    delete require.cache[require.resolve('./cleanup.js')];
    await require('./cleanup.js');
    return true;
  } catch (error) {
    log(`\n❌ Cleanup failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  printHeader('COMPREHENSIVE TEST SUITE');
  
  const tests = [
    {
      name: 'Basic Registration Test',
      file: './registration-basic.js',
      description: 'Tests individual student registration flow'
    },
    {
      name: 'All User Types Registration Test',
      file: './registration-all-types.js',
      description: 'Tests registration for Student, Coach, Institute, Club'
    }
  ];

  const results = [];
  
  for (const test of tests) {
    log(`\n🔹 ${test.name}`, 'yellow');
    log(`   ${test.description}`, 'yellow');
    
    const testPath = path.join(__dirname, test.file);
    const success = await runTest(test.name, testPath);
    results.push({ name: test.name, success });
  }

  // Print summary
  printHeader('TEST SUMMARY');
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const color = result.success ? 'green' : 'red';
    log(`${result.name}: ${status}`, color);
  });

  const passCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  log(`\n📊 Result: ${passCount}/${totalCount} tests passed`, passCount === totalCount ? 'green' : 'yellow');
  
  if (passCount === totalCount) {
    log('\n🎉 All tests passed successfully!\n', 'green');
  } else {
    log('\n⚠️ Some tests failed. Review the output above.\n', 'yellow');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--all';

  try {
    switch (command) {
      case '--cleanup':
        printHeader('DATABASE CLEANUP');
        await runCleanup();
        break;

      case '--basic':
        printHeader('BASIC REGISTRATION TEST');
        await runTest('Basic Registration', path.join(__dirname, 'registration-basic.js'));
        break;

      case '--all':
        printHeader('ALL USER TYPES REGISTRATION TEST');
        await runTest('All Types Registration', path.join(__dirname, 'registration-all-types.js'));
        break;

      case '--run-all':
        await runAllTests();
        break;

      case '--help':
      case '-h':
        log('\nSTAIRS Talent Hub - Test Suite Runner\n', 'bright');
        log('Available Commands:', 'cyan');
        log('  node tests/run.js              - Run all registration tests');
        log('  node tests/run.js --basic      - Run basic registration test');
        log('  node tests/run.js --all        - Run all user types test');
        log('  node tests/run.js --run-all    - Run complete test suite');
        log('  node tests/run.js --cleanup    - Cleanup test data');
        log('  node tests/run.js --help       - Show this help message\n');
        break;

      default:
        log(`\nUnknown command: ${command}`, 'red');
        log('Use --help for available commands\n', 'yellow');
        process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}\n`, 'red');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}\n`, 'red');
  process.exit(1);
});
