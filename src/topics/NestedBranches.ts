import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext, CodeOutputSubtopic } from '../topics';
import { randInts, randVars, evalRelOp } from '../util';
import { toPyStr } from '../python';
import { CHAINED_BRANCHES, randOp, getTrueOp, getFalseOp } from './ChainedBranches';

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
function combos(letters: string[]): string[] {
  const last = letters.pop();
  const combinations = [];
  var length = 1 << letters.length;
  for (let i = 1; i < length; i++) {
    combinations.push(letters.filter((_, j) => (i & (1 << j))).join("\n") + "\n" + last);
  }
  return combinations;
}

export class ChainedBranches extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d] = randInts(1n, 5n, 4);
    let op1 = randOp();
    let op2 = randOp();
    while (!evalRelOp(a, op1, c) && !evalRelOp(b, op2, d)) { op1 = randOp(); op2 = randOp(); }
    let i = 0;
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
          print(${toPyStr(letters[i++])})
      elif ${y} ${op2} ${d}:
          print(${toPyStr(letters[i++])})
      print(${toPyStr(letters[i++])})
    `, [...letters.slice(0, i), ...combos(letters.slice(0, i))], {usesOutput: true}, ctx);
  }
}

export class NestedBranches1 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d] = randInts(1n, 5n, 4);
    let op1 = getTrueOp(a, c);
    let op2 = getFalseOp(b, d);
    let i = 0;
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
          print(${toPyStr(letters[i++])})
          if ${y} ${op2} ${d}:
              print(${toPyStr(letters[i++])})
      else:
          print(${toPyStr(letters[i++])})
      print(${toPyStr(letters[i++])})
    `, [...letters.slice(0, i), ...combos(letters.slice(0, i))], {usesOutput: true}, ctx);
  }
}

export class NestedBranches2 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d] = randInts(1n, 5n, 4);
    let op1 = getFalseOp(a, c);
    let op2 = getTrueOp(b, d);
    let i = 0;
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
          print(${toPyStr(letters[i++])})
          if ${y} ${op2} ${d}:
              print(${toPyStr(letters[i++])})
      else:
          print(${toPyStr(letters[i++])})
      print(${toPyStr(letters[i++])})
    `, [...letters.slice(0, i), ...combos(letters.slice(0, i))], {usesOutput: true}, ctx);
  }
}

export class NestedBranches3 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d] = randInts(1n, 5n, 4);
    let op1 = getTrueOp(a, c);
    let op2 = getFalseOp(b, d);
    let i = 0;
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
          print(${toPyStr(letters[i++])})
          if ${y} ${op2} ${d}:
              print(${toPyStr(letters[i++])})
          else:
              print(${toPyStr(letters[i++])})
      else:
          print(${toPyStr(letters[i++])})
      print(${toPyStr(letters[i++])})
    `, [...letters.slice(0, i), ...combos(letters.slice(0, i))], {usesOutput: true}, ctx);
  }
}

export class NestedBranches4 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d] = randInts(1n, 5n, 4);
    let op1 = getFalseOp(a, c);
    let op2 = getTrueOp(b, d);
    let i = 0;
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
          print(${toPyStr(letters[i++])})
          if ${y} ${op2} ${d}:
              print(${toPyStr(letters[i++])})
          else:
              print(${toPyStr(letters[i++])})
      else:
          print(${toPyStr(letters[i++])})
      print(${toPyStr(letters[i++])})
    `, [...letters.slice(0, i), ...combos(letters.slice(0, i))], {usesOutput: true}, ctx);
  }
}

export class NestedBranches5 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d] = randInts(1n, 5n, 4);
    let op1 = getTrueOp(a, c);
    let op2 = getTrueOp(b, d);
    let i = 0;
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
          print(${toPyStr(letters[i++])})
          if ${y} ${op2} ${d}:
              print(${toPyStr(letters[i++])})
          else:
              print(${toPyStr(letters[i++])})
      else:
          print(${toPyStr(letters[i++])})
      print(${toPyStr(letters[i++])})
    `, [...letters.slice(0, i), ...combos(letters.slice(0, i))], {usesOutput: true}, ctx);
  }
}

export class NestedBranches6 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e] = randInts(1n, 5n, 5);
    let op1 = getTrueOp(a, c);
    let op2 = randOp();
    let op3 = getTrueOp(a, e);
    let i = 0;
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
          print(${toPyStr(letters[i++])})
          if ${y} ${op2} ${d}:
              print(${toPyStr(letters[i++])})
          else:
              print(${toPyStr(letters[i++])})
      elif ${x} ${op3} ${e}:
          print(${toPyStr(letters[i++])})
      print(${toPyStr(letters[i++])})
    `, [...letters.slice(0, i), ...combos(letters.slice(0, i))], {usesOutput: true}, ctx);
  }
}

export class NestedBranches7 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e] = randInts(1n, 5n, 5);
    let op1 = getFalseOp(a, c);
    let op2 = randOp();
    let op3 = getTrueOp(a, e);
    let i = 0;
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
          print(${toPyStr(letters[i++])})
          if ${y} ${op2} ${d}:
              print(${toPyStr(letters[i++])})
          else:
              print(${toPyStr(letters[i++])})
      elif ${x} ${op3} ${e}:
          print(${toPyStr(letters[i++])})
      print(${toPyStr(letters[i++])})
    `, [...letters.slice(0, i), ...combos(letters.slice(0, i))], {usesOutput: true}, ctx);
  }
}
export class NestedBranches8 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const [a, b, c, d, e] = randInts(1n, 5n, 5);
    let op1 = getTrueOp(a, c);
    let op2 = randOp();
    let op3 = getTrueOp(a, e);
    let i = 0;
    return createQuestion(`
      ${x} = ${a}
      ${y} = ${b}
      if ${x} ${op1} ${c}:
          print(${toPyStr(letters[i++])})
          if ${y} ${op2} ${d}:
              print(${toPyStr(letters[i++])})
          else:
              print(${toPyStr(letters[i++])})
      if ${x} ${op3} ${e}:
          print(${toPyStr(letters[i++])})
      print(${toPyStr(letters[i++])})
    `, [...letters.slice(0, i), ...combos(letters.slice(0, i))], {usesOutput: true}, ctx);
  }
}
export const NESTED_BRANCHES = new Topic('nested-branches', 'Nested Branches', [
  new ChainedBranches(),
  new NestedBranches1(),
  new NestedBranches2(),
  new NestedBranches3(),
  new NestedBranches4(),
  new NestedBranches5(),
  new NestedBranches6(),
  new NestedBranches7(),
  new NestedBranches8(),
], [CHAINED_BRANCHES]);
