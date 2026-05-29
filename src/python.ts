import dedent from 'dedent-js';
import JSON5 from "json5";

// Python compatible types
export type Tuple<T> = Readonly<T[]>;
export type FrozenSet<T> = Readonly<Set<T>>;
export type Immutable = string | bigint | number | boolean | null | Tuple<any>; // TODO: avoid any?

// Python Exception type extends JS Error
export type Exception = Error;
export function createException(name: string, message: string = ''): Exception {
  const error = new Error(message);
  error.name = name;
  return error;
}

/**
 * Convert a list of items to a tuple.
 * @param items - The items to convert.
 * @returns The converted tuple.
 */
export function asTuple(items: PyType[]): Tuple<PyType> {
  return Object.freeze(items) as Tuple<PyType>;
}

/**
 * Create a tuple from the given items. This propagates undefined items.
 * @param items - The items to create the tuple from.
 * @returns The created tuple.
 */
export function tuple(...items: PyType[]): Tuple<PyType> | undefined {
  if (items.some(item => item === undefined)) { return undefined; }
  return Object.freeze(items) as Tuple<PyType>;
}

// Base Python types, the following transformations to/from Python are done:
// - string -> str
// - bigint -> int
// - number -> float
// - boolean -> True/False (bool)
// - null -> None
// - PyType[] -> List[Any]
// - Tuple<PyType> -> Tuple[Any]
// - Map<Immutable, PyType> -> Dict[Immutable, Any]
// - Set<Immutable> -> Set[Immutable]
// - FrozenSet<Immutable> -> FrozenSet[Immutable]
// - Exception -> Error/Exception (name and message) (typically reprensented as the raised exception, but can be used as a normal type)
// - symbol -> variable name (assumes it is a valid variable name)
export type PyType = Immutable | Exception | PyType[] | Map<Immutable, PyType> | Set<Immutable> | FrozenSet<Immutable> | symbol;


const decoder = new TextDecoder('utf-8');
let stdout: string = "";
let stdin: string[] = [];

// Create a promise that resolves when Python is loaded
let pythonLoadPromise: Promise<any> | null = null;
let python: any = null;
let IS_MICROPYTHON = false;

/**
 * Load Python Interpreter.
 */
function loadPython(): Promise<any> {
  if (pythonLoadPromise) { return pythonLoadPromise; }
  if (IS_MICROPYTHON) {
    // @ts-ignore
    pythonLoadPromise = import("https://cdn.jsdelivr.net/npm/@micropython/micropython-webassembly-pyscript@1.26.0/micropython.mjs").then((mp_mjs) =>
      mp_mjs.loadMicroPython({
        stdout: (text: string) => { stdout += text + "\n"; },
        stderr: console.error,
        // stdin: () => { return stdin.shift(); }, // TODO
      })
    ).then((mp) => { python = mp; window.python = mp; });
  } else {
    // @ts-ignore
    pythonLoadPromise = import("https://cdn.jsdelivr.net/pyodide/v0.28.2/full/pyodide.mjs").then((pyodide_mjs) =>
      pyodide_mjs.loadPyodide()
    ).then((pyodide) => {
      pyodide.setStdin({stdin: () => {
        const val = stdin.shift();
        if (val !== undefined) {
          stdout += '\x02'; // use a special character to indicate that the input was echoed
          stdout += val;
          if (!val.endsWith('\n')) {
            stdout += '\n';
          }
          stdout += '\x03'; // use a special character to indicate the end of the input
        }
        return val;
      }});
      pyodide.setStdout({write: (buf: Uint8Array) => { stdout += decoder.decode(buf); return buf.length; }});
      pyodide.setStderr(console.error);
      python = pyodide;
      window.python = pyodide;
    });
  }

  return pythonLoadPromise;
}

// Start loading Python immediately
loadPython();

/**
 * Get the Python loading promise
 */
export function getPythonLoadPromise(): Promise<any> {
  return loadPython();
}

/**
 * Check if Python is loaded
 */
export function isPythonLoaded(): boolean {
  return python !== null;
}

/**
 * Run code and return the result of the last line of code.
 * @param code - The code to run.
 * @param reset_globals - Whether to reset the globals to their original state.
 * @returns The result of the last line of code.
 */
