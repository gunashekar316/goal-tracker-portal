export function calculateScore(goal: any, actualAchievement: string): number {
  if (!actualAchievement) return 0;

  let score = 0;
  
  if (goal.unitOfMeasurement === "Timeline") {
    const actualDate = new Date(actualAchievement).getTime();
    const targetDate = new Date(goal.target).getTime();
    if (!isNaN(actualDate) && !isNaN(targetDate)) {
      score = actualDate <= targetDate ? 100 : 0;
    }
  } else if (goal.unitOfMeasurement === "Zero-based") {
    const actual = parseFloat(actualAchievement);
    if (!isNaN(actual)) {
      score = actual === 0 ? 100 : 0;
    }
  } else {
    const actual = parseFloat(actualAchievement);
    const target = parseFloat(goal.target);
    
    if (!isNaN(actual) && !isNaN(target) && target !== 0) {
      if (goal.trackingType === "Min (Higher is better)") {
        score = (actual / target) * 100;
      } else {
        // Max (Lower is better)
        // If actual is 0, they overachieved infinitely. Cap at 100.
        score = actual === 0 ? 100 : (target / actual) * 100;
      }
    } else if (target === 0 && actual === 0) {
      score = 100; // Edge case
    }
  }

  // Cap at 100% and return integer
  return Math.min(Math.round(score), 100);
}
