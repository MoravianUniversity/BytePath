import { Topic, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randChoice, randVars, randVariable, randIntNum, VARS, randFloat, STRINGS } from '../util';
import { toPyStr, toPyFloat } from '../python';
import { BASIC_ARITHMETIC } from './BasicArithmetic';
import { BASIC_VARIABLES } from './BasicVariables';
import { BASIC_PRINTS } from './BasicPrints';
import { STRING_INDEX, StringIndex1, StringIndexVar } from './StringIndexing';
import { STRING_LENGTH, StringLen, StringLenMulti } from './StringLength';
import { STRING_CONCAT } from './StringConcat';
import { STRING_METHODS, StringIsDigit, StringIsDigit2, StringIsDigit3, StringLower, StringUpper } from './StringMethods';
import { SPLITTING_AND_JOINING } from './SplittingAndJoining';
import { F_STRINGS } from './FStrings';
import { MEMBERSHIP_OPERATORS, CharInString } from './MembershipOperator';
import { STRING_SLICING, StringSlicing, StringSlicingChained, StringSlicingFrom0 } from './StringSlicing';
import { STRING_NEG_INDEX, StringIndexNeg1 } from './StringNegIndex';
import { StringLenOfIndex } from './03a - Basic Reading';

export class ConcatSlices extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const a = randChoice(STRINGS);
    const i = randIntNum(1, a.length - 4);
    const j = randIntNum(i+2, a.length - 2);
    return {
      code: `
        ${x} = ${toPyStr(a)}
        ${x}[:${i}] + ${x}[${j}:]
      `,
      options: [a, a[i] + a[j]],
    };
  }
}

export class CharNotInString extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
      const x = randVariable();
      const a = randChoice(STRINGS);
      const char = randChoice([...a, ...VARS]);
      return {
        code: `
          ${x} = ${toPyStr(a)}
          ${toPyStr(char)} not in ${x}
        `,
        options: [true, false],
      };
  }
}

export class FancyFString extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const a = randChoice(STRINGS);
    const b = randFloat(1, 10, 1);
    return {
      code: `
        ${x} = ${toPyStr(a)}
        ${y} = ${toPyFloat(b, 1)}
        f"{${y}:.2f}+{${x}}"
      `,
      options: [
        a, b, `${b.toFixed(1)}+${a}`, `${b.toFixed(0)}.2f+${a}`, `${b.toFixed(0)}${a}`, `${b.toFixed(0)}.2f${a}`
      ],
    };
  }
}

export const PRACTICE_04B_STRINGS: Topic = new Topic('practice-04b-strings', '04b Strings', [
  new StringLen(),
  new StringLenMulti(),
  new StringIndex1(),
  new StringIndexVar(),
  new StringIndexNeg1(),
  new StringSlicing(),
  new StringSlicingChained(),
  new StringSlicingFrom0(),
  new ConcatSlices(),
  new StringLenOfIndex(),
  new CharInString(),
  new CharNotInString(),
  new StringUpper(),
  new StringLower(),
  new StringIsDigit(),
  new StringIsDigit2(),
  new StringIsDigit3(),
  new FancyFString(),
], [BASIC_ARITHMETIC, BASIC_VARIABLES, BASIC_PRINTS, STRING_LENGTH, STRING_CONCAT, STRING_INDEX,
    STRING_SLICING, STRING_NEG_INDEX, MEMBERSHIP_OPERATORS, STRING_METHODS, SPLITTING_AND_JOINING, F_STRINGS], {order: 'random'});
