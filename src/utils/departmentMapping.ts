// Department name standardization utility
// This maps various department name variations to standardized names

export const standardizeDepartmentName = (department: string): string => {
  if (!department) return 'Unknown';
  
  const normalized = department.trim().toLowerCase();
  
  // BSc Computer Science variations
  if (normalized.includes('bsc') && normalized.includes('cs') && !normalized.includes('ai') && !normalized.includes('ds') && !normalized.includes('cyber') && !normalized.includes('da')) {
    return 'BSc Computer Science';
  }
  
  // BSc CS with CS variations
  if (normalized.includes('bsc cs with cs') || normalized.includes('bsc cs with cs')) {
    return 'BSc CS with CS';
  }
  
  // BSc CS (AI&DS) variations
  if (normalized.includes('ai') && normalized.includes('ds') && (normalized.includes('bsc') || normalized.includes('bsc.'))) {
    if (normalized.includes('ai&ds') || normalized.includes('ai & ds') || normalized.includes('ai/ds')) {
      return 'BSc CS (AI&DS)';
    }
  }
  
  // BSc Cyber Security variations
  if (normalized.includes('cyber') && normalized.includes('security') && normalized.includes('bsc')) {
    return 'BSc Cyber Security';
  }
  
  // BCA
  if (normalized === 'bca') {
    return 'BCA';
  }
  
  // BSc IT
  if (normalized.includes('bsc') && normalized.includes('it') && !normalized.includes('msc')) {
    return 'BSc IT';
  }
  
  // BSc ECS variations
  if (normalized.includes('bsc') && normalized.includes('ecs') && !normalized.includes('msc')) {
    return 'BSc ECS';
  }
  
  // BSc CS DA
  if (normalized.includes('bsc') && normalized.includes('cs') && normalized.includes('da')) {
    return 'BSc CS DA';
  }
  
  // BSc Computer Technology variations
  if (normalized.includes('bsc') && normalized.includes('computer') && normalized.includes('technology')) {
    return 'BSc Computer Technology';
  }
  
  // BSc CT variations
  if (normalized.includes('bsc') && normalized.includes('ct') && !normalized.includes('msc')) {
    return 'BSc CT';
  }
  
  // MSc ECS
  if (normalized.includes('msc') && normalized.includes('ecs')) {
    return 'MSc ECS';
  }
  
  // MSc IT
  if (normalized.includes('msc') && normalized.includes('it')) {
    return 'MSc IT';
  }
  
  // MSc Computer Science
  if (normalized.includes('msc') && normalized.includes('computer') && normalized.includes('science')) {
    return 'MSc Computer Science';
  }
  
  // BSc AIDS (AI & DS)
  if (normalized.includes('aids') || (normalized.includes('ai') && normalized.includes('ds') && normalized.includes('bsc'))) {
    return 'BSc CS (AI&DS)';
  }
  
  // BCOM CS
  if (normalized.includes('bcom') && normalized.includes('cs')) {
    return 'BCOM CS';
  }
  
  // BSc CS with Cyber Security
  if (normalized.includes('bsc') && normalized.includes('cs') && normalized.includes('cyber')) {
    return 'BSc CS with Cyber Security';
  }
  
  // BSc.CS
  if (normalized === 'bsc.cs') {
    return 'BSc Computer Science';
  }
  
  // BSc Cs with Cs
  if (normalized.includes('bsc') && normalized.includes('cs with cs')) {
    return 'BSc CS with CS';
  }
  
  // BSc DCFS
  if (normalized.includes('bsc') && normalized.includes('dcfs')) {
    return 'BSc DCFS';
  }
  
  // BSCECS
  if (normalized === 'bscecs') {
    return 'BSc ECS';
  }
  
  // BSC AI DS
  if (normalized.includes('bsc') && normalized.includes('ai') && normalized.includes('ds')) {
    return 'BSc CS (AI&DS)';
  }
  
  // Bsc Cs with AI/DS
  if (normalized.includes('bsc') && normalized.includes('cs') && normalized.includes('ai') && normalized.includes('ds')) {
    return 'BSc CS (AI&DS)';
  }
  
  // Msc.ECS
  if (normalized === 'msc.ecs') {
    return 'MSc ECS';
  }
  
  // Default fallback - return original with proper capitalization
  return department.trim().replace(/\b\w/g, l => l.toUpperCase());
};

// Get all standardized department names
export const getStandardizedDepartments = (): string[] => {
  return [
    'BSc Computer Science',
    'BSc CS with CS',
    'BSc CS (AI&DS)',
    'BSc Cyber Security',
    'BCA',
    'BSc IT',
    'BSc ECS',
    'BSc CS DA',
    'BSc Computer Technology',
    'BSc CT',
    'MSc ECS',
    'MSc IT',
    'MSc Computer Science',
    'BCOM CS',
    'BSc CS with Cyber Security',
    'BSc DCFS'
  ];
};

// Get department count for a given standardized name
export const getDepartmentCount = (departments: string[]): { [key: string]: number } => {
  const counts: { [key: string]: number } = {};
  
  departments.forEach(dept => {
    const standardized = standardizeDepartmentName(dept);
    counts[standardized] = (counts[standardized] || 0) + 1;
  });
  
  return counts;
};
