import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randIntNum, randChoice, randVars, randVariable, STRINGS } from '../util';
import { toPyStr } from '../python';
import { Exponentiation } from './BasicArithmetic';
import { STRING_INDEX } from './StringIndexing';
import { STRING_LENGTH } from './StringLength';
import { DIVISION, FloatDivisionWithFraction, PerfectFloatDivision2, IntDivision, Modulo } from './Division';
import { MEMBERSHIP_OPERATORS, CharInString, CapitalCharInString, SubstringInString, SubstringNotInString, } from './MembershipOperator';
import { BASIC_RELATIONAL_OPERATORS, LessThan_True, LessThanOrEqualTo_False } from './BasicRelationalOperators';
import { BOOLEAN_OPERATORS, BooleanOpsWithRelOps, BooleanOpsWithRelOpsAndVars, BooleanOpsWithRelOpsAndVars2 } from './BooleanOperators';

export class CharAtIs extends EvalLastLineSubtopic {
    generateQuestion(ctx: GenerateContext) {
        const [x, y] = randVars(2);
        const a = randChoice(STRINGS);
        const i = randInt(2n, BigInt(a.length - 2));
        return createQuestion(`
            ${x} = ${toPyStr(a)}
            ${y} = ${i}
            ${x}[${y}] == '${a[Number(i + randInt(-1n, 1n))]}'
        `, [true, false], {}, ctx);
    }
}

export class LenIs extends EvalLastLineSubtopic {
    generateQuestion(ctx: GenerateContext) {
        const x = randVariable();
        const a = randChoice(STRINGS);
        return createQuestion(`
            ${x} = ${toPyStr(a)}
            len(${x}) ${randChoice(['==', '!='])} ${a.length + randIntNum(-1, 1)}
        `, [true, false], {}, ctx);
    }
}

export const PRACTICE_04A_DIVISION_AND_CONDITIONS: Topic = new Topic('practice-04a-division-and-conditions', '04a Division and Conditions', [
  new IntDivision(),
  new Modulo(),
  new IntDivision(),
  new Modulo(),
  new FloatDivisionWithFraction(),
  new PerfectFloatDivision2(),
  new Exponentiation(),
  new CharInString(),
  new CapitalCharInString(),
  new SubstringNotInString(),
  new SubstringInString(),
  new CharAtIs(),
  new LenIs(),
  new LenIs(),
  new LessThan_True(),
  new LessThanOrEqualTo_False(),
  new BooleanOpsWithRelOps(),
  new BooleanOpsWithRelOps(),
  new BooleanOpsWithRelOpsAndVars(),
  new BooleanOpsWithRelOpsAndVars2(),
], [DIVISION, STRING_INDEX, STRING_LENGTH, BASIC_RELATIONAL_OPERATORS, BOOLEAN_OPERATORS, MEMBERSHIP_OPERATORS], {order: 'random'});
