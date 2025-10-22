// Test script to verify the automatic calculation functionality
const testCalculations = [
  {
    certificates: 3,
    medals: 2,
    trophies: 10,
    certificatePrice: 1,
    medalPrice: 100,
    trophyPrice: 1,
    expectedTotal: 213
  },
  {
    certificates: 5,
    medals: 3,
    trophies: 2,
    certificatePrice: 50,
    medalPrice: 200,
    trophyPrice: 500,
    expectedTotal: 1850 // 5*50 + 3*200 + 2*500 = 250 + 600 + 1000
  },
  {
    certificates: 0,
    medals: 10,
    trophies: 0,
    certificatePrice: 100,
    medalPrice: 150,
    trophyPrice: 300,
    expectedTotal: 1500 // 0*100 + 10*150 + 0*300 = 1500
  }
];

function calculateTotal(certificates, medals, trophies, certPrice, medPrice, tropPrice) {
  return (certificates * certPrice) + (medals * medPrice) + (trophies * tropPrice);
}

console.log('🧮 Testing Automatic Total Calculation...\n');

testCalculations.forEach((test, index) => {
  const calculated = calculateTotal(
    test.certificates, 
    test.medals, 
    test.trophies,
    test.certificatePrice,
    test.medalPrice,
    test.trophyPrice
  );
  
  const passed = calculated === test.expectedTotal;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Quantities: ${test.certificates} certificates, ${test.medals} medals, ${test.trophies} trophies`);
  console.log(`  Prices: ₹${test.certificatePrice}, ₹${test.medalPrice}, ₹${test.trophyPrice}`);
  console.log(`  Expected: ₹${test.expectedTotal}`);
  console.log(`  Calculated: ₹${calculated}`);
  console.log(`  Formula: ${test.certificates} × ₹${test.certificatePrice} + ${test.medals} × ₹${test.medalPrice} + ${test.trophies} × ₹${test.trophyPrice} = ₹${calculated}\n`);
});

console.log('✅ All calculation tests completed!');