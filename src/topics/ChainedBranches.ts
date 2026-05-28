import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInts, randVars, randChoice, evalRelOp } from '../util';
import { BASIC_BRANCHING } from './BasicBranching';

const OPS = ['==', '<', '<=', '>', '>='];
export function randOp(): string { return randChoice(OPS); }
export function getTrueOp(a: bigint, b: bigint): string {
  let op = randOp();
  while (!evalRelOp(a, op, b)) { op = randOp(); }
  return op;
}
export function getFalseOp(a: bigint, b: bigint): string {
  let op = randOp();
  while (evalRelOp(a, op, b)) { op = randOp(); }
  return op;
}

export class ChainedFirst extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g] = randInts(1n, 15n, 7);
    let op1 = getTrueOp(a, c);
    let op2 = getFalseOp(a, e);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      else:
        ${y} = ${g}
      ${y}
    `, [a, b, c, d, e, f, g], {}, ctx);
  }
}

export class ChainedSecond extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g] = randInts(1n, 15n, 7);
    let op1 = getFalseOp(a, c);
    let op2 = getTrueOp(a, e);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      else:
        ${y} = ${g}
      ${y}
    `, [a, b, c, d, e, f, g], {}, ctx);
  }
}

export class ChainedBoth extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g] = randInts(1n, 15n, 7);
    let op1 = getTrueOp(a, c);
    let op2 = getTrueOp(a, e);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      else:
        ${y} = ${g}
      ${y}
    `, [a, b, c, d, e, f, g], {}, ctx);
  }
}

export class ChainedNeither extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g] = randInts(1n, 15n, 7);
    let op1 = getFalseOp(a, c);
    let op2 = getFalseOp(a, e);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      else:
        ${y} = ${g}
      ${y}
    `, [a, b, c, d, e, f, g], {}, ctx);
  }
}

export class ChainedSecondNoElse extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f] = randInts(1n, 15n, 6);
    let op1 = getFalseOp(a, c);
    let op2 = getTrueOp(a, e);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      ${y}
    `, [a, b, c, d, e, f], {}, ctx);
  }
}

export class ChainedNeitherNoElse extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f] = randInts(1n, 15n, 6);
    let op1 = getFalseOp(a, c);
    let op2 = getFalseOp(a, e);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      ${y}
    `, [a, b, c, d, e, f], {}, ctx);
  }
}

export class ChainedExtraElifEntered extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g, h] = randInts(1n, 15n, 8);
    let op1 = getFalseOp(a, c);
    let op2 = getFalseOp(a, e);
    let op3 = getTrueOp(a, g);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      elif ${x} ${op3} ${g}:
        ${y} = ${h}
      ${y}
    `, [a, b, c, d, e, f, g, h], {}, ctx);
  }
}

export class ChainedExtraElifNotEntered extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g, h] = randInts(1n, 15n, 8);
    let op1 = getFalseOp(a, c);
    let op2 = getFalseOp(a, e);
    let op3 = getFalseOp(a, g);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${x} ${op2} ${e}:
        ${y} = ${f}
      elif ${x} ${op3} ${g}:
        ${y} = ${h}
      ${y}
    `, [a, b, c, d, e, f, g, h], {}, ctx);
  }
}

export class ChainedSeparateChainsBoth extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f] = randInts(1n, 15n, 6);
    let op1 = getTrueOp(a, c);
    let op2 = getTrueOp(a, e);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      if ${x} ${op2} ${e}:
        ${y} = ${f}
      ${y}
    `, [a, b, c, d, e, f], {}, ctx);
  }
}

export class ChainedSeparateChainsMost extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, g, h] = randInts(1n, 15n, 8);
    let op1 = getTrueOp(a, c);
    let op2 = getFalseOp(a, e);
    let op3 = getTrueOp(a, g);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      if ${x} ${op2} ${e}:
        ${y} = ${f}
      if ${x} ${op3} ${g}:
        ${y} = ${h}
      ${y}
    `, [a, b, c, d, e, f, g, h], {}, ctx);
  }
}

export class ChainedSeparateChainsElse extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, h] = randInts(1n, 15n, 7);
    let op1 = getTrueOp(a, c);
    let op2 = getFalseOp(a, e);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      if ${x} ${op2} ${e}:
        ${y} = ${f}
      else:
        ${y} = ${h}
      ${y}
    `, [a, b, c, d, e, f, h], {}, ctx);
  }
}

export class ChainedSeparateChainsElseB extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f, h] = randInts(1n, 15n, 7);
    let op1 = getTrueOp(a, c);
    let op2 = getTrueOp(a, e);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      if ${x} ${op2} ${e}:
        ${y} = ${f}
      else:
        ${y} = ${h}
      ${y}
    `, [a, b, c, d, e, f, h], {}, ctx);
  }
}

export class ChainedChangeBoth extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e, f] = randInts(1n, 15n, 6);
    let op1 = getFalseOp(a, c);
    let op2 = getTrueOp(e, b);
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
        ${y} = ${d}
      elif ${y} ${op2} ${e}:
        ${x} = ${f}
      ${y}
    `, [a, b, c, d, e, f], {}, ctx);
  }
}


export const CHAINED_BRANCHES = new Topic('chained-branches', 'Chained Branches', [
  new ChainedFirst(),
  new ChainedSecond(),
  new ChainedBoth(),
  new ChainedNeither(),
  new ChainedSecondNoElse(),
  new ChainedNeitherNoElse(),
  new ChainedExtraElifEntered(),
  new ChainedExtraElifNotEntered(),
  new ChainedSeparateChainsBoth(),
  new ChainedSeparateChainsMost(),
  new ChainedSeparateChainsElse(),
  new ChainedSeparateChainsElseB(),
  new ChainedChangeBoth(),
], [BASIC_BRANCHING]);
