// 当前事实与历史标签分离；标签记录经历，lifeState 决定后续剧情资格。
export function createLifeState() {
  return {
    education: 'none',
    schooling: 'preschool',
    career: 'none',
    careerTrack: 'general',
    marriage: 'single',
    parenthood: 'none',
    childBirthAge: null,
    housing: 'family',
    mortgageEndAge: null,
    hasGrandchildren: false
  };
}

export function advanceLifeState(state, age) {
  const next = { ...state };
  if (age === 6) next.schooling = 'primary';
  if (age === 12) Object.assign(next, { education: 'primary', schooling: 'junior_high' });
  if (age === 15) Object.assign(next, { education: 'junior_high', schooling: 'none' });
  if (age === 18 && next.schooling === 'high_school') {
    Object.assign(next, { education: 'high_school', schooling: 'none' });
  } else if (age === 18 && next.schooling === 'vocational') {
    Object.assign(next, { education: 'vocational', schooling: 'none', career: 'worker' });
  } else if (age === 21 && next.schooling === 'college') {
    Object.assign(next, { education: 'college', schooling: 'none', career: 'private' });
  } else if (age === 22 && next.schooling === 'university') {
    Object.assign(next, {
      education: 'bachelor', schooling: 'none',
      career: next.careerTrack === 'directed_public' ? 'public' : 'private'
    });
  }
  if (age === 60) next.career = 'retired';
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
