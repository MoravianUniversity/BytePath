import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, CodeWriteSubtopic, CodeWriteQuestionGen, TopicContext } from '../topics';
import { randChoice, randChoices, randBool, randVars, randInt, randInts, randIntNum, shuffle, capitalize, ASCII_LOWER, DIGITS } from '../util';
import { toPyStr } from '../python';
import dedent from 'dedent-js';
import { BASIC_ARITHMETIC } from './BasicArithmetic';
import { BASIC_VARIABLES } from './BasicVariables';
import { STRING_INDEX } from './StringIndexing';
import { STRING_LENGTH } from './StringLength';
import { BASIC_PRINTS } from './BasicPrints';
import { MEMBERSHIP_OPERATORS } from './MembershipOperator';
import { STRING_SLICING } from './StringSlicing';
import { STRING_NEG_INDEX } from './StringNegIndex';
import { STRING_CONCAT } from './StringConcat';
import { STRING_METHODS } from './StringMethods';
import { SPLITTING_AND_JOINING } from './SplittingAndJoining';
import { F_STRINGS } from './FStrings';

const STRINGS = [
  "Hello World", "Moravian Univ", "The String", "Intro CS", "Time Flies",
  "Think Big", "Keep Calm", "Fizzle Out", "Hocus Pocus", "Just Do It",
]
const ANIMALS = ["cat", "dog", "bee", "fox", "bat", "cow", "pig", "rat", "eel", "ant", "hen"]
// Mixed lengths so find() is not always 3. Still short enough to count by hand.
const TOKENS = [...ANIMALS, "ox", "frog", "lion", "bear", "wolf", "duck", "crab", "goat", "deer", "hawk", "fish"]
const SEPARATORS = [...":-_.="]
const VAR_NAMES_SHORT = ["a", "b", "c", "d", "s", "x", "y", "z"];
const VAR_NAMES_LONG = ["foo", "bar", "baz", "qux", "quux"];

function swapCase(c: string): string {
  const lower = c.toLowerCase();
  return c === lower ? c.toUpperCase() : lower;
}

/** A character for an `in` test: usually obvious, sometimes the wrong case. */
function membershipChar(word: string): string {
  const roll = Math.random();
  if (roll < 0.4) {
    return randChoice([...word]);
  }
  if (roll < 0.7) {
    const flipped = [...word].filter(c => !word.includes(swapCase(c))).map(swapCase);
    if (flipped.length > 0) {
      return randChoice(flipped);
    }
  }
  return randChoice(ASCII_LOWER.filter(c => !word.toLowerCase().includes(c)));
}

class StringMasteryContext extends TopicContext {
  var1: string;
  var2: string;
  var3: string;
  str: string;
  int1: bigint;
  int2: bigint;
  start: bigint;
  stop: bigint;
  constructor() {
    super();
    [this.var1, this.var2, this.var3] = randVars(3);
    this.str = randChoice(STRINGS);
    this.int1 = randInt(1n, 3n);
    [this.start, this.stop] = randInts(2n, BigInt(this.str.length - 2), 2);
    if (this.start > this.stop) { [this.start, this.stop] = [this.stop, this.start]; }
    this.int2 = this.stop;
    this.sharedCode = dedent`
      ${this.var1} = ${this.int1}
      ${this.var2} = ${this.int2}
      ${this.var3} = ${toPyStr(this.str)}
    `;
  }
}

/** Variables for the second reading question: a capitalized animal and two small ints. */
class StringMasteryRead2Context extends TopicContext {
  var1: string;
  var2: string;
  var3: string;
  word: string;
  constructor() {
    super();
    [this.var1, this.var2, this.var3] = randVars(3);
    this.word = capitalize(randChoice(ANIMALS));
    const [int1, int2] = randInts(2n, 5n, 2);
    this.sharedCode = dedent`
      ${this.var1} = ${int1}
      ${this.var2} = ${int2}
      ${this.var3} = ${toPyStr(this.word)}
    `;
  }
}

