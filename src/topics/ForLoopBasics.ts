import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext, CodeOutputSubtopic } from '../topics';
import { randInts, randIntNum, randChoice, randChoices, randVariable, randVars, STRINGS } from '../util';
import { toPyAtom, toPyStr, asTuple, tuple } from '../python';
import { BASIC_VARIABLES } from './BasicVariables';
import { BASIC_PRINTS } from './BasicPrints';
import { COMPOUND_OPERATORS } from './CompoundOperators';
import { STRING_CONCAT } from './StringConcat';
import { LIST_BASICS } from './ListBasics';


const PLURAL_TO_SINGULAR_NUMS = {
  "numbers": "number",
  "prices": "cost",
  "lengths": "length",
  "widths": "width",
  "times": "time",
  "points": "point",
  "scores": "score",
  "distances": "distance",
};

const PLURAL_TO_SINGULAR_STRS = {
  "strings": "string",
  "names": "name",
  "cities": "city",
  "states": "state",
  "animals": "animal",
  "plants": "plant",
  "fruits": "fruit",
  "veggies": "veggie",
  "colors": "color",
};

export class ForLoopPrintList extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randChoice(Object.keys(PLURAL_TO_SINGULAR_NUMS));
    const y = PLURAL_TO_SINGULAR_NUMS[x as keyof typeof PLURAL_TO_SINGULAR_NUMS];
    const list = randInts(1n, 10n, randIntNum(3, 5));
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      for ${y} in ${x}:
          print(${y})
      `, [list.join('\n'), list.join(""), list.join(" ")], {usesOutput: true}, ctx);
  }
}

export class ForLoopSumStrLen extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randChoice(Object.keys(PLURAL_TO_SINGULAR_STRS));
    const y = PLURAL_TO_SINGULAR_STRS[x as keyof typeof PLURAL_TO_SINGULAR_STRS];
    const z = randVariable();
    const list = randChoices(STRINGS, randIntNum(2, 4));
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${z} = 0
      for ${y} in ${x}:
          ${z} += len(${y})
      ${z}`, [BigInt(list.length), 0n], {}, ctx);
  }
}

export class ForLoopPrintChars extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const str = randChoice(STRINGS);
    return createQuestion(`
      ${x} = ${toPyStr(str)}
      for ${y} in ${x}:
          print(${y})
      `, [str, str[0]], {usesOutput: true}, ctx);
  }
}

export class ForLoopCharsToList extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y, z] = randVars(3);
    const str = randChoice(STRINGS);
    return createQuestion(`
      ${x} = ${toPyStr(str)}
      ${z} = []
      for ${y} in ${x}:
          ${z}.append(${y}.upper())
      ${z}
      `, [str.toUpperCase(), [], [str[0].toUpperCase()], str[0].toUpperCase()], {}, ctx);
  }
}

export class ForLoopTuple extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randChoice(Object.keys(PLURAL_TO_SINGULAR_NUMS));
    const y = PLURAL_TO_SINGULAR_NUMS[x as keyof typeof PLURAL_TO_SINGULAR_NUMS];
    const z = randVariable();
    const list = asTuple(randInts(1n, 5n, randIntNum(2, 4), false));
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${z} = 0
      for ${y} in ${x}:
          ${z} += ${y}
      ${z}`, [list, 0n, list[0], list[1], list[2], list[3]], {}, ctx);
  }
}

export class ForLoopTuple2 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randChoice(Object.keys(PLURAL_TO_SINGULAR_NUMS));
    const y = PLURAL_TO_SINGULAR_NUMS[x as keyof typeof PLURAL_TO_SINGULAR_NUMS];
    const [z, w] = randVars(2);
    const list = asTuple(randInts(1n, 5n, randIntNum(2, 4), false));
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${z} = 0
      ${w} = 0
      for ${y} in ${x}:
          ${z} += ${y}
          ${w} += 1
      (${z}, ${w})`, [tuple(0n, 0n), tuple(0n, 1n), tuple(list[0], 1n), tuple(list[1], 2n), tuple(list[2], 3n), tuple(list[3], 4n)], {}, ctx);
  }
}

export const FOR_LOOP_BASICS = new Topic('for-loop-basics', "For Loop Basics", [
  new ForLoopPrintList(),
  new ForLoopSumStrLen(),
  new ForLoopPrintChars(),
  new ForLoopCharsToList(),
  new ForLoopTuple(),
  new ForLoopTuple2(),
], [BASIC_VARIABLES, BASIC_PRINTS, COMPOUND_OPERATORS, STRING_CONCAT, LIST_BASICS]);
