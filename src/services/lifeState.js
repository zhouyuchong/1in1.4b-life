// 当前事实与历史标签分离；标签记录经历，lifeState 决定后续剧情资格。
export function createLifeState() {
  return {
    education: 'none',
    riskAttempts: {},
    examPreparation: null,
    schoolEndAge: null,
    universityTier: null,
    annualSalary: null,
    schooling: 'preschool',
    career: 'none',
    careerTrack: 'general',
    marriage: 'single',
    relationship: 'single',
    partnerName: null,
    friends: [],
    fatherAlive: true,
    motherAlive: true,
    fatherFarewellAge: 48 + Math.floor(Math.random() * 15),
    motherFarewellAge: 53 + Math.floor(Math.random() * 15),
    parenthood: 'none',
    childBirthAge: null,
    housing: 'family',
    mortgageEndAge: null,
    hasGrandchildren: false
  };
}

export function advanceLifeState(state, age) {
  const next = { ...state };
  const schoolAge = age - (state.schoolingDelay || 0);
  if (schoolAge === 6) next.schooling = 'primary';
  if (schoolAge === 12) Object.assign(next, { education: 'primary', schooling: 'junior_high' });
  if (schoolAge === 15) Object.assign(next, { education: 'junior_high', schooling: 'none' });
  if (schoolAge === 18 && next.schooling === 'high_school') {
    Object.assign(next, { education: 'high_school', schooling: 'none' });
  } else if (schoolAge === 18 && next.schooling === 'vocational') {
    Object.assign(next, { education: 'vocational', schooling: 'none', career: 'worker' });
  } else if (schoolAge === 21 && next.schooling === 'college' && !state.schoolEndAge) {
    Object.assign(next, { education: 'college', schooling: 'none', career: 'private' });
  } else if (schoolAge === 22 && next.schooling === 'university' && !state.schoolEndAge) {
    Object.assign(next, {
      education: 'bachelor', schooling: 'none',
      career: next.careerTrack === 'directed_public' ? 'public' : 'private'
    });
  }
  if (state.schoolEndAge != null && age >= state.schoolEndAge && ['university', 'college', 'graduate'].includes(state.schooling)) {
    Object.assign(next, { education: { university: 'bachelor', college: 'college', graduate: 'master' }[state.schooling], schooling: 'none', career: 'private', careerTrack: 'general', annualSalary: null, schoolEndAge: null });
  }
  if (age >= 60) Object.assign(next, { career: 'retired', annualSalary: null });
  if (next.housing === 'mortgaged' && next.mortgageEndAge !== null && age >= next.mortgageEndAge) {
    Object.assign(next, { housing: 'owned', mortgageEndAge: null });
  }
  return next;
}

export function matchesLifeState(expected, state) {
  return Object.entries(expected || {}).every(([key, value]) =>
    Array.isArray(value) ? value.includes(state[key]) : state[key] === value
  );
}
