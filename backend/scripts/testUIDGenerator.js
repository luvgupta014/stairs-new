/**
 * Test script for UID Generator
 * Run this to verify UID generation is working correctly
 */

const { generateUID, validateUID, parseUID, getStateCode } = require('../src/utils/uidGenerator');

async function testUIDGenerator() {
  console.log('🧪 === UID GENERATOR TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Generate UID for Student from Delhi
  console.log('Test 1: Generate Student UID from Delhi');
  try {
    const uid = await generateUID('STUDENT', 'Delhi');
    console.log(`✅ Generated: ${uid}`);
    
    // Check format
    if (uid[0] === 'a' && uid.length === 14) {
      console.log('✅ Format is correct\n');
      passed++;
    } else {
      console.log('❌ Format is incorrect\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
    failed++;
  }

  // Test 2: Generate UID for Coach from Maharashtra
  console.log('Test 2: Generate Coach UID from Maharashtra');
  try {
    const uid = await generateUID('COACH', 'Maharashtra');
    console.log(`✅ Generated: ${uid}`);
    
    if (uid[0] === 'c' && uid.substring(6, 8) === 'MH') {
      console.log('✅ Prefix and state code correct\n');
      passed++;
    } else {
      console.log('❌ Prefix or state code incorrect\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
    failed++;
  }

  // Test 3: Generate UID for Institute
  console.log('Test 3: Generate Institute UID from Karnataka');
  try {
    const uid = await generateUID('INSTITUTE', 'Karnataka');
    console.log(`✅ Generated: ${uid}`);
    
    if (uid[0] === 'i' && uid.substring(6, 8) === 'KA') {
      console.log('✅ Correct format\n');
      passed++;
    } else {
      console.log('❌ Incorrect format\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
    failed++;
  }

  // Test 4: Generate UID for Club
  console.log('Test 4: Generate Club UID from Tamil Nadu');
  try {
    const uid = await generateUID('CLUB', 'Tamil Nadu');
    console.log(`✅ Generated: ${uid}`);
    
    if (uid[0] === 'b' && uid.substring(6, 8) === 'TN') {
      console.log('✅ Correct format\n');
      passed++;
    } else {
      console.log('❌ Incorrect format\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
    failed++;
  }

  // Test 5: Validate correct UID
  console.log('Test 5: Validate correct UID format');
  try {
    const result = validateUID('a00001DL112025');
    if (result.valid) {
      console.log('✅ Validation passed');
      console.log('✅ Components:', result.components, '\n');
      passed++;
    } else {
      console.log('❌ Validation failed\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
    failed++;
  }

  // Test 6: Validate incorrect UID
  console.log('Test 6: Validate incorrect UID format');
  try {
    const result = validateUID('x99999XX999999');
    if (!result.valid) {
      console.log('✅ Correctly identified as invalid');
      console.log('✅ Error:', result.error, '\n');
      passed++;
    } else {
      console.log('❌ Should have been invalid\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
    failed++;
  }

  // Test 7: Parse UID
  console.log('Test 7: Parse UID components');
  try {
    const components = parseUID('c00042MH112025');
    console.log('✅ Parsed components:', components);
    
    if (components.userType === 'COACH' && 
        components.sequence === '00042' &&
        components.stateCode === 'MH' &&
        components.month === '11' &&
        components.year === '2025') {
      console.log('✅ All components correct\n');
      passed++;
    } else {
      console.log('❌ Components incorrect\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
    failed++;
  }

  // Test 8: State code mapping
  console.log('Test 8: State code mapping');
  try {
    const dl = getStateCode('Delhi');
    const mh = getStateCode('Maharashtra');
    const ka = getStateCode('Karnataka');
    
    if (dl === 'DL' && mh === 'MH' && ka === 'KA') {
      console.log('✅ State codes correct:', { dl, mh, ka }, '\n');
      passed++;
    } else {
      console.log('❌ State codes incorrect\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
    failed++;
  }

  // Test 9: Invalid user type
  console.log('Test 9: Handle invalid user type');
  try {
    await generateUID('INVALID_TYPE', 'Delhi');
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log('✅ Correctly rejected invalid user type');
    console.log('✅ Error:', error.message, '\n');
    passed++;
  }

  // Test 10: Missing state
  console.log('Test 10: Handle missing state');
  try {
    await generateUID('STUDENT', null);
    console.log('❌ Should have thrown error\n');
    failed++;
  } catch (error) {
    console.log('✅ Correctly rejected missing state');
    console.log('✅ Error:', error.message, '\n');
    passed++;
  }

  // Test 11: Multiple sequential UIDs
  console.log('Test 11: Generate multiple sequential UIDs');
  try {
    const uid1 = await generateUID('STUDENT', 'Delhi');
    const uid2 = await generateUID('STUDENT', 'Delhi');
    
    const seq1 = parseInt(uid1.substring(1, 6), 10);
    const seq2 = parseInt(uid2.substring(1, 6), 10);
    
    if (seq2 === seq1 + 1) {
      console.log('✅ Sequential generation working');
      console.log(`   ${uid1} → ${uid2}\n`);
      passed++;
    } else {
      console.log('❌ Sequential generation not working\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
    failed++;
  }

  // Test 12: Different states don't interfere
  console.log('Test 12: Different states maintain separate sequences');
  try {
    const uidDL = await generateUID('STUDENT', 'Delhi');
    const uidMH = await generateUID('STUDENT', 'Maharashtra');
    
    const stateDL = uidDL.substring(6, 8);
    const stateMH = uidMH.substring(6, 8);
    
    if (stateDL === 'DL' && stateMH === 'MH') {
      console.log('✅ States maintain separate sequences');
      console.log(`   Delhi: ${uidDL}`);
      console.log(`   Maharashtra: ${uidMH}\n`);
      passed++;
    } else {
      console.log('❌ State sequences interfering\n');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
    failed++;
  }

  // Results
  console.log('═══════════════════════════════════════');
  console.log('🎯 TEST RESULTS');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉 All tests passed! UID generator is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
console.log('Starting UID Generator tests...\n');
testUIDGenerator().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
