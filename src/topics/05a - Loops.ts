import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { randInts, randChoice, randChoices, randIntNum, randVars, randInt, range } from '../util';
import { toPyAtom, toPyStr } from '../python.ts';

import { WHILE_LOOPS } from './WhileLoops';
import { FOR_LOOP_BASICS } from './ForLoopBasics';
import { FOR_LOOP_WITH_RANGE } from './ForLoopWithRange';
import { FOR_LOOP_NESTING } from './ForLoopNesting';

const ANIMALS = ["cat", "dog", "bird", "fish", "snake", "turtle", "duck", "cow", "pig"]

export class ReadRangeBasic extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randInt(3n, 6n);
    return createQuestion(`list(range(${a}))`, [
      range(0n, a), range(0n, a-1n), range(0n, a+1n),
      range(1n, a), range(1n, a-1n), range(1n, a+1n),
    ], {}, ctx);
  }
}

export class ReadRangeStartStop extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randInts(3n, 6n, 2);
    if (a > b) { [a, b] = [b, a]; }
    return createQuestion(`list(range(${a}, ${b}))`, [
      range(a, b), range(a, b-1n), range(a, b+1n),
      range(b, a), range(b, a-1n), range(b, a+1n),
      range(a-1n, b), range(a-1n, b-1n), range(a-1n, b+1n),
      range(b-1n, a), range(b-1n, a-1n), range(b-1n, a+1n),
    ], {}, ctx);
  }
}

export class ReadRangeStartStopBackwards extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [a, b] = randInts(3n, 6n, 2);
    if (a < b) { [a, b] = [b, a]; }
    return createQuestion(`list(range(${a}, ${b}))`, [
      range(a, b), range(a, b-1n), range(a, b+1n),
      range(b, a), range(b, a-1n), range(b, a+1n),
      range(a-1n, b), range(a-1n, b-1n), range(a-1n, b+1n),
      range(b-1n, a), range(b-1n, a-1n), range(b-1n, a+1n),
    ], {}, ctx);
  }
}

export class ReadRangeStartStopEquals extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const a = randInt(3n, 6n);
    return createQuestion(`list(range(${a}, ${a}))`, [
      [a],
      [a, a],
      [0n],
      [a-1n, a],
      [a-1n],
    ], {}, ctx);
  }
}

export class ReadRange0 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    return createQuestion(`list(range(0))`, [
      [0n], [0n, 1n], [1n], [-1n],
    ], {}, ctx);
  }
}

export class NumberOfLoopsList extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const lst = randChoices(ANIMALS, randIntNum(2, 4));
    return createQuestion(`
      ${y} = 0
      for ${x} in ${toPyAtom(lst)}:
          ${y} += 1
      ${y}`, [
        ...range(0n, 5n), ...lst.map(s => BigInt(s.length)),
        lst.reduce((a, b) => a + BigInt(b.length), 0n),
        lst.reduce((a, b) => a + BigInt(b.length-1), 0n)
      ], {}, ctx);
  }
}

export class NumberOfLoopsStr extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const str = randChoice(ANIMALS);
    return createQuestion(`
      ${y} = 0
      for ${x} in ${toPyStr(str)}:
          ${y} += 1
      ${y}`, [
        ...range(0n, 5n), 1n, BigInt(str.length), BigInt(str.length-1),
      ], {}, ctx);
  }
}

export class NumberOfLoopsRange extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(3);
    const num = randInt(3n, 5n);
    return createQuestion(`
      ${y} = 0
      for ${x} in range(${num}):
          ${y} += 1
      ${y}`, [
        ...range(0n, 5n), num, num+1n, num-1n,
      ], {}, ctx);
  }
}

export class NumberOfLoopsRangeNested extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y, z] = randVars(3);
    const [a, b] = randInts(2n, 4n, 2);
    return createQuestion(`
      ${z} = 0
      for ${x} in range(${a}):
          for ${y} in range(${b}):
              ${z} += 1
      ${z}`, [
        a, b, a*b, a*b+1n, a*b-1n, (a+1n)*(b+1n), (a-1n)*(b-1n)
      ], {}, ctx);
  }
}

export class ShortCode0 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [word, letter] = randChoice([
      ["potato", "t"], ["better", "e"], ["kinetic", "i"], ["perfect", "e"], ["vacant", "a"],
      ["banana", "n"], ["doctor", "o"], ["icicle", "c"], ["library", "r"], ["drawers", "r"],
      ["borrow", "o"],
    ]);
    const [x, y, z, w] = randVars(4);
    return createQuestion(`
      ${x} = ${toPyStr(word)}
      ${y} = ${x}.split(${toPyStr(letter)})
      ${z} = 0
      for ${w} in ${y}:
          ${z} += len(${w})
          print(${z}, ${w})`, [], {}, ctx);
  }
}

export class ShortCode1 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const words = (Math.random() < 0.7) ? randChoices(ANIMALS, 3) : ["Coding", "Is", "Fun!"];
    const [x, y, z] = randVars(4);
    return createQuestion(`
      ${x} = ${toPyAtom(words)}
      for ${y} in ${x}:
          print(len(${y}), ${y})
      for ${z} in range(len(${x})):
          print(${z}, ${x}[${z}])`, [], {}, ctx);
  }
}

export class ShortCode2 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    let [outer, inner] = randInts(2n, 4n, 2);
    if (outer > inner) { [outer, inner] = [inner, outer]; }
    if (outer === 2n) { [outer, inner] = [inner, outer]; }
    const [x, y, z] = randVars(3);
    return createQuestion(`
      for ${x} in range(1, ${outer}):
          ${y} = ''
          for ${z} in range(${inner}):
              ${y} += str(${z})
          print(${x}, ${y})`, [], {}, ctx);
  }
}

export const PRACTICE_05A_LOOPS: Topic = new Topic('practice-05a-loops', '05a Loops', [
  new ReadRangeBasic(),
  new ReadRangeStartStop(),
  new ReadRangeStartStopBackwards(),
  new ReadRangeStartStopEquals(),
  new ReadRange0(),
  new NumberOfLoopsList(),
  new NumberOfLoopsStr(),
  new NumberOfLoopsRange(),
  new NumberOfLoopsRangeNested(),
  new ShortCode0(),
  new ShortCode1(),
  new ShortCode2(),
], [WHILE_LOOPS, FOR_LOOP_BASICS, FOR_LOOP_WITH_RANGE, FOR_LOOP_NESTING], {order: 'random'});
