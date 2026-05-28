import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randVars, randInts, randVariable, randChoice, STRINGS } from '../util';
import { BASIC_ARITHMETIC, Addition, AdditionWithNegative } from './BasicArithmetic';
import { BASIC_VARIABLES, VariableAssignment, VariableOp, TwoVariableOp, TwoVariableOpBackwards } from './BasicVariables';
import { STRING_CONCAT, StringConcat, StringConcatBackwards, StringConcat_1IntLike, StringConcat_1IntLikeBackwards, StringConcat_2IntLike, StringConcat_2IntLikeBackwards } from './StringConcat';
import { STRING_LENGTH, StringLen, StringLenVar, StringLenMultiVar } from './StringLength';
import { BASIC_PRINTS, PrintString, PrintStringMulti, PrintStringVar, PrintStringVar2, PrintStringMultiVar } from './BasicPrints';

export class ConvertString extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randInt(1n, 10n);
    return createQuestion(`
      ${x} = ${a}
      str(${x})
    `, [a, `${a}`, x, Symbol(x), 0n, 1n, 2n, null], {}, ctx);
  }
}

export class ConvertStringAdd extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b] = randInts(1n, 10n, 2);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      str(${x} + ${y})
    `, [a, b, x+y, a+b, `${a}`, `${b}`, `${a}${b}`, x, y, Symbol(x), Symbol(y), Symbol(x+y), 0n, 1n, 2n, null], {}, ctx);
  }
}

export class ConvertStringConcat extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b] = randInts(1n, 10n, 2);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      str(${x}) + str(${y})
    `, [a, b, x+y, `${a}`, `${b}`, `${a}${b}`, x, y, Symbol(x), Symbol(y), Symbol(x+y), 0n, 1n, 2n, null], {}, ctx);
  }
}

export class ConvertInt extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randInt(1n, 10n);
    return createQuestion(`
      ${x} = "${a}"
      int(${x})
    `, [a, `${a}`, x, Symbol(x), 0n, 1n, 2n, null], {}, ctx);
  }
}

export class ConvertIntAdd extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b] = randInts(1n, 10n, 2);
    return createQuestion(`
      ${x} = "${a}"
      ${y} = "${b}"
      int(${x}) + int(${y})
    `, [a, b, x+y, `${a}`, `${b}`, `${a}${b}`, x, y, Symbol(x), Symbol(y), Symbol(x+y), 0n, 1n, 2n, null], {}, ctx);
  }
}

export class ConvertIntConcat extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b] = randInts(1n, 10n, 2);
    return createQuestion(`
      ${x} = "${a}"
      ${y} = "${b}"
      int(${x}) + int(${y})
    `, [a, b, x+y, `${a}`, `${b}`, `${a}${b}`, x, y, Symbol(x), Symbol(y), Symbol(x+y), 0n, 1n, 2n, null], {}, ctx);
  }
}

class Input extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randChoice(STRINGS);
    return createQuestion(`
      ${x} = input()
      ${x}
    `, [a, x, Symbol(x)], {input: a}, ctx);
  }
}

class InputStrOfInt extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randInt(1n, 10n);
    return createQuestion(`
      ${x} = input()
      ${x}
    `, [a, `${a}`, x, Symbol(x), 0n, 1n], {input: `${a}`}, ctx);
  }
}

class InputInt extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const a = randInt(1n, 10n);
    return createQuestion(`
      ${x} = int(input())
      ${x}
    `, [a, `${a}`, x, Symbol(x), 0n, 1n, 2n, null], {input: `${a}`}, ctx);
  }
}

// TODO: this does not work in quiz mode (they cannot type the echoed input correctly)
//  also the wrong answers don't have the correct echos either
// class InputOutputTest extends EvalLastLineSubtopic {
//   generateQuestion(ctx: GenerateContext) {
//     const x = randVariable();
//     const a = randChoice(STRINGS);
//     return createQuestion(`
//       name = input("What is your name? ")
//       print(f"Hello {name}!")
//     `, [a, x, `Hello ${a}!`], {input: a, usesOutput: true}, ctx);
//   }
// }

export const QUIZ_3: Topic = new Topic('quiz-3', 'Quiz 3 Practice', [
  new Addition(),
  new AdditionWithNegative(),
  new VariableAssignment(),
  new VariableOp(),
  new TwoVariableOp(),
  new TwoVariableOpBackwards(),
  new StringConcat(),
  new StringConcatBackwards(),
  new StringConcat_1IntLike(),
  new StringConcat_1IntLikeBackwards(),
  new StringConcat_2IntLike(),
  new StringConcat_2IntLikeBackwards(),
  new StringLen(),
  new StringLenVar(),
  new StringLenMultiVar(),
  new PrintString(),
  new PrintStringMulti(),
  new PrintStringVar(),
  new PrintStringVar2(),
  new PrintStringMultiVar(),
  new ConvertString(),
  new ConvertStringAdd(),
  new ConvertStringConcat(),
  new ConvertInt(),
  new ConvertIntAdd(),
  new ConvertIntConcat(),
  new Input(),
  new InputStrOfInt(),
  new InputInt(),
  // new InputOutputTest(),
], [BASIC_ARITHMETIC, BASIC_VARIABLES, STRING_CONCAT, STRING_LENGTH, BASIC_PRINTS], {order: 'random'});
