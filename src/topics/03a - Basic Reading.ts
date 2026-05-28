import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randVariable, randVars, randChoice, STRINGS } from '../util';
import { BASIC_ARITHMETIC } from './BasicArithmetic';
import { BASIC_VARIABLES, VariableOp, TwoVariableOp, TwoVariableOpBackwards } from './BasicVariables';
import { STRING_CONCAT, StringConcat, StringConcatBackwards, StringConcat_1IntLike, StringConcat_2IntLike } from './StringConcat';
import { STRING_LENGTH, StringLenVar, StringLenMultiVar } from './StringLength';
import { STRING_INDEX, StringIndex0, StringIndex1, StringIndexN, StringIndexConcat, StringIndexPostConcat, StringIndexVar } from './StringIndexing';
import { ConvertString, ConvertStringAdd, ConvertStringConcat, ConvertInt, ConvertIntAdd, ConvertIntConcat } from './Quiz3';

export class StringLenPlus extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const a = randChoice(STRINGS);
    const b = randInt(1n, 3n);
    return createQuestion(`
      ${x} = "${a}"
      ${y} = ${b}
      len(${x}) + ${y}
    `, [
      BigInt(a.length + 1),
      BigInt(a.length - 1),
      BigInt(a.length), y, x, `${x}${y}`, `${x}${b}`, `${a}${b}`,
    ], {}, ctx);
  }
}

export class StringIndexLenMinus1 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return createQuestion(`
      ${x} = "${a}"
      ${x}[len(${x}) - 1]
    `, [
      BigInt(a.length - 1),
      BigInt(a.length - 2),
      BigInt(a.length), x, a[a.length - 2],
    ], {}, ctx);
  }
}

export class StringIndexXMinusY extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y, z] = randVars(3);
    const a = randChoice(STRINGS);
    const b = randInt(2n, BigInt(a.length - 1));
    const c = randInt(1n, b - 1n);
    return createQuestion(`
      ${x} = "${a}"
      ${y} = ${b}
      ${z} = ${c}
      ${x}[${y} - ${z}]
    `, [
        b - c, c - b, 
        a, x, y, z, a[0], a[Number(b)-1], a[Number(c)-1], a[Number(b-c)-1],
    ], {}, ctx);
  }
}

export class StringLenOfIndex extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const a = randChoice(STRINGS);
    const b = randInt(1n, BigInt(a.length - 1));
    return createQuestion(`
      ${x} = "${a}"
      ${y} = ${b}
      len(${x}[${y}])
    `, [BigInt(a.length), x, y, a[Number(b)], a[Number(b)-1]], {}, ctx);
  }
}

export class ConvertIndexOfStrOfLen extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS) + randChoice(STRINGS) + randChoice(STRINGS) + randChoice(STRINGS);
    return createQuestion(`
      ${x} = "${a}"
      str(len(${x}))[1]
    `, [a, x, a[1], a[0], BigInt(a.length)], {}, ctx);
  }
}

export const PRACTICE_03A_BASIC_READING: Topic = new Topic('practice-03a-basic-reading', '03a Basic Reading', [
    new VariableOp(),
    new TwoVariableOp(),
    new TwoVariableOpBackwards(),
    new StringConcat(),
    new StringConcatBackwards(),
    new StringConcat_1IntLike(),
    new StringConcat_2IntLike(),
    new StringLenVar(),
    new StringLenMultiVar(),
    new StringLenPlus(),
    new StringIndex0(),
    new StringIndex1(),
    new StringIndexN(),
    new StringIndexConcat(),
    new StringIndexPostConcat(),
    new StringIndexVar(),
    new StringIndexLenMinus1(),
    new StringIndexXMinusY(),
    new StringLenOfIndex(),
    new ConvertString(),
    new ConvertStringAdd(),
    new ConvertStringConcat(),
    new ConvertInt(),
    new ConvertIntAdd(),
    new ConvertIntConcat(),
    new ConvertIndexOfStrOfLen(),
  ], [BASIC_ARITHMETIC, BASIC_VARIABLES, STRING_CONCAT, STRING_LENGTH, STRING_INDEX], {order: 'random'});
