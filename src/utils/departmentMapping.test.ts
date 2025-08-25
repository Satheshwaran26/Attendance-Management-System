import { describe, it, expect } from 'vitest';
import { standardizeDepartmentName } from './departmentMapping';

describe('Department Name Standardization', () => {
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

  testCases.forEach(({ input, expected }) => {
    it(`should standardize "${input}" to "${expected}"`, () => {
      const result = standardizeDepartmentName(input);
      expect(result).toBe(expected);
    });
  });

  it('should handle empty input', () => {
    expect(standardizeDepartmentName('')).toBe('Unknown');
  });

  it('should handle null/undefined input', () => {
    expect(standardizeDepartmentName(null as any)).toBe('Unknown');
    expect(standardizeDepartmentName(undefined as any)).toBe('Unknown');
  });

  it('should handle whitespace-only input', () => {
    expect(standardizeDepartmentName('   ')).toBe('Unknown');
  });
});
