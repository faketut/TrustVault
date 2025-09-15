/**
 * Test Runner - Execute All Tests
 * 
 * Runs all test files in the test directory with proper organization
 * and reporting.
 * 
 * Usage: node test/run-all-tests.js
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  {
    name: 'Login Logic Tests',
    file: 'test-login-logic.js',
    description: 'Comprehensive authentication system tests'
  },
  {
    name: 'Authentication Tests',
    file: 'test-auth.js',
    description: 'Core authentication functionality tests'
  },
  {
    name: 'Phone Authentication Tests',
    file: 'test-phone-auth.js',
    description: 'Phone number + SMS verification tests'
  },
  {
    name: 'SMS Provider Tests',
    file: 'test-sms-providers.js',
    description: 'SMS provider integration tests'
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Running: ${test.name}`);
    console.log(`📝 Description: ${test.description}`);
    console.log(`📁 File: ${test.file}`);
    console.log(`${'='.repeat(60)}\n`);

    const testProcess = spawn('node', [test.file], {
      cwd: __dirname,
      stdio: 'inherit'
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${test.name} - PASSED\n`);
        resolve({ name: test.name, status: 'PASSED', code });
      } else {
        console.log(`\n❌ ${test.name} - FAILED (exit code: ${code})\n`);
        resolve({ name: test.name, status: 'FAILED', code });
      }
    });

    testProcess.on('error', (error) => {
      console.log(`\n❌ ${test.name} - ERROR: ${error.message}\n`);
      resolve({ name: test.name, status: 'ERROR', code: 1 });
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Test Suite');
  console.log('📅 Date:', new Date().toISOString());
  console.log('📁 Test Directory:', __dirname);
  console.log('🔢 Total Tests:', tests.length);

  const results = [];
  const startTime = Date.now();

  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUITE SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const errors = results.filter(r => r.status === 'ERROR').length;

  console.log(`⏱️  Total Duration: ${duration}s`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🚨 Errors: ${errors}`);
  console.log(`📊 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : 
                  result.status === 'FAILED' ? '❌' : '🚨';
    console.log(`  ${status} ${result.name} - ${result.status}`);
  });

  if (failed > 0 || errors > 0) {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed successfully!');
    process.exit(0);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Test Runner - Execute All Tests

Usage:
  node test/run-all-tests.js           # Run all tests
  node test/run-all-tests.js --help    # Show this help

Available Tests:
${tests.map(t => `  - ${t.name}: ${t.file}`).join('\n')}

Environment Variables:
  DEBUG=true          # Enable debug logging
  TEST_TIMEOUT=30000  # Test timeout in milliseconds
  SKIP_TESTS=test1,test2  # Skip specific tests (comma-separated)
`);
  process.exit(0);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  runTest,
  tests
};
