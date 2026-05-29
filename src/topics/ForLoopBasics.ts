import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, CodeOutputQuestionGen, EvalLastLineQuestionGen } from '../topics';
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
  gen(): CodeOutputQuestionGen {
    const x = randChoice(Object.keys(PLURAL_TO_SINGULAR_NUMS));
    const y = PLURAL_TO_SINGULAR_NUMS[x as keyof typeof PLURAL_TO_SINGULAR_NUMS];
    const list = randInts(1n, 10n, randIntNum(3, 5));
    return { code: `
      ${x} = ${toPyAtom(list)}
      for ${y} in ${x}:
          print(${y})
      `,
      options: [list.join('\n'), list.join(""), list.join(" ")],
    };
  }
}

export class ForLoopSumStrLen extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randChoice(Object.keys(PLURAL_TO_SINGULAR_STRS));
    const y = PLURAL_TO_SINGULAR_STRS[x as keyof typeof PLURAL_TO_SINGULAR_STRS];
    const z = randVariable();
    const list = randChoices(STRINGS, randIntNum(2, 4));
    return { code: `
      ${x} = ${toPyAtom(list)}
      ${z} = 0
      for ${y} in ${x}:
          ${z} += len(${y})
      ${z}`,
      options: [BigInt(list.length), 0n],
    };
  }
}

export class ForLoopPrintChars extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const [x, y] = randVars(2);
    const str = randChoice(STRINGS);
    return { code: `
      ${x} = ${toPyStr(str)}
      for ${y} in ${x}:
          print(${y})
      `,
      options: [str, str[0]],
    };
  }
}

export class ForLoopCharsToList extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y, z] = randVars(3);
    const str = randChoice(STRINGS);
    return { code: `
      ${x} = ${toPyStr(str)}
      ${z} = []
      for ${y} in ${x}:
          ${z}.append(${y}.upper())
      ${z}
      `,
      options: [str.toUpperCase(), [], [str[0].toUpperCase()], str[0].toUpperCase()],
    };
  }
}

export class ForLoopTuple extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randChoice(Object.keys(PLURAL_TO_SINGULAR_NUMS));
    const y = PLURAL_TO_SINGULAR_NUMS[x as keyof typeof PLURAL_TO_SINGULAR_NUMS];
    const z = randVariable();
    const list = asTuple(randInts(1n, 5n, randIntNum(2, 4), false));
    return { code: `
      ${x} = ${toPyAtom(list)}
      ${z} = 0
      for ${y} in ${x}:
          ${z} += ${y}
      ${z}`,
      options: [list, 0n, list[0], list[1], list[2], list[3]],
    };
  }
}

export class ForLoopTuple2 extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randChoice(Object.keys(PLURAL_TO_SINGULAR_NUMS));
    const y = PLURAL_TO_SINGULAR_NUMS[x as keyof typeof PLURAL_TO_SINGULAR_NUMS];
    const [z, w] = randVars(2);
    const list = asTuple(randInts(1n, 5n, randIntNum(2, 4), false));
    return { code: `
      ${x} = ${toPyAtom(list)}
      ${z} = 0
      ${w} = 0
      for ${y} in ${x}:
          ${z} += ${y}
          ${w} += 1
      (${z}, ${w})`,
      options: [tuple(0n, 0n), tuple(0n, 1n), tuple(list[0], 1n), tuple(list[1], 2n), tuple(list[2], 3n), tuple(list[3], 4n)],
    };
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