class StringsMastery_1 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The length of a string is the actual number of characters in the string (one more than the index of the last character).' }];
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string { return `len(${ctx.var3})`; }
}
class StringsMastery_2 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'Negative indexing starts from the end of the string, with -1 being the last character.' }];
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string { return `${ctx.var3}[-1]`; }
}
class StringsMastery_3 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'Gets a single character from the string at the given index, starting at index 0.' }];
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string { return `${ctx.var3}[${ctx.var1}]`; }
}
class StringsMastery_4 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'When slicing, copy between the start index (inclusive) and stop index (exclusive), stopping before the last character in the slice.' }];
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string { return `${ctx.var3}[${ctx.start}:${ctx.var2}]`; }
}
class StringsMastery_5 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'When slicing, copy between the start index (inclusive) and stop index (exclusive), stopping before the last character in the slice. A missing start index means the slice starts at the beginning of the string. A missing stop index means the slice goes to the end of the string.' }];
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string { return `${ctx.var3}[:${ctx.start}] + ${ctx.var3}[${ctx.var2}:]`; }
}
class StringsMastery_6 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The membership operator checks if a character or substring is in a string.' }];
  readonly contextConstructor = StringMasteryRead2Context;
  gen(ctx: StringMasteryRead2Context): string {
    const char = membershipChar(ctx.word);
    return `${toPyStr(char)} ${randChoice(["not ", ""])}in ${ctx.var3}`;
  }
}
class StringsMastery_7 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The comparison operators can be used to compare strings. The comparison is done lexicographically, i.e. alphabetically with "a" < "b" < "c" < ... < "z".' }];
  readonly contextConstructor = StringMasteryRead2Context;
  gen(): string {
    let [ch1, ch2] = randChoices(ASCII_LOWER, 2);
    if (randBool()) { ch1 = ch2 + ch1; }
    return `${toPyStr(ch1)} ${randChoice(["<", ">", "<=", ">="])} ${toPyStr(ch2)}`;
  }
}
class StringsMastery_8 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The f-string allows you to embed variables and expressions in a string. Be very careful with the { } symbols, that is when substitutions happens.' }];
  readonly contextConstructor = StringMasteryRead2Context;
  gen(ctx: StringMasteryRead2Context): string {
    const var_f = randBool() ? `{${ctx.var3}}` : ctx.var3
    const add_f = randBool() ? `{${ctx.var1}}+{${ctx.var2}}` : `{${ctx.var1}+${ctx.var2}}`
    return `f'${var_f} ${add_f}'`;
  }
}
class StringsMastery_9 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The lower() and upper() methods convert a string to lowercase or uppercase, respectively.' }];
  readonly contextConstructor = StringMasteryRead2Context;
  gen(ctx: StringMasteryRead2Context): string { return `${ctx.var3}.${randChoice(['lower', 'upper'])}()`; }
}
class StringsMastery_10 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The isdigit() method checks if a string is all digits (it does not include the negative sign or decimal point).' }];
  readonly contextConstructor = StringMasteryRead2Context;
  gen(): string {
    const digits = randChoices(DIGITS, 2, false).join("");
    const value = randBool() ? digits : digits + randChoice(ASCII_LOWER);
    return `${toPyStr(value)}.isdigit()`;
  }
}
class StringsMastery_11 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The find() and index() methods find the first occurrence of a substring in a string.' }];
  readonly contextConstructor = StringMasteryRead2Context;
  gen(ctx: StringMasteryRead2Context): string {
    return `${ctx.var3}.${randChoice(['find', 'index'])}(${toPyStr(randChoice([...ctx.word]))})`;
  }
}
class StringsMastery_12 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The replace() method replaces all occurrences of a substring with a new substring.' }];
  readonly contextConstructor = StringMasteryRead2Context;
  gen(ctx: StringMasteryRead2Context): string {
    const present = randChoice([...(ctx.word + ctx.word + ctx.word.toLowerCase() + ctx.word.toUpperCase())]);
    const replacement = randChoice(ASCII_LOWER.filter(c => !ctx.word.toLowerCase().includes(c)));
    return `${ctx.var3}.replace(${toPyStr(present)}, ${toPyStr(replacement)})`;
  }
}

class StringsMastery_Long_1 extends CodeOutputSubtopic {
  readonly showWorkspace = true;
  gen(): string {
    const sep = randChoice(SEPARATORS);
    const [var1, var2] = randVars(2);

    const tokens = randChoices(TOKENS, randIntNum(2, 4));
    const string_val = tokens.join(sep);
    // [:i] and [i+1:] are the common cases; the other two still show up.
    const sliced = randChoice([
        `${var1}[:${var2}]`,
        `${var1}[:${var2}]`,
        `${var1}[${var2}+1:]`,
        `${var1}[${var2}+1:]`,
        `${var1}[:${var2}+1]`,
        `${var1}[${var2}:]`,
    ]);
    const [quote, opp_quote] = randChoices(['"', "'"], 2);
    return dedent`
        ${var1} = ${toPyStr(string_val)}
        ${var2} = ${var1}.find(${toPyStr(sep)})
        print(f${opp_quote}{${var2}}\\n\\${quote}{${sliced}}\\${quote}${opp_quote})
    `;
  }
}

class StringsMastery_Long_2 extends CodeOutputSubtopic {
  readonly showWorkspace = true;
  gen(): string {
    // Doubled so the two separators are usually different but can match.
    const [sep1, sep2] = randChoices([...SEPARATORS, ...SEPARATORS], 2);
    const [var1, var2, var3, var4] = randVars(4);
    const animals = ANIMALS.map(animal => capitalize(animal));
    shuffle(animals);
    const count1 = randIntNum(2, 3);
    const count2 = randIntNum(2, 3);
    const val1 = animals.slice(0, count1).join(sep1);
    const val2 = animals.slice(count1, count1+count2).join(sep2);
    return dedent`
        ${var1} = ${toPyStr(val1)}.${randChoice(['upper', 'lower'])}()
        ${var2} = ${toPyStr(val2)}.${randChoice(['upper', 'lower'])}()
        ${var3} = ${var1} + ${toPyStr(randChoice([sep1, sep2]))} + ${var2}
        ${var4} = ${var3}.split(${toPyStr(randChoice([sep1, sep2]))})
        print(len(${var4}), ${var3})
    `;
  }
}

