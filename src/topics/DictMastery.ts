import { Topic, EvalLastLineSubtopic, CodeWriteSubtopic, CodeWriteQuestionGen, ConceptualSubtopic, ConceptualQuestionGen, TopicContext } from '../topics';
import { randInts, randIntNum, randChoice, randChoices, randVars, range, shuffle, randBool, ASCII_LOWER, ASCII_UPPER } from '../util';
import { toPyStr, toPyAtom, PyType, Immutable } from '../python.ts';
import { DICT_BASICS } from './DictionaryBasics';
import { DICT_WITH_LOOPS } from './DictionaryWithLoops';
import dedent from 'dedent-js';

const ANIMALS = ["cat", "dog", "bird", "fish", "snake", "duck", "cow", "pig"]
const VAR_NAMES_LONG = ["foo", "bar", "baz", "qux", "quux"];
const IMMUTABLE_TYPES = new Set(["bool", "int", "float", "str", "tuple"]);

class DictMasteryContext extends TopicContext {
  var1: string;
  var2: string;
  var3: string;
  var4: string;
  int1: bigint;
  int2: bigint;
  str1: string;
  str2: string;
  constructor() {
    super();
    const [var1, var2, var3, var4] = randVars(4);
    let [int1, int2] = randInts(2n, 5n, 2);
    if (int1 > int2) { [int1, int2] = [int2, int1]; }
    const [str1, str2] = randChoices(ANIMALS, 2);
    this.var1 = var1;
    this.var2 = var2;
    this.var3 = var3;
    this.var4 = var4;
    this.int1 = int1;
    this.int2 = int2;
    this.str1 = str1;
    this.str2 = str2;
    this.sharedCode = dedent`
      ${var1} = ${int1}
      ${var2} = ${int2}
      ${var3} = ${toPyStr(str1)}
      ${var4} = {${toPyStr(var1)}: (${int1}, ${int2}), ${int1}: ${toPyStr(str2)}, ${var2}: ${toPyStr(str1)}, ${var3}: ${int1}}
    `;
  }
}

class DictMastery_1 extends EvalLastLineSubtopic {
  readonly contextConstructor = DictMasteryContext;
  gen(ctx: DictMasteryContext): string { return `len(${ctx.var4})`; }
}
class DictMastery_2 extends EvalLastLineSubtopic {
  readonly contextConstructor = DictMasteryContext;
  gen(ctx: DictMasteryContext): string { return `${ctx.var4}[toPyStr(${ctx.var1})]`; }
}
class DictMastery_3 extends EvalLastLineSubtopic {
  readonly contextConstructor = DictMasteryContext;
  gen(ctx: DictMasteryContext): string { return `${ctx.var4}[${ctx.var1}]`; }
}
class DictMastery_4 extends EvalLastLineSubtopic {
  readonly contextConstructor = DictMasteryContext;
  gen(ctx: DictMasteryContext): string { return `${ctx.var4}[${ctx.int1}]`; }
}
class DictMastery_5 extends EvalLastLineSubtopic {
  readonly contextConstructor = DictMasteryContext;
  gen(ctx: DictMasteryContext): string { return `${ctx.var2} in ${ctx.var4}`; }
}
class DictMastery_6 extends EvalLastLineSubtopic {
  readonly contextConstructor = DictMasteryContext;
  gen(ctx: DictMasteryContext): string { return `${toPyStr(ctx.var2)} in ${ctx.var4}`; }
}
class DictMastery_7 extends EvalLastLineSubtopic {
  readonly contextConstructor = DictMasteryContext;
  gen(ctx: DictMasteryContext): string { return `${ctx.var3} in ${ctx.var4}`; }
}
class DictMastery_8 extends EvalLastLineSubtopic {
  readonly contextConstructor = DictMasteryContext;
  gen(ctx: DictMasteryContext): string { return `${toPyStr(ctx.str1)} in ${ctx.var4}`; }
}

function sample_with_repeats<T>(data: T[],
  min_uniq: number, max_uniq: number,
  min_repeat: number, max_repeat: number): T[]
{
  data = randChoices(data, randIntNum(min_uniq, max_uniq));
  max_repeat = Math.min(max_repeat, data.length);
  const repeats = new Array(100).fill(data).flat();
  return shuffle([...data, ...randChoices(repeats, randIntNum(min_repeat, max_repeat), false)]);
}

