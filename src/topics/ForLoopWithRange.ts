import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext, CodeOutputSubtopic } from '../topics';
import { randVariable, randVars, randInt, range } from '../util';
import { createException } from '../python';
import { FOR_LOOP_BASICS } from './ForLoopBasics';

export class ForLoopPrintRange extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const i = randInt(2n, 5n);
    return createQuestion(`
      for ${x} in range(${i}):
          print(${x})
      `, [
        range(0n, 1n).join('\n'),
        range(0n, 2n).join('\n'),
        range(0n, 3n).join('\n'),
        range(0n, 4n).join('\n'),
        range(0n, 5n).join('\n'),
        range(1n, 1n).join('\n'),
        range(1n, 2n).join('\n'),
        range(1n, 3n).join('\n'),
        range(1n, 4n).join('\n'),
        range(1n, 5n).join('\n'),
      ], {usesOutput: true}, ctx);
  }
}

export class ForLoopRangeToList extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const i = randInt(2n, 5n);
    return createQuestion(`
      ${y} = []
      for ${x} in range(${i}):
          ${y}.append(${x})
      ${y}`, [
        range(0n, 1n),
        range(0n, 2n),
        range(0n, 3n),
        range(0n, 4n),
        range(0n, 5n),
        range(1n, 1n),
        range(1n, 2n),
        range(1n, 3n),
        range(1n, 4n),
        range(1n, 5n),
      ], {usesOutput: true}, ctx);
  }
}

export class ForLoopPrintRangeTo1 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    return createQuestion(`
      for ${x} in range(1):
          print(${x})
      `, [
        range(0n, 0n).join('\n'),
        range(0n, 1n).join('\n'),
        range(1n, 1n).join('\n'),
        range(0n, 2n).join('\n'),
        range(1n, 2n).join('\n'),
      ], {usesOutput: true}, ctx);
  }
}

export class ForLoopPrintRangeTo0 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    return createQuestion(`
      for ${x} in range(0):
          print(${x})
      `, [
        range(0n, 0n).join('\n'),
        createException('ValueError'),
      ], {usesOutput: true}, ctx);
  }
}

export class ForLoopPrintRangeToNeg1 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    return createQuestion(`
      for ${x} in range(-1):
          print(${x})
      `, [
        range(-1n, -1n).join('\n'),
        range(-1n, 0n).join('\n'),
        range(0n, 0n).join('\n'),
        range(-1n, 0n).reverse().join('\n'),
        createException('ValueError'),
      ], {usesOutput: true}, ctx);
  }
}

export class ForLoopPrintRangeStartStop extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const i = randInt(2n, 3n);
    const j = randInt(4n, 5n);
    return createQuestion(`
      for ${x} in range(${i}, ${j}):
          print(${x})
      `, [
        range(i, j).join('\n'),
        range(i, j-1n).join('\n'),
        range(i+1n, j).join('\n'),
        range(i, i+j).join('\n'),
        [i, j].join('\n'),
      ], {usesOutput: true}, ctx);
  }
}

export class ForLoopPrintRangeStartStopPlus1 extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const i = randInt(2n, 5n);
    return createQuestion(`
      for ${x} in range(${i}, ${i+1n}):
          print(${x})
      `, [
        range(i, i).join('\n'),
        range(i, i+1n).join('\n'),
      ], {usesOutput: true}, ctx);
  }
}

export class ForLoopPrintRangeStartStopSame extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const i = randInt(2n, 5n);
    return createQuestion(`
      for ${x} in range(${i}, ${i}):
          print(${x})
      `, [
        range(i, i).join('\n'),
        range(i, i+1n).join('\n'),
        createException('ValueError'),
      ], {usesOutput: true}, ctx);
  }
}

export class ForLoopPrintRangeStartStopBackwards extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const i = randInt(4n, 5n);
    const j = randInt(2n, 3n);
    return createQuestion(`
      for ${x} in range(${i}, ${j}):
          print(${x})
      `, [
        range(i, j).join('\n'),
        range(i, j-1n).join('\n'),
        range(i, j).reverse().join('\n'),
        range(i, j-1n).reverse().join('\n'),
        [i, j].join('\n'),
        [j, i].join('\n'),
        createException('ValueError'),
      ], {usesOutput: true}, ctx);
  }
}

export class ForLoopPrintRangeStartNegStopNeg extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const i = randInt(-5n, -4n);
    const j = randInt(-3n, -2n);
    return createQuestion(`
      for ${x} in range(${i}, ${j}):
          print(${x})
      `, [
        range(i, j).join('\n'),
        range(i, j-1n).join('\n'),
        range(i, j+1n).join('\n'),
        range(i, j).reverse().join('\n'),
        range(i, j-1n).reverse().join('\n'),
        range(i, j+1n).reverse().join('\n'),
        [i, j].join('\n'),
        [j, i].join('\n'),
        createException('ValueError'),
      ], {usesOutput: true}, ctx);
  }
}

export const FOR_LOOP_WITH_RANGE = new Topic('for-loop-with-range', "For Loop with Range", [
  new ForLoopPrintRange(),
  new ForLoopRangeToList(),
  new ForLoopPrintRangeTo1(),
  new ForLoopPrintRangeTo0(),
  new ForLoopPrintRangeToNeg1(),
  new ForLoopPrintRangeStartStop(),
  new ForLoopPrintRangeStartStopPlus1(),
  new ForLoopPrintRangeStartStopSame(),
  new ForLoopPrintRangeStartStopBackwards(),
  new ForLoopPrintRangeStartNegStopNeg(),
], [FOR_LOOP_BASICS]);