export function runLastLine(code: string, reset_globals: boolean = true): PyType | undefined {
  if (!python) { throw new Error('Python not initialized'); }
  if (code[0] === '\n' || code[0] === ' ') { code = dedent(code); }
  const lines = code.split('\n');
  const last_line = `repr(${lines[lines.length - 1]})`;
  if (reset_globals) { resetGlobals(); }
  try {
    let repr_val: string;
    if (IS_MICROPYTHON) {
      // last line does not work in MicroPython - use a special global variable instead
      lines[lines.length - 1] = `_ = ${last_line}`;
      python.runPython(lines.join('\n'));
      repr_val = python.globals.get("_");
    } else {
      lines[lines.length - 1] = last_line;
      repr_val = python.runPython(lines.join('\n'));
    }
    return parsePyAtom(repr_val)[0];
  } catch (e) {
    console.error(e);
    console.error(lines.join('\n'));
    return convertPythonError(e);
  }
}

/**
 * Run code and return the printed output.
 * @param code - The code to run.
 * @param reset_globals - Whether to reset the globals to their original state.
 * @returns The printed output of the code.
 */
export function runGrabOutput(code: string, reset_globals: boolean = true): string | undefined {
  if (!python) { throw new Error('Python not initialized'); }
  if (code[0] === '\n' || code[0] === ' ') { code = dedent(code); }
  stdout = "";
  if (reset_globals) { resetGlobals(); }
  try {
    python.runPython(code);
    return stdout.trim();
  } catch (e) {
    console.error(e);
    console.error(code);
    const err = convertPythonError(e);
    if (err) { return `${stdout.trim()}\n${err.name}: ${err.message}`; }
    return undefined;
  }
}

function convertPythonError(e: any): Error | undefined {
  if (e instanceof Error && e.constructor.name === 'PythonError') {
    const lines = e.message.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    const [type, message] = lastLine?.split(':', 2) ?? [];
    return createException(type?.trim() ?? '', message?.trim() ?? '');
  }
  return undefined;
}

/**
 * Add input to the stdin buffer for the next run.
 * @param input - The input to add.
 */
export function addInput(input: string[] | string) {
  if (IS_MICROPYTHON) {
    // TODO: does not work?
  } else {
    stdin.push(...(Array.isArray(input) ? input : input.split('\n')));
  }
}

/**
 * Set the input buffer for the next run.
 * @param input - The input to set.
 */
export function setInput(input: string[] | string) {
  if (IS_MICROPYTHON) {
    // TODO: does not work?
  } else {
    stdin = Array.isArray(input) ? input.slice() : input.split('\n');
  }
}

/**
 * Get the input buffer for the next run.
 * @returns The input buffer.
 */
export function getInput(): string {
  return stdin.join('');
}

/**
 * Reset the globals to their original state.
 */
export function resetGlobals() {
  if (IS_MICROPYTHON) {
    const keys = [...python.globals.__dict__];
    for (const key of keys) { python.globals.delete(key); }
  } else {
    const keys = [...python.globals.keys()].filter(key => !key.startsWith('__') && key !== '_pyodide_core');
    for (const key of keys) { python.globals.delete(key); }
  }
}

const ERROR_TYPES = [
  'ArithmeticError',
    'FloatingPointError',
    'OverflowError',
    'ZeroDivisionError',
  'AssertionError',
  'AttributeError',  // ** taught
  'BufferError',
  'EOFError',
  'ImportError',
    'ModuleNotFoundError',
  'LookupError',
    'IndexError',  // ** taught
    'KeyError',  // ** taught
  'MemoryError',
  'NameError',  // ** taught
    'UnboundLocalError',  // ? this is separate from NameError?
  'OSError',
    'BlockingIOError',
    'ChildProcessError',
    'ConnectionError',
      'BrokenPipeError',
      'ConnectionAbortedError',
      'ConnectionRefusedError',
      'ConnectionResetError',
    'FileExistsError',
    'FileNotFoundError',
    'InterruptedError',
    'IsADirectoryError',
    'NotADirectoryError',
    'PermissionError',
    'ProcessLookupError',
    'TimeoutError',
  'ReferenceError',
  'RuntimeError',
    'NotImplementedError',
    'PythonFinalizationError',
    'RecursionError',
  'StopAsyncIteration',
  'StopIteration',
  'SyntaxError',  // ** taught
    'IndentationError',  // ** taught
      'TabError',
  'SystemError',
  'TypeError',  // ** taught
  'ValueError',  // ** taught
    'UnicodeError',
      'UnicodeDecodeError',
      'UnicodeEncodeError',
      'UnicodeTranslateError',
];