class DictMastery_Write extends CodeWriteSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 1,
      message: 'Write only the condition expression — do not include `if` or a trailing `:`. Use `len(...)`, `in` / `not in`, and `and` / `or` to combine parts.',
    },
  ];
  gen(): CodeWriteQuestionGen {
    const varName = randChoice(VAR_NAMES_LONG);
    const count = randIntNum(2, 6);
    const value = randChoice(ANIMALS);
    const valueLit = toPyStr(value);
    const pre = `Write the condition (just the condition, not the \`if\` or the \`:\`) for checking if the \`dict\` variable \`${varName}\``;
    const others = ANIMALS.filter(a => a !== value);
    const dictWith = (...keys: (string | bigint)[]) =>
      new Map<Immutable, PyType>(keys.map(k => [k, 0n]));
    const take = (n: number) => others.slice(0, n);

    return randChoice([
      (): CodeWriteQuestionGen => ({
        prompt: `${pre} has at least \`${count}\` key-value pairs and it has the key \`${valueLit}\`.`,
        correct: `len(${varName}) >= ${count} and ${valueLit} in ${varName}`,
        options: [
          `len(${varName}) >= ${count} or ${valueLit} in ${varName}`,
          `len(${varName}) > ${count} and ${valueLit} in ${varName}`,
          `len(${varName}) >= ${count} and ${valueLit} not in ${varName}`,
          `len(${varName}) <= ${count} and ${valueLit} in ${varName}`,
        ],
        variables: [varName],
        testCases: [
          { values: [dictWith(value, ...take(count - 1))], expected: true },
          { values: [dictWith(value, ...take(count))], expected: true },
          { values: [dictWith(...take(count))], expected: false },
          { values: [dictWith(value, ...take(Math.max(0, count - 2)))], expected: false },
        ],
      }),
      (): CodeWriteQuestionGen => ({
        prompt: `${pre} has at most \`${count}\` key-value pairs and it does not have the key \`${valueLit}\`.`,
        correct: `len(${varName}) <= ${count} and ${valueLit} not in ${varName}`,
        options: [
          `len(${varName}) <= ${count} and ${valueLit} in ${varName}`,
          `len(${varName}) < ${count} and ${valueLit} not in ${varName}`,
          `len(${varName}) <= ${count} or ${valueLit} not in ${varName}`,
          `len(${varName}) >= ${count} and ${valueLit} not in ${varName}`,
        ],
        variables: [varName],
        testCases: [
          { values: [dictWith(...take(count))], expected: true },
          { values: [dictWith(...take(Math.max(0, count - 1)))], expected: true },
          { values: [dictWith(...take(count + 1))], expected: false },
          { values: [dictWith(value, ...take(count - 1))], expected: false },
        ],
      }),
      (): CodeWriteQuestionGen => ({
        prompt: `${pre} has at least \`${count}\` key-value pairs or it has the key \`${valueLit}\`.`,
        correct: `len(${varName}) >= ${count} or ${valueLit} in ${varName}`,
        options: [
          `len(${varName}) >= ${count} and ${valueLit} in ${varName}`,
          `len(${varName}) > ${count} or ${valueLit} in ${varName}`,
          `len(${varName}) <= ${count} or ${valueLit} in ${varName}`,
          `len(${varName}) >= ${count} or ${valueLit} not in ${varName}`,
        ],
        variables: [varName],
        testCases: [
          { values: [dictWith(...take(count))], expected: true },
          { values: [dictWith(value, ...take(Math.max(0, count - 2)))], expected: true },
          { values: [dictWith(...take(Math.max(0, count - 1)))], expected: false },
          { values: [new Map()], expected: false },
        ],
      }),
      (): CodeWriteQuestionGen => ({
        prompt: `${pre} has the keys \`${valueLit}\` and \`${count}\`.`,
        correct: `${valueLit} in ${varName} and ${count} in ${varName}`,
        options: [
          `${valueLit} in ${varName} or ${count} in ${varName}`,
          `${valueLit} in ${varName} and ${toPyStr(String(count))} in ${varName}`,
          `len(${varName}) >= ${count} and ${valueLit} in ${varName}`,
          `${valueLit} in ${varName} and ${count} not in ${varName}`,
        ],
        variables: [varName],
        testCases: [
          { values: [dictWith(value, BigInt(count))], expected: true },
          { values: [dictWith(value, BigInt(count), ...take(1))], expected: true },
          { values: [dictWith(value)], expected: false },
          { values: [dictWith(BigInt(count))], expected: false },
          { values: [dictWith(...take(2))], expected: false },
        ],
      }),
    ])();
  }
}

