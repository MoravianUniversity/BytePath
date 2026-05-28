import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInt, randInts, randChoice, randVariable, randVars, math } from '../util';
import { BASIC_ARITHMETIC } from './BasicArithmetic';

export const OPS = ['+', '-'];

export function randOperation(): string { return randChoice(OPS); }

export class VariableAssignment extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const correct = randInt(1n, 10n); 
    const variable = randVariable();
    return createQuestion(`
        ${variable} = ${correct}
        ${variable}`, [correct, variable, Symbol(variable)], {correct}, ctx);
  }
}
export class VariableOp extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randInts(1n, 10n, 2);
    const op = randOperation();
    const variable = randVariable();
    const correct = math(a, op, b);
    return createQuestion(`
        ${variable} = ${a}
        ${variable} ${op} ${b}`,
      [
        correct + randInt(1n, 3n),
        correct - randInt(1n, 3n),
        a, b, a + b, a - b, b - a,
        variable, Symbol(variable),
      ],
      {correct}, ctx);
  }     
}
export class TwoVariableOp extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b] = randInts(1n, 10n, 2);
    const op = randOperation();
    const code = `
      ${x} = ${a}
      ${y} = ${b}
      ${x} ${op} ${y}
    `;  
    const correct = math(a, op, b);
    return createQuestion(
      code,
      [
        correct + randInt(1n, 3n),
        correct - randInt(1n, 3n),
        a, b, a + b, a - b, b - a,
        x, y, x+y, Symbol(x), Symbol(y), Symbol(x+y),
      ],
      {correct}, ctx);
  }
}

export class TwoVariableOpBackwards extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b] = randInts(1n, 10n, 2);
    const op = randOperation();
    const code = `
      ${x} = ${a}
      ${y} = ${b}
      ${y} ${op} ${x}
    `;
    const correct = math(b, op, a);
    return createQuestion(
      code,
      [
        correct + randInt(1n, 3n),
        correct - randInt(1n, 3n),
        a, b, a + b, a - b, b - a,
        x, y, x+y, Symbol(x), Symbol(y), Symbol(x+y),
      ],
      {correct}, ctx);
  }
}

export class VariableReassignment extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, b, c] = randInts(1n, 10n, 3);
    const op = randOperation();
    const code = `
      ${x} = ${a}
      ${x} = ${b}
      ${x} ${op} ${c}
    `;
    const correct = math(b, op, c);
    return createQuestion(
      code,
      [
        correct + randInt(1n, 3n),
        correct - randInt(1n, 3n),
        a, b, c, a + b, a - b, b - a, a + c, a - c, c - a, b + c, b - c, c - b,
        x, Symbol(x),
      ],
      {correct}, ctx);
  }
}

export class VariableReassignmentBackwards extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, b, c] = randInts(1n, 10n, 3);
    const op = randOperation();
    const code = `
      ${x} = ${a}
      ${x} = ${b}
      ${c} ${op} ${x}
    `;
    const correct = math(c, op, b);
    return createQuestion(
      code,
      [
        correct + randInt(1n, 3n),
        correct - randInt(1n, 3n),
        a, b, c, a + b, a - b, b - a, a + c, a - c, c - a, b + c, b - c, c - b,
        x, Symbol(x),
      ],
      {correct}, ctx);
  }
}

export class VariableReassignmentOp extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, b, c] = randInts(1n, 6n, 3);
    const op = randOperation();
    const op2 = randOperation();
    const code = `
      ${x} = ${a}
      ${x} = ${x} ${op} ${b}
      ${x} ${op2} ${c}
    `;
    const correct = math(math(a, op, b), op2, c);
    return createQuestion(
      code,
      [
        correct + randInt(1n, 3n),
        correct - randInt(1n, 3n),
        a, b, c, a + b + c, a - b + c, a + b - c, a - b - c,
        x, Symbol(x),
      ],
      {correct}, ctx);
  }
}

export class VariableReassignmentOpBackwards extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const [a, b, c] = randInts(1n, 6n, 3);
    const op = randOperation();
    const op2 = randOperation();
    const code = `
      ${x} = ${a}
      ${x} = ${b} ${op} ${x}
      ${x} ${op2} ${c}
    `;
    const correct = math(math(b, op, a), op2, c);
    return createQuestion(
      code,
      [
        correct + randInt(1n, 3n),
        correct - randInt(1n, 3n),
        a, b, c, a + b + c, a - b + c, a + b - c, a - b - c,
        x, Symbol(x),
      ],
      {correct}, ctx);
  }
}

export class TwoVariableReassignmentOp extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c] = randInts(1n, 6n, 3);
    const op = randOperation();
    const op2 = randOperation();
    const op3 = randOperation();
    const code = `
      ${x} = ${a}
      ${y} = ${x} ${op} ${b}
      ${x} = ${x} ${op2} ${c}
      ${x} ${op3} ${y}
    `;
    const correct = math(math(a, op2, c), op3, math(a, op, b));
    return createQuestion(
      code,
      [
        correct + randInt(1n, 3n),
        correct - randInt(1n, 3n),
        a + c + a + c + b,
        a + c - a + c + b,
        a - c + a - c + b,
        a - c - a - c + b,
        a + c + a + c - b,
        a + c - a + c - b,
        a - c + a - c - b,
        a - c - a - c - b,
        x, y, x+y, Symbol(x), Symbol(y), Symbol(x+y),
      ],
      {correct}, ctx);
  }
}

export const BASIC_VARIABLES: Topic = new Topic('basic-variables', 'Basic Variables', [
  new VariableAssignment(),
  new VariableOp(),
  new TwoVariableOp(),
  new TwoVariableOpBackwards(),
  new VariableReassignment(),
  new VariableReassignmentBackwards(),
  new VariableReassignmentOp(),
  new VariableReassignmentOpBackwards(),
  new TwoVariableReassignmentOp(),
  new TwoVariableReassignmentOp(), // twice for practice
], [BASIC_ARITHMETIC]);
