import { Topic, createQuestion, EvalLastLineSubtopic, CodeOutputSubtopic, GenerateContext } from '../topics';
import { randChoice, randChoices, randBool, randVars, randInt, randInts, randIntNum, shuffle, capitalize, ASCII_LETTERS, ASCII_LOWER, DIGITS } from '../util';
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

function createVarsVals(): [string[], [bigint, bigint, string], {start: bigint, stop: bigint, word: string}] {
  const [var1, var2, var3] = randVars(3);
  const str = randChoice(STRINGS);
  const word = capitalize(randChoice(ANIMALS));
  const int1 = randInt(1n, 3n);
  let [start, stop] = randInts(2n, BigInt(str.length - 2), 2);
  if (start > stop) { [start, stop] = [stop, start]; }
  const int2 = stop;
  return [[var1, var2, var3], [int1, int2, str], {start, stop, word}];
}
function createCode(vars: string[], vals: [bigint, bigint, string]): string {
  const [var1, var2, var3] = vars;
  const [int1, int2, str] = vals;
  return dedent`
    ${var1} = ${int1}
    ${var2} = ${int2}
    ${var3} = ${toPyStr(str)}
  `;
}

class StringsMastery extends Topic {
  vars: string[];
  vals: [bigint, bigint, string];
  values: {start: bigint, stop: bigint, word: string};
  constructor() {
    const [vars, vals, values] = createVarsVals();
    const code = createCode(vars, vals);
    super('strings-mastery', 'Strings Mastery', [
      new StringsMastery_1(vars, vals, values, code),
      new StringsMastery_2(vars, vals, values, code),
      new StringsMastery_3(vars, vals, values, code),
      new StringsMastery_4(vars, vals, values, code),
      new StringsMastery_5(vars, vals, values, code),
      new StringsMastery_6(vars, vals, values, code),
      new StringsMastery_7(vars, vals, values, code),
      new StringsMastery_8(vars, vals, values, code),
      new StringsMastery_9(vars, vals, values, code),
      new StringsMastery_10(vars, vals, values, code),
      new StringsMastery_11(vars, vals, values, code),
      new StringsMastery_12(vars, vals, values, code),
      new StringsMastery_Long_1(),
      new StringsMastery_Long_2(),
    ], [
        BASIC_ARITHMETIC, BASIC_VARIABLES, BASIC_PRINTS, STRING_LENGTH, STRING_CONCAT, STRING_INDEX,
        STRING_SLICING, STRING_NEG_INDEX, MEMBERSHIP_OPERATORS, STRING_METHODS, SPLITTING_AND_JOINING, F_STRINGS,
    ], {order: 'sequential', sharedCode: code, forceQuiz: true});
    this.vars = vars;
    this.vals = vals;
    this.values = values;
  }

  start(): void {
    const [vars, vals, values] = createVarsVals();
    this.vars.splice(0, this.vars.length, ...vars);
    this.vals.splice(0, this.vals.length, ...vals);
    this.values.start = values.start;
    this.values.stop = values.stop;
    this.values.word = values.word;
    this.sharedCode = createCode(vars, vals);
    for (const subtopic of this.subtopics) {
      if (subtopic instanceof StringsMasteryBase) {
        subtopic.sharedCode = this.sharedCode;
      }
    }
  }
}

abstract class StringsMasteryBase extends EvalLastLineSubtopic {
  vars: string[];
  vals: [bigint, bigint, string];
  values: {start: bigint, stop: bigint, word: string};
  sharedCode: string;
  constructor(vars: string[], vals: [bigint, bigint, string], values: {start: bigint, stop: bigint, word: string}, sharedCode: string) {
    super(); this.vars = vars; this.vals = vals; this.values = values; this.sharedCode = sharedCode;
  }
  generateQuestion(ctx: GenerateContext) {
    const code = this.genCode();
    return createQuestion(code, [], {sharedCode: this.sharedCode}, ctx);
  }
  abstract genCode(): string
}