function filler(n: number, avoid: string[]): string {
  const alphabet = [..."abcdefghijklmnopqrstuvwxyz"].filter(c => !avoid.includes(c));
  return Array.from({ length: n }, (_, i) => alphabet[i % alphabet.length]).join("");
}

class StringsMastery_Write extends CodeWriteSubtopic {
  gen(): CodeWriteQuestionGen {
    const varName = randChoice(VAR_NAMES_LONG);
    const size = randIntNum(2, 4);
    const [other, replacement] = randChoices(VAR_NAMES_SHORT, 2);
    const otherLit = `'${other}'`;
    const replacementLit = `'${replacement}'`;
    const pad = filler(size + 3, [other]);

    const inLast = (): CodeWriteQuestionGen => {
      const values = [pad + other, other + pad, pad];
      return {
        prompt: `Write the code to check if \`${otherLit}\` is within the last ${size} characters of the string variable \`${varName}\`.`,
        correct: `${otherLit} in ${varName}[-${size}:]`,
        variables: [varName],
        testCases: values.map(value => ({
          values: [value],
          expected: value.slice(-size).includes(other),
        })),
      };
    };
    const notInFirst = (): CodeWriteQuestionGen => {
      const values = [other + pad, pad.slice(0, size) + other + pad.slice(size), pad];
      return {
        prompt: `Write the code to check if \`${otherLit}\` is not within the first ${size} characters of the string variable \`${varName}\`.`,
        correct: `${otherLit} not in ${varName}[:${size}]`,
        variables: [varName],
        testCases: values.map(value => ({
          values: [value],
          expected: !value.slice(0, size).includes(other),
        })),
      };
    };
    const strip = (): CodeWriteQuestionGen => {
      const values = ["  a  b  ", "\tHello\n", "   "];
      return {
        prompt: `Write the code to remove all leading and trailing whitespace from the string variable \`${varName}\`.`,
        correct: `${varName}.strip()`,
        variables: [varName],
        testCases: values.map(value => ({ values: [value], expected: value.trim() })),
      };
    };
    const replace = (): CodeWriteQuestionGen => {
      const body = filler(3, [other, replacement]);
      const values = [other + body + other + other, body, body + other + body];
      return {
        prompt: `Write the code to replace every ${otherLit} with ${replacementLit} in the string variable \`${varName}\`.`,
        correct: `${varName}.replace(${otherLit}, ${replacementLit})`,
        variables: [varName],
        testCases: values.map(value => ({
          values: [value],
          expected: value.replaceAll(other, replacement),
        })),
      };
    };
    const find = (): CodeWriteQuestionGen => {
      const body = filler(3, [other]);
      const values = [other + body + other, body + other + body, body + body + other];
      return {
        prompt: `Write the code to get the location of the first ${otherLit} in the string variable \`${varName}\`.`,
        correct: `${varName}.find(${otherLit}) or ${varName}.index(${otherLit})`,
        variables: [varName],
        testCases: values.map(value => ({
          values: [value],
          expected: BigInt(value.indexOf(other)),
        })),
      };
    };
    const upper = (): CodeWriteQuestionGen => {
      const values = [other + filler(size + 4, []), filler(2, []) + other + filler(size + 2, [])];
      return {
        prompt: `Write the code to get the first ${size} characters of the string variable \`${varName}\` as uppercase.`,
        correct: `${varName}[:${size}].upper()`,
        variables: [varName],
        testCases: values.map(value => ({
          values: [value],
          expected: value.slice(0, size).toUpperCase(),
        })),
      };
    };

    // Duplicates match the quiz weights for the membership and strip prompts.
    return randChoice([inLast, inLast, notInFirst, strip, strip, replace, find, upper])();
  }
}

export const STRINGS_MASTERY = new Topic('strings-mastery', 'Strings Mastery', [
    new StringsMastery_1(),
    new StringsMastery_2(),
    new StringsMastery_3(),
    new StringsMastery_4(),
    new StringsMastery_5(),
    new StringsMastery_6(),
    new StringsMastery_7(),
    new StringsMastery_8(),
    new StringsMastery_9(),
    new StringsMastery_10(),
    new StringsMastery_11(),
    new StringsMastery_12(),
    new StringsMastery_Write(),
    new StringsMastery_Long_1(),
    new StringsMastery_Long_2(),
  ], [
      BASIC_ARITHMETIC, BASIC_VARIABLES, BASIC_PRINTS, STRING_LENGTH, STRING_CONCAT, STRING_INDEX,
      STRING_SLICING, STRING_NEG_INDEX, MEMBERSHIP_OPERATORS, STRING_METHODS, SPLITTING_AND_JOINING, F_STRINGS,
  ], {order: 'sequential', forceQuiz: true, skippable: true}
);