class DictMastery_Long extends EvalLastLineSubtopic {
  readonly showWorkspace = true;
  gen(): string {
    const [var1, var2, i] = randVars(3);
    const elem1 = `${var1}[${i}]`;
    const elem2 = `${var2}[${i}]`;
    const style = 0; //randIntNum(0, 2);
    let data: string | bigint[] | Map<string, bigint|string>;
    let init: bigint | string;
    let init0: bigint | string;
    let add: string;
    if (style === 0) {
      // Counting - source is a string or list of ints
      if (randBool()) {
        data = sample_with_repeats(ASCII_LOWER, 3, 5, 1, 3).join("");  // 4 to 8
      } else {
        data = sample_with_repeats(range(0n, 9n), 2, 4, 1, 3);
      }
      init = 1n;
      init0 = 0n;
      add = " += 1";
    } else {
      // doesn't work yet
      let empty: string | bigint;
      let keyData: string[] | bigint[];
      if (randBool()) {
        keyData = ASCII_LOWER;
        empty = "";
      } else {
        keyData = range(0n, 9n);
        empty = 0n;
      }

      const values = sample_with_repeats<bigint|string>(keyData, 3, 5, 1, 3);
      const keys = randChoices(ASCII_UPPER, values.length);
      data = new Map();
      for (let i = 0; i < keys.length; i++) {
        data.set(keys[i], values[i]);
      }

      if (style === 1) {
        init = elem1;
        init0 = toPyAtom(empty);
        add = ` += ${elem1}`;
      } else {
        init = `[${elem1}]`;
        init0 = "[]";
        add = `append(${elem1}`;
      }
    }

    let code: string;
    if (randBool()) {
      code = `if ${i} in ${var2}:\n        ${elem2}${add}\n    else:\n        ${elem2} = ${init}`;
    } else {
      code = `if ${i} not in ${var2}:\n        ${elem2} = ${init0}\n    ${elem2}${add}`;
    }

    //data = textwrap.fill(repr(data), width=20, subsequent_indent="     ");
    return `${var1} = ${toPyAtom(data)}
${var2} = {}
for ${i} in ${var1}:
    ${code}
${var2}`;
  }
}

class DictMastery_Immutable extends ConceptualSubtopic {
  readonly help = [
    {
      afterFailedAttempts: 1,
      message: 'Immutable types cannot be changed after they are created. Lists and dicts are mutable; the rest of the types in that list are immutable.',
    },
  ];
  gen(): ConceptualQuestionGen {
    return {
      prompt: 'Which of the following types are immutable? `bool`, `int`, `float`, `str`, `list`, `tuple`, `dict`',
      correct: {
        display: 'bool, int, float, str, tuple',
        check: (answer) => {
          const parts = new Set(
            answer.toLowerCase().replace(/[`'"]/g, '').split(/[,\s]+/).filter(Boolean),
          );
          if (parts.size !== IMMUTABLE_TYPES.size) { return false; }
          for (const part of parts) {
            if (!IMMUTABLE_TYPES.has(part)) { return false; }
          }
          return true;
        },
      },
    };
  }
}

export const DICT_MASTERY = new Topic('dict-mastery', 'Dict Mastery', [
  new DictMastery_1(),
  new DictMastery_2(),
  new DictMastery_3(),
  new DictMastery_4(),
  new DictMastery_5(),
  new DictMastery_6(),
  new DictMastery_7(),
  new DictMastery_8(),
  new DictMastery_Immutable(),
  new DictMastery_Write(),
  new DictMastery_Long(),
], [DICT_BASICS, DICT_WITH_LOOPS],
{order: 'sequential', forceQuiz: true, skippable: true});