class StringsMastery_1 extends StringsMasteryBase {
  genCode(): string { return `len(${this.vars[2]})`; }
}
class StringsMastery_2 extends StringsMasteryBase {
  genCode(): string { return `${this.vars[2]}[-1]`; }
}
class StringsMastery_3 extends StringsMasteryBase {
  genCode(): string { return `${this.vars[2]}[${this.vars[0]}]`; }
}
class StringsMastery_4 extends StringsMasteryBase {
  genCode(): string { return `${this.vars[2]}[${this.values.start}:${this.vars[1]}]`; }
}
class StringsMastery_5 extends StringsMasteryBase {
  genCode(): string { return `${this.vars[2]}[:${this.values.start}] + ${this.vars[2]}[${this.vars[1]}:]`; }
}
class StringsMastery_6 extends StringsMasteryBase {
  genCode(): string {
    const char = randChoice([
      ...ASCII_LETTERS,
      ...this.vals[2].toLowerCase(),
      ...this.vals[2].toUpperCase(),
      ...this.vals[2].toLowerCase(),
      ...this.vals[2].toUpperCase(),
      ...this.vals[2].toLowerCase(),
      ...this.vals[2].toUpperCase(),
    ]);
    return `${toPyStr(char)} ${randChoice(["not ", ""])}in ${this.vars[2]}`;
  }
}
class StringsMastery_7 extends StringsMasteryBase {
  genCode(): string {
    let ch1 = randChoice(ASCII_LOWER);
    let ch2 = randChoice(ASCII_LOWER);
    while (ch1 === ch2) { ch2 = randChoice(ASCII_LOWER); }
    if (randBool()) { ch1 = ch2 + ch1; }
    return `${toPyStr(ch1)} ${randChoice(["<", ">", "<=", ">="])} ${toPyStr(ch2)}`;
  }
}
class StringsMastery_8 extends StringsMasteryBase {
  genCode(): string {
    const var_f = randBool() ? `{${this.vars[2]}}` : this.vars[2]
    const add_f = randBool() ? `{${this.vars[0]}}+{${this.vars[1]}}` : `{${this.vars[0]}+${this.vars[1]}}`
    return `f"${var_f} ${add_f}"`;
  }
}
class StringsMastery_9 extends StringsMasteryBase {
  genCode(): string { return randBool() ? `${this.vars[2]}.lower()` : `${this.vars[2]}.upper()`; }
}
class StringsMastery_10 extends StringsMasteryBase {
  genCode(): string { return `${toPyStr(randChoices([...DIGITS, ...this.vars[0], ...this.vars[1]], 3).join(""))}.isdigit()`; }
}
class StringsMastery_11 extends StringsMasteryBase {
  genCode(): string { return `${this.vars[2]}.${randChoice(['find', 'index'])}(${toPyStr(randChoice([...this.vals[2]]))})`; }
}
class StringsMastery_12 extends StringsMasteryBase {
  genCode(): string {
    const char = randChoice([
      ...this.vals[2].toLowerCase(),
      ...this.vals[2].toUpperCase(),
    ]);
    return `${this.vars[2]}.replace(${toPyStr(char)}, ${toPyStr(randChoice(ASCII_LETTERS))})`;
  }
}

class StringsMastery_Long_1 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const sep = randChoice([...":-_.=+/"]);
    const [var1, var2] = randVars(2);
    const animals = randChoices(ANIMALS, randIntNum(2, 4));
    const string_val = animals.join(sep);
    const sliced = randChoice([
        `${var1}[:${var2}]`,
        `${var1}[:${var2}+1]`,
        `${var1}[${var2}:]`,
        `${var1}[${var2}+1:]`,
    ]);
    const [quote, opp_quote] = randChoices(['"', "'"], 2);
    const code = dedent`
        ${var1} = ${toPyStr(string_val)}
        ${var2} = ${var1}.find(${toPyStr(sep)})
        print(f${opp_quote}{${var2}}\\n\\${quote}{${sliced}}\\${quote}${opp_quote})
    `;
    return createQuestion(code, [], {usesOutput: true}, ctx);
  }
}

class StringsMastery_Long_2 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [sep1, sep2] = randChoices([...":-_.=+/"], 2);
    const [var1, var2, var3, var4] = randVars(4);
    const animals = ANIMALS.map(animal => capitalize(animal));
    shuffle(animals);
    const count1 = randIntNum(2, 3);
    const count2 = randIntNum(2, 3);
    const val1 = animals.slice(0, count1).join(sep1);
    const val2 = animals.slice(count1, count1+count2).join(sep2);
    const code = dedent`
        ${var1} = ${toPyStr(val1)}.${randChoice(['upper', 'lower'])}()
        ${var2} = ${toPyStr(val2)}.${randChoice(['upper', 'lower'])}()
        ${var3} = ${var1} + ${toPyStr(randChoice([sep1, sep2]))} + ${var2}
        ${var4} = ${var3}.split(${toPyStr(randChoice([sep1, sep2]))})
        print(len(${var4}), ${var3})
    `;
    return createQuestion(code, [], {usesOutput: true}, ctx);
  }
}

export const STRINGS_MASTERY = new StringsMastery();
