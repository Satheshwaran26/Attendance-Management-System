// Test file for department mapping utility
import { standardizeDepartmentName } from './departmentMapping';

// Test cases based on the user's department list
const testCases = [
  { input: 'BSC CS WITH CS', expected: 'BSc CS with CS' },
  { input: 'Bsc CS', expected: 'BSc Computer Science' },
  { input: 'BSc CS(AI& DS)', expected: 'BSc CS (AI&DS)' },
  { input: 'B. Sc Cyber Security', expected: 'BSc Cyber Security' },
  { input: 'BCA', expected: 'BCA' },
  { input: 'Bsc.CS (AI&DS)', expected: 'BSc CS (AI&DS)' },
  { input: 'BSc Computer Science', expected: 'BSc Computer Science' },
  { input: 'B.Sc DCFS', expected: 'BSc DCFS' },
  { input: 'Bsc IT', expected: 'BSc IT' },
  { input: 'BSc cs AI&DS', expected: 'BSc CS (AI&DS)' },
  { input: 'Bsc.ECS', expected: 'BSc ECS' },
  { input: 'BSC ECS', expected: 'BSc ECS' },
  { input: 'BSC CS DA', expected: 'BSc CS DA' },
  { input: 'BSc Computer Technology', expected: 'BSc Computer Technology' },
  { input: 'MSC ECS', expected: 'MSc ECS' },
  { input: 'Msc IT', expected: 'MSc IT' },
  { input: 'BSc CT', expected: 'BSc CT' },
  { input: 'Bsc.CT', expected: 'BSc CT' },
  { input: 'Bsc AIDS', expected: 'BSc CS (AI&DS)' },
  { input: 'MSc Computer Science', expected: 'MSc Computer Science' },
  { input: 'BSC CT', expected: 'BSc CT' },
  { input: 'BSC AI DS', expected: 'BSc CS (AI&DS)' },
  { input: 'Bsc Cs with AI/DS', expected: 'BSc CS (AI&DS)' },
  { input: 'Msc.ECS', expected: 'MSc ECS' },
  { input: 'BSCECS', expected: 'BSc ECS' },
  { input: 'BCOM CS', expected: 'BCOM CS' },
  { input: 'Bsc Cs With cyber security', expected: 'BSc CS with Cyber Security' },
  { input: 'BSc.CS', expected: 'BSc Computer Science' },
  { input: 'Bsc Cs with Cs', expected: 'BSc CS with CS' }
];

console.log('Testing department standardization...\n');

testCases.forEach(({ input, expected }, index) => {
  const result = standardizeDepartmentName(input);
  const passed = result === expected;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Input: "${input}"`);
  console.log(`  Expected: "${expected}"`);
  console.log(`  Got: "${result}"`);
  console.log('');
});

console.log('Department standardization test completed!');
