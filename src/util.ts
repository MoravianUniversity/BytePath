///////////////////////////////////////
////////// Utility Functions //////////
///////////////////////////////////////
// Shuffle array
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate a range of integers (inclusive of min and max)
export function range(min: bigint, max: bigint, step: bigint = 1n): bigint[] {
  return Array.from({ length: Number((max - min) / step) + 1 }, (_, i) => min + BigInt(i) * step);
}

// Generate a range of numbers (inclusive of min and max)
export function rangeNum(min: number, max: number, step: number = 1): number[] {
  return Array.from({ length: Math.floor((max - min) / step + 1) }, (_, i) => min + i * step);
}

// Generate random integers (inclusive of min and max)
export function randInt(min: bigint, max: bigint): bigint {
  return BigInt(Math.floor(Math.random() * (Number(max - min) + 1))) + min;
}

// Generate random integers [as numbers] (inclusive of min and max)
export function randIntNum(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate n random integers between min and max (inclusive); all elements will be unique
export function randInts(min: bigint, max: bigint, n: number, unique: boolean = true): bigint[] {
  if (unique) {
    const nums = Array.from({ length: Number(max - min) + 1 }, (_, i) => min + BigInt(i));
    return randChoices(nums, n);
  } else {
    return Array.from({ length: n }, () => randInt(min, max));
  }
}

// Generate n random integers [as numbers] between min and max (inclusive); all elements will be unique
export function randIntsNum(min: number, max: number, n: number, unique: boolean = true): number[] {
  if (unique) {
    const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return randChoices(nums, n);
  } else {
    return Array.from({ length: n }, () => randIntNum(min, max));
  }
}

// Generate a random float between min and max (inclusive) with a max number of decimal places
export function randFloat(min: number = 0, max: number = 1, decimals: number = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Generate n random floats between min and max (inclusive); all elements will be unique
export function randFloats(min: number = 0, max: number = 1, n: number = 1, unique: boolean = true, decimals: number = 1): number[] {
  if (unique) {
    const nums = new Set<number>();
    while (nums.size < n) { nums.add(randFloat(min, max, decimals)); }
    return Array.from(nums);
  } else {
    return Array.from({ length: n }, () => randFloat(min, max, decimals));
  }
}

// Check if two numbers are close to each other
// Treats NaN as equal to NaN
export function isClose(a: number, b: number, epsilon: number = 1e-6): boolean {
  if (isNaN(a) || isNaN(b)) { return isNaN(a) && isNaN(b); }
  if (a === Infinity || b === Infinity) { return a === Infinity && b === Infinity; }
  if (a === -Infinity || b === -Infinity) { return a === -Infinity && b === -Infinity; }
  return Math.abs(a - b) <= epsilon * Math.max(Math.abs(a), Math.abs(b));
}

// Generate a random boolean
export function randBool(probability: number = 0.5): boolean { return Math.random() < probability; }

// Generate n random booleans
export function randBools(n: number, probability: number = 0.5): boolean[] { return Array.from({length: n}, () => randBool(probability)); }

// Choose a random element from an array
export function randChoice<T>(array: T[]): T {
  return array[randIntNum(0, array.length - 1)];
}

// Choose n random elements from an array; all elements will be unique
export function randChoices<T>(array: T[], n: number, unique: boolean = true): T[] {
  if (unique) {
    return shuffle(array).slice(0, n);
  } else {
    return Array.from({ length: n }, () => randChoice(array));
  }
}

export const ASCII_LETTERS = [..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"];
export const ASCII_LOWER = [..."abcdefghijklmnopqrstuvwxyz"];
export const ASCII_UPPER = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
export const DIGITS = [..."0123456789"];
export const STRINGS = ['hello', 'world', 'python', 'code', 'cat', 'dog', 'cow', 'pig', 'apple', 'banana', 'kiwi', 'mango', 'pear'];
export const VARS = ['x', 'y', 'z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'm', 'n'];
export const FUNCS = ['foo', 'bar', 'baz', 'qux', 'quux', 'corge', 'grault', 'garply', 'waldo', 'fred', 'plugh', 'xyzzy', 'thud'];

// Choose a random variable name
export function randVariable(): string { return randChoice(VARS); }

// Choose n random variable names
export function randVars(n: number): string[] { return randChoices(VARS, n); }

// Choose a random function name
export function randFunc(): string { return randChoice(FUNCS); }

// Choose n random function names
export function randFuncs(n: number): string[] { return randChoices(FUNCS, n); }


// Max of two bigints
export function max(a: bigint, b: bigint): bigint { return a > b ? a : b }

// Min of two bigints
export function min(a: bigint, b: bigint): bigint { return a < b ? a : b }

// Perform a mathematical operation on two bigints
export function math(a: bigint, op: string, b: bigint): bigint {
  if (op === '+') { return a + b; }
  if (op === '-') { return a - b; }
  if (op === '*') { return a * b; }
  //if (op === '/') { return a.toNumber() / b.toNumber(); } // generates a number, not a bigint
  if (op === '//') { return a / b; }
  if (op === '%') { return a % b; }
  if (op === '**') { return a ** b; }
  throw new Error(`Invalid operation: ${op}`);
}

// Evaluate a relational operation on two bigints
export function evalRelOp(a: bigint, op: string, b: bigint): boolean {
  switch (op) {
    case '==': return a == b;
    case '!=': return a != b;
    case '<': return a < b;
    case '<=': return a <= b;
    case '>': return a > b;
    case '>=': return a >= b;
  }
  return false;
}

// Return "not " with a given probability
export function maybeNot(probability: number = 0.2): string { return Math.random() <= probability ? "not " : ""; }

// Capitalize the first character of a string
export function capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

/** First + last word initials from a display name (e.g. "Ada Lovelace" → "AL"). */
export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Write a list of values, separated by commas and/or and as appropriate
export function written_list_of_values(values: any[]): string {
  if (values.length === 0) { return ''; }
  if (values.length === 1) { return values[0].toString(); }
  if (values.length === 2) { return values[0].toString() + ' and ' + values[1].toString(); }
  return values.slice(0, -1).map(value => value.toString()).join(', ') + ', and ' + values[values.length - 1].toString();
}

// Zip two iterables into a generator of pairs
export function *zip<T1, T2>(iterable1: Iterable<T1>, iterable2: Iterable<T2>): Generator<[T1, T2], void, unknown> {
  const iter1 = iterable1[Symbol.iterator]();
  const iter2 = iterable2[Symbol.iterator]();
  while (true) {
    const result1 = iter1.next();
    const result2 = iter2.next();
    if (result1.done || result2.done) { return; }
    yield [result1.value, result2.value];
  }
}

// Zip multiple iterables into a generator of tuples (has typing issues...)
// function *zip<T>(...iterables: Iterable<T>[]): Generator<T[], void, unknown> {
//   const iterators = iterables.map(i => i[Symbol.iterator]());
//   while (true) {
//     const results = iterators.map(iter => iter.next());
//     if (results.some(res => res.done)) { return; }
//     yield results.map(res => res.value);
//   }
// }

// Filter a list to remove duplicates
export function deduplicate<T>(array: T[], isSame: (a: T, b: T) => boolean = (a, b) => a === b): T[] {
  const output: T[] = [];
  for (const item of array) {
    if (!output.some((o) => isSame(o, item))) {
      output.push(item);
    }
  }
  return output;
}

// Parse API timestamps stored as UTC (often without a Z suffix) into a Date
export function parseServerUtc(iso: string): Date {
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(iso) ? iso : `${iso}Z`;
  return new Date(normalized);
}

// Convert an API timestamp stored as UTC into a Unix timestamp in milliseconds
export function serverTimestampMs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = parseServerUtc(iso).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function isAssignmentEndOfDay(date: Date): boolean {
  return date.getHours() === 23 && date.getMinutes() === 59;
}

// Format a UTC API timestamp for display in the user's local timezone.
export function formatDateTime(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = parseServerUtc(isoDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();
  const withinOneYear = Math.abs(now.getTime() - date.getTime()) < MS_PER_YEAR;
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  if (!withinOneYear) {
    dateOptions.year = 'numeric';
  }

  if (isAssignmentEndOfDay(date)) {
    return date.toLocaleDateString(undefined, dateOptions);
  }

  return date.toLocaleString(undefined, {
    ...dateOptions,
    hour: 'numeric',
    minute: '2-digit',
  });
}
