import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, TopicContext } from '../topics';
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

class StringsMastery_1 extends EvalLastLineSubtopic {
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string { return `len(${ctx.var3})`; }
}
class StringsMastery_2 extends EvalLastLineSubtopic {
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string { return `${ctx.var3}[-1]`; }
}
class StringsMastery_3 extends EvalLastLineSubtopic {
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string { return `${ctx.var3}[${ctx.var1}]`; }
}
class StringsMastery_4 extends EvalLastLineSubtopic {
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string { return `${ctx.var3}[${ctx.start}:${ctx.var2}]`; }
}
class StringsMastery_5 extends EvalLastLineSubtopic {
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string { return `${ctx.var3}[:${ctx.start}] + ${ctx.var3}[${ctx.var2}:]`; }
}
class StringsMastery_6 extends EvalLastLineSubtopic {
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string {
    const char = randChoice([
      ...ASCII_LETTERS,
      ...ctx.str.toLowerCase(),
      ...ctx.str.toUpperCase(),
      ...ctx.str.toLowerCase(),
      ...ctx.str.toUpperCase(),
      ...ctx.str.toLowerCase(),
      ...ctx.str.toUpperCase(),
    ]);
    return `${toPyStr(char)} ${randChoice(["not ", ""])}in ${ctx.var3}`;
  }
}
class StringsMastery_7 extends EvalLastLineSubtopic {
  gen(): string {
    let ch1 = randChoice(ASCII_LOWER);
    let ch2 = randChoice(ASCII_LOWER);
    while (ch1 === ch2) { ch2 = randChoice(ASCII_LOWER); }
    if (randBool()) { ch1 = ch2 + ch1; }
    return `${toPyStr(ch1)} ${randChoice(["<", ">", "<=", ">="])} ${toPyStr(ch2)}`;
  }
}
class StringsMastery_8 extends EvalLastLineSubtopic {
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string {
    const var_f = randBool() ? `{${ctx.var3}}` : ctx.var3
    const add_f = randBool() ? `{${ctx.var1}}+{${ctx.var2}}` : `{${ctx.var1}+${ctx.var2}}`
    return `f"${var_f} ${add_f}"`;
  }
}
class StringsMastery_9 extends EvalLastLineSubtopic {
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string { return randBool() ? `${ctx.var3}.lower()` : `${ctx.var3}.upper()`; }
}
class StringsMastery_10 extends EvalLastLineSubtopic {
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string { return `${toPyStr(randChoices([...DIGITS, ...ctx.var1, ...ctx.var2], 3).join(""))}.isdigit()`; }
}
class StringsMastery_11 extends EvalLastLineSubtopic {
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string { return `${ctx.var3}.${randChoice(['find', 'index'])}(${toPyStr(randChoice([...ctx.str]))})`; }
}
class StringsMastery_12 extends EvalLastLineSubtopic {
  readonly contextConstructor = StringMasteryContext;
  gen(ctx: StringMasteryContext): string {
    const char = randChoice([
      ...ctx.str.toLowerCase(),
      ...ctx.str.toUpperCase(),
    ]);
    return `${ctx.var3}.replace(${toPyStr(char)}, ${toPyStr(randChoice(ASCII_LETTERS))})`;
  }
}

class StringsMastery_Long_1 extends CodeOutputSubtopic {
  gen(): string {
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
    return dedent`
        ${var1} = ${toPyStr(string_val)}
        ${var2} = ${var1}.find(${toPyStr(sep)})
        print(f${opp_quote}{${var2}}\\n\\${quote}{${sliced}}\\${quote}${opp_quote})
    `;
  }
}

class StringsMastery_Long_2 extends CodeOutputSubtopic {
  gen(): string {
    const [sep1, sep2] = randChoices([...":-_.=+/"], 2);
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
    new StringsMastery_Long_1(),
    new StringsMastery_Long_2(),
  ], [
      BASIC_ARITHMETIC, BASIC_VARIABLES, BASIC_PRINTS, STRING_LENGTH, STRING_CONCAT, STRING_INDEX,
      STRING_SLICING, STRING_NEG_INDEX, MEMBERSHIP_OPERATORS, STRING_METHODS, SPLITTING_AND_JOINING, F_STRINGS,
  ], {order: 'sequential', forceQuiz: true}
);
