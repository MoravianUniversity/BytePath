import { distance } from 'fastest-levenshtein';

/** Max edit distance allowed, scaled by answer length (typos, not different words). */
function maxEditDistance(len: number): number {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  return Math.max(2, Math.floor(len * 0.2));
}

/** True if `answer` matches `expected` within a typo-tolerant edit distance. */
export function fuzzyMatch(answer: string, expected: string): boolean {
  if (answer === expected) return true;
  const len = Math.max(answer.length, expected.length);
  return distance(answer, expected) <= maxEditDistance(len);
}