/**
 * Convert a Python "atom" string into the equivalent PyType (JS form).
 * Accepts the repr() display for the following types (along with a few alternatives):
 * - bools: True, False
 * - None: None
 * - ints: 123, 1_230, 0x123, ...
 * - floats: 1.23, 1_230.0, 1.23e+10, ...
 * - special floats: float('inf'), float('nan'), ...
 * - strings: "hello", 'world', ...
 *       NOTE: no f-strings, r-strings, b-strings, u-strings, or triple-quoted strings
 *       TODO: support r-strings and triple-quoted strings
 * - collections:
 *       - tuples: (1, 2, 3)
 *       - lists: [1, 2, 3]
 *       - dicts: {1: 2, 3: 4}
 *       - sets: {1, 2, 3} and set()
 *       - frozen sets: frozenset({1, 2, 3}), ...
 * Raises an error if the string is not a valid Python atom as per the above rules.
 * @param s - The string to parse.
 * @returns A tuple containing the parsed PyType and the remaining string.
 */
export function parsePyAtom(s: string): [PyType, string] {
  s = s.trim();
  const s_lower = s.toLowerCase();

  // errors (special, not actually Python atoms)
  for (const error of ERROR_TYPES) {
    if (s_lower.startsWith(error.toLowerCase())) {
      const rem = s.slice(error.length).trim();
      if (rem[0] === ':') { return [createException(error, rem.slice(1)), ""]; }
      return [createException(error), rem];
    }
  }

  // primitives
  let result =
    // bools/None
    runMatch(/^True\b/, s, () => true) ||
    runMatch(/^False\b/, s, () => false) ||
    runMatch(/^None\b/, s, () => null) ||
    // floats
    runMatch(/^[-+]?(?:\d(?:_?\d+)*|(?:(?:\d(?:_?\d+)*)?\.\d(?:_?\d+)*|\d(?:_?\d+)*\.))[eE][+-]?\d(_?\d+)*\b/, s, (x) => parseFloat(x.replace(/_/g, ''))) ||
    runMatch(/^[-+]?(?:(?:\d(?:_?\d+)*)?\.\d(?:_?\d+)*|\d(?:_?\d+)*\.)/, s, (x) => parseFloat(x.replace(/_/g, ''))) ||
    runMatch(/^float\s*\(\s*(["'])+?[iI][nN][fF]\1\s*\)\b/, s, () => Infinity) ||
    runMatch(/^float\s*\(\s*(["'])-[iI][nN][fF]\1\s*\)\b/, s, () => -Infinity) ||
    runMatch(/^float\s*\(\s*(["'])[nN][aA][nN]\1\s*\)\b/, s, () => NaN) ||
    // ints
    runMatch(/^[-+]?(?:[1-9](?:_?\d+)*|0(?:_?0+)*|0[xX][0-9a-fA-F](?:_?[0-9a-fA-F]+)*|0[bB][01](?:_?[01]+)*|0[oO][0-7](?:_?[0-7]+)*)\b/, s, (x) => BigInt(x.replace(/_/g, '')));
  if (result !== undefined) { return result; }

  // Strings
  // note: must be a plain string, not a f-string, r-string, b-string, or u-string
  const str = /^"(?:(?<!\\)(?:\\{2})*\\"|[^"])*(?<!\\)(?:\\{2})*"|^'(?:(?<!\\)(?:\\{2})*\\'|[^'])*(?<!\\)(?:\\{2})*'/;
  let match = s.match(str);
  if (match) { return [JSON5.parse(match[0]), s.slice(match[0].length)]; }
  // triple-quoted strings (TODO: doesn't handle escaped quotes properly)
  const ml_str = /^""".*?"""|^'''.*?'''/s;
  match = s.match(ml_str);
  if (match) { return [JSON5.parse(match[0]), s.slice(match[0].length)]; }

  // Collections
  if (s[0] === '(') {
    let [list, rem] = parsePyAtomList(s.slice(1), ')');
    if (list.length === 1) {
      const contents = s.slice(1, s.lastIndexOf(rem)).trim();
      if (!contents.match(/,\s*\)$/)) { // parenthesized atom is not a single-element tuple
        return [list[0], rem];
      }
    }
    return [Object.freeze(list), rem];
  }
  if (s[0] === '[') { return parsePyAtomList(s.slice(1), ']'); }
  if (s[0] === '{') {
    // dict or set (read 1 atom then check for a : or ,)
    s = s.slice(1).trim();
    if (s[0] === '}') { return [new Map<Immutable, PyType>(), s.slice(1)]; } // empty dict
    let [_, rem] = parsePyAtom(s);
    rem = rem.trim();
    if (rem[0] === ':') { return parsePyAtomDict(s); }
    if (rem[0] === ',' || rem[0] === '}') {
      let [list, rem2] = parsePyAtomList(s, '}');
      return [new Set<Immutable>(list as Immutable[]), rem2];
    }

    throw new Error(`Invalid syntax: ${s}`);
  }
  let frozenset_re = /^frozenset\(\s*\)/;
  match = s.match(frozenset_re);
  if (match) {
    let [list, rem] = parsePyAtom(s.slice(match[0].length));
    if (Array.isArray(list) || list instanceof Set) {
      return [Object.freeze(new Set<Immutable>(list as Immutable[])), rem];
    }
    if (list instanceof Map) {
      return [Object.freeze(new Set<Immutable>(list.keys())), rem];
    }
    throw new Error(`Invalid syntax: ${s}`);
  }

  // Empty set is special
  let empty_set_re = /^set\(\s*\)/;
  match = s.match(empty_set_re);
  if (match) { return [new Set<Immutable>(), s.slice(match[0].length)]; }

  // Variables (not really allowed)
  const id_re = /^[a-zA-Z_]\w*\b/;
  match = s.match(id_re);
  if (match) { return [Symbol(match[0]), s.slice(match[0].length)]; }

  throw new Error(`Invalid syntax: ${s}`);
};

/**
 * Parse a Python list of atoms from a string. For use with lists, tuples, and sets.
 * @param s - The string to parse.
 * @param end - The closing character for the list.
 * @returns A tuple containing the parsed PyType and the remaining string.
 */
function parsePyAtomList(s: string, end: string): [PyType[], string] {
  s = s.trim();
  if (s[0] === end) { return [[], s.slice(1)]; } // empty list
  let [atom, rem] = parsePyAtom(s);
  rem = rem.trim();
  if (rem[0] === end) { return [[atom], rem.slice(1)]; }
  if (rem[0] !== ',') { throw new Error(`Invalid syntax: ${s}`); }
  rem = rem.slice(1).trim();
  if (rem[0] === end) { return [[atom], rem.slice(1)]; }
  let [list, rem2] = parsePyAtomList(rem, end);
  return [[atom, ...list], rem2];
};

/**
 * Parse a Python dict of atoms from a string. For use with dicts.
 * @param s - The string to parse.
 * @returns A tuple containing the parsed PyType and the remaining string.
 */
function parsePyAtomDict(s: string): [Map<Immutable, PyType>, string] {
  s = s.trim();
  if (s[0] === '}') { return [new Map<Immutable, PyType>(), s.slice(1)]; } // empty dict
  let [key, rem] = parsePyAtom(s);
  rem = rem.trim();
  if (rem[0] !== ':') { throw new Error(`Invalid syntax: ${s}`); }
  rem = rem.slice(1).trim();
  let value;
  [value, rem] = parsePyAtom(rem);
  rem = rem.trim();
  if (rem[0] === '}') { return [new Map<Immutable, PyType>([[key as Immutable, value]]), rem.slice(1)]; }
  if (rem[0] !== ',') { throw new Error(`Invalid syntax: ${s}`); }
  rem = rem.slice(1).trim();
  if (rem[0] === '}') { return [new Map<Immutable, PyType>([[key as Immutable, value]]), rem.slice(1)]; }
  let [dict, rem2] = parsePyAtomDict(rem);
  return [new Map<Immutable, PyType>([[key as Immutable, value], ...dict]), rem2];
};

function runMatch(re: RegExp, s: string, convert: (x: string) => PyType): [PyType, string] | undefined {
  let match = s.match(re);
  if (match) { return [convert(match[0]), s.slice(match[0].length)]; }
  return undefined;
}



/**
 * Format a JS value into a Python repr() string. Supports the following types:
 * - null -> None
 * - boolean -> True, False
 * - BigInt -> int
 * - number -> float (including special floats: float('inf'), float('nan'), ...)
 * - string -> str
 * - array -> list
 * - frozen array -> tuple
 * - Map -> dict
 * - Set -> set
 * - frozen Set -> frozenset
 * - exceptions: Error, Exception (name and message)
 * - symbol -> variable name (assumes it is a valid variable name)
 * - other types: string representation of the value
 * @param atom - The value to format.
 * @returns The formatted value.
 */
export function toPyAtom(atom: PyType, pretty: boolean = false, indent: number = 0): string {
  // primitive types
  if (atom === null) { return 'None'; }
  switch (typeof atom) {
    case 'boolean': return atom ? 'True' : 'False';
    case 'bigint': return atom.toString();
    case 'number':
      if (atom === Infinity) { return 'float("inf")'; }
      if (atom === -Infinity) { return 'float("-inf")'; }
      if (isNaN(atom)) { return 'float("nan")'; }
      return atom.toLocaleString('en-US', { minimumFractionDigits: 1 });
    case 'string': return JSON5.stringify(atom);
    case 'symbol': return atom.description || atom.toString();
  }
  if (typeof atom !== 'object') { return String(atom); } // should never happen

  // collections
  if (Array.isArray(atom)) {
    if (Object.isFrozen(atom) && atom.length === 1) { return `(${toPyAtom(atom[0], pretty, indent)},)`; } // special case for single-item tuple
    const open = Object.isFrozen(atom) ? '(' : '[';
    const close = Object.isFrozen(atom) ? ')' : ']';
    if (pretty && atom.length > 1 && atom.some(isCollection)) {
      const indentStr = ' '.repeat((indent+1)*4);
      return `${open}\n${indentStr}${atom.map(x => toPyAtom(x, pretty, indent+1)).join(`,\n${indentStr}`)}\n${close}`;
    }
    return `${open}${atom.map(x => toPyAtom(x, pretty, indent)).join(', ')}${close}`; // PyType[] -> List[Any] and Tuple<PyType> -> Tuple[Any]
  }
  if (atom instanceof Map) { // Map<Immutable, PyType> -> Dict[Immutable, Any]
    return `{${Array.from(atom.entries()).map(([k, v]) => `${toPyAtom(k, pretty, indent)}: ${toPyAtom(v, pretty, indent)}`).join(', ')}}`;
  }
  if (atom instanceof Set) {
    if (Object.isFrozen(atom)) { return `frozenset(${Array.from(atom).map(x => toPyAtom(x, pretty, indent)).join(', ')})`; } // FrozenSet<Immutable> -> FrozenSet[Immutable]
    if (atom.size === 0) { return 'set()'; } // empty set is special
    return `{${Array.from(atom).map(x => toPyAtom(x, pretty, indent)).join(', ')}}`; // Set<Immutable> -> Set[Immutable]
  }

  // special cases
  if (atom instanceof Error) { // Exception -> Error/Exception (name and message)
    if (!atom.message) { return atom.name; }
    if (atom.name === 'Error') { return atom.message; }
    return atom.name; //`${atom.name}: ${atom.message}`;
  }
  return String(atom); // should never happen
};

function isCollection(atom: PyType): boolean {
  return Array.isArray(atom) || atom instanceof Map || atom instanceof Set;
}

const CONTAINER_PAIRS: Record<string, string> = { '[': ']', '(': ')', '{': '}' };
const CONTAINER_OPENERS = new Set(Object.keys(CONTAINER_PAIRS));
const CONTAINER_CLOSERS = new Set(Object.values(CONTAINER_PAIRS));

function skipQuotedString(s: string, start: number): number {
  if (s.startsWith('"""', start) || s.startsWith("'''", start)) {
    const delim = s.slice(start, start + 3);
    let i = start + 3;
    while (i < s.length) {
      if (s.startsWith(delim, i)) { return i + 3; }
      i++;
    }
    return s.length;
  }
  const quote = s[start];
  let i = start + 1;
  while (i < s.length) {
    if (s[i] === '\\') { i += 2; continue; }
    if (s[i] === quote) { return i + 1; }
    i++;
  }
  return s.length;
}

function findContainerEnd(s: string, start: number): number | null {
  const expectedClose = CONTAINER_PAIRS[s[start]];
  if (!expectedClose) { return null; }
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'") {
      i = skipQuotedString(s, i) - 1;
      continue;
    }
    if (CONTAINER_OPENERS.has(c)) { depth++; }
    else if (CONTAINER_CLOSERS.has(c)) {
      depth--;
      if (depth === 0 && c === expectedClose) { return i; }
    }
  }
  return null;
}

function isListTupleOrDict(atom: PyType): boolean {
  return atom instanceof Map || Array.isArray(atom);
}

/** Canonicalize list/tuple/dict values for stable repr (dict key order). */
function canonicalizeContainerAtom(atom: PyType): PyType {
  if (atom instanceof Map) {
    const entries = [...atom.entries()]
      .sort(([ka], [kb]) => toPyAtom(ka).localeCompare(toPyAtom(kb)))
      .map(([k, v]) => [canonicalizeContainerAtom(k), canonicalizeContainerAtom(v)] as [Immutable, PyType]);
    return new Map(entries);
  }
  if (Array.isArray(atom)) {
    const items = atom.map(canonicalizeContainerAtom);
    return Object.isFrozen(atom) ? Object.freeze(items) as Tuple<PyType> : items;
  }
  return atom;
}

function tryNormalizeContainerSubstring(substr: string): string | null {
  try {
    const [atom, rem] = parsePyAtom(substr);
    if (rem.trim() !== '' || !isListTupleOrDict(atom)) { return null; }
    return toPyAtom(canonicalizeContainerAtom(atom));
  } catch {
    return null;
  }
}

/**
 * Normalize list, tuple, and dict substrings in printed output for lenient comparison.
 * Valid container substrings are parsed with parsePyAtom() and re-formatted with toPyAtom();
 * dict keys are sorted so order does not matter. Unparseable substrings are left unchanged.
 */
export function normalizeOutputContainers(s: string): string {
  let result = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"' || c === "'") {
      const end = skipQuotedString(s, i);
      result += s.slice(i, end);
      i = end;
      continue;
    }
    if (CONTAINER_OPENERS.has(c)) {
      const end = findContainerEnd(s, i);
      if (end !== null) {
        const normalized = tryNormalizeContainerSubstring(s.slice(i, end + 1));
        if (normalized !== null) {
          result += normalized;
          i = end + 1;
          continue;
        }
      }
    }
    result += c;
    i++;
  }
  return result;
}

// Convert a boolean to a Python boolean string (True/False) - subset of toPyAtom()
export function toPyBool(a: boolean): string { return a ? 'True' : 'False'; }

// Convert a number to a Python float string (including special floats: float('inf'), float('nan'), ...)
// Mostly a subset of toPyAtom() except for handling number of decimal places
export function toPyFloat(a: number, decimals: number = -1): string {
  if (a === Infinity) { return 'float("inf")'; }
  if (a === -Infinity) { return 'float("-inf")'; }
  if (isNaN(a)) { return 'float("nan")'; }
  if (decimals < 0) { return a.toLocaleString('en-US', { minimumFractionDigits: 1 }); }
  return a.toFixed(decimals);
}

// Convert a string to a Python string string (including escaped quotes)
// Mostly a subset of toPyAtom() except for random choice of double or single quotes
export function toPyStr(a: string): string {
  if (a.includes("'")) {
    if (a.includes('"')) { return JSON5.stringify(a); }
    return `"${a}"`;
  }
  if (a.includes('"')) { return `'${a}'`; }
  return Math.random() > 0.5 ? `"${a}"` : `'${a}'`;
}


// Make functions available in the browser console
declare global {
  interface Window {
    parsePyAtom: typeof parsePyAtom;
    toPyAtom: typeof toPyAtom;
    runLastLine: typeof runLastLine;
    runGrabOutput: typeof runGrabOutput;
    addInput: typeof addInput;
    setInput: typeof setInput;
    getInput: typeof getInput;
    resetGlobals: typeof resetGlobals;
    python: typeof python;
    getPythonLoadPromise: typeof getPythonLoadPromise;
    isPythonLoaded: typeof isPythonLoaded;
  }
}
window.parsePyAtom = parsePyAtom;
window.toPyAtom = toPyAtom;
window.runLastLine = runLastLine;
window.runGrabOutput = runGrabOutput;
window.addInput = addInput;
window.setInput = setInput;
window.getInput = getInput;
window.resetGlobals = resetGlobals;
window.python = python;
window.getPythonLoadPromise = getPythonLoadPromise;
window.isPythonLoaded = isPythonLoaded;
