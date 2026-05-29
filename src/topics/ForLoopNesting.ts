import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext, CodeOutputSubtopic } from '../topics';
import { randInts, range, randChoices, randIntNum, randVars } from '../util';
import { toPyAtom } from '../python.ts';
import { FOR_LOOP_BASICS } from './ForLoopBasics.ts';
import { FOR_LOOP_WITH_RANGE } from './ForLoopWithRange';
import { LIST_NESTING } from './ListNesting';
import { BASIC_BRANCHING } from './BasicBranching';

const ANIMALS = ["cat", "dog", "bird", "fish", "snake", "turtle", "duck", "cow", "pig"]

export class ForLoopNestingPrintList extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = ['i', 'j'];
    const [i, j] = randInts(2n, 3n, 2);
    return createQuestion(`
      for ${x} in range(${i}):
          for ${y} in range(${j}):
              print(${x}, ${y})
      `, [
          range(0n, i-1n).map(x => range(0n, j-1n).map(y => `${x} ${y}`).join('\n')).join('\n'),
          range(0n, j-1n).map(x => range(0n, i-1n).map(y => `${x} ${y}`).join('\n')).join('\n'),
          range(0n, j-1n).map(x => range(0n, i-1n).map(y => `${x}\n${y}`).join('\n')).join('\n'),
          range(0n, i-1n).map(x => range(0n, j-1n).map(y => `${x}\n${y}`).join('\n')).join('\n'),
        ], {usesOutput: true}, ctx);
  }
}

export class ForLoopNestingPrintVs extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const w = "animals";
    const x = "animal1";
    const y = "animal2";
    const animals = randChoices(ANIMALS, 3);
    return createQuestion(`
      ${w} = ${toPyAtom(animals)}
      for ${x} in ${w}:
          for ${y} in ${w}:
              print(${x} + " vs " + ${y})
      `, [
        animals.map(animal => `${animal} vs ${animal}`).join('\n'),
        animals.map(animal => animals.map(a => `${animal} vs ${a}`).join('\n')).join('\n'),
        animals.map(animal => animals.filter(a => a !== animal).map(a => `${animal} vs ${a}`).join('\n')).join('\n'),
        animals.map((animal, i) => animals.slice(i+1).map(a => `${animal} vs ${a}`).join('\n')).join('\n'),
        animals.map(animal => `${animals[0]} vs ${animal}`).join('\n'),
        animals.slice(1).map(animal => `${animals[0]} vs ${animal}`).join('\n'),
      ], {usesOutput: true}, ctx);
  }
}

export class ForLoopNestingPrintVsSkipEqual extends CodeOutputSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const w = "animals";
    const x = "animal1";
    const y = "animal2";
    const animals = randChoices(ANIMALS, 3);
    return createQuestion(`
      ${w} = ${toPyAtom(animals)}
      for ${x} in ${w}:
          for ${y} in ${w}:
              if ${x} != ${y}:
                  print(${x} + " vs " + ${y})
      `, [
        animals.map(animal => `${animal} vs ${animal}`).join('\n'),
        animals.map(animal => animals.map(a => `${animal} vs ${a}`).join('\n')).join('\n'),
        animals.map(animal => animals.filter(a => a !== animal).map(a => `${animal} vs ${a}`).join('\n')).join('\n'),
        animals.map((animal, i) => animals.slice(i+1).map(a => `${animal} vs ${a}`).join('\n')).join('\n'),
        animals.map(animal => `${animals[0]} vs ${animal}`).join('\n'),
        animals.slice(1).map(animal => `${animals[0]} vs ${animal}`).join('\n'),
      ], {usesOutput: true}, ctx);
  }
}

export class ForLoopNestingSumNested extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [w, x, y, z] = ['data', 'row', 'value', 'total'];
    const size = randIntNum(2, 4);
    const list = new Array(randIntNum(2, 4)).fill(0).map(() => randInts(1n, 5n, size));
    const total = list.reduce((a, b) => a + b.reduce((a, b) => a + b, 0n), 0n);
    return createQuestion(`
      ${w} = ${toPyAtom(list)}
      ${z} = 0
      for ${x} in ${w}:
          for ${y} in ${x}:
              ${z} += ${y}
      ${z}
      `, [
        total,
        total + 1n,
        total + BigInt(list.length),
        total - BigInt(list.length),
        list.reduce((a, b) => a + b[0], 0n),
        BigInt(list.length), BigInt(list.length * size),
      ], {}, ctx);
  }
}

export class ForLoopNestingSumEachRow extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [w, x, y, z, a] = ['data', 'row', 'value', 'totals', 'total'];
    const size = randIntNum(2, 4);
    const list = new Array(randIntNum(2, 4)).fill(0).map(() => randInts(1n, 5n, size));
    return createQuestion(`
      ${w} = ${toPyAtom(list)}
      ${z} = []
      for ${x} in ${w}:
          ${a} = 0
          for ${y} in ${x}:
              ${a} += ${y}
          ${z}.append(${a})
      ${z}
      `, [
        list.reduce((a, b) => a + b.reduce((a, b) => a + b, 0n), 0n),
        list.map(row => row.reduce((a, b) => a + b, 0n)),
        list.map(row => row.reduce((a, b) => a + b, 0n) + 1n),
        list.map(row => row.reduce((a, b) => a + b, 0n) + BigInt(row.length)),
        list.map(row => row.reduce((a, b) => a + b, 0n) - BigInt(row.length)),
        list.map(row => row[0]),
        list.map(row => BigInt(row.length)),
        list.map(row => BigInt(row.length * size)),
      ], {}, ctx);
  }
}

export class ForLoopNestingSumEachRowIndentIssue extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [w, x, y, z, a] = ['data', 'row', 'value', 'totals', 'total'];
    const size = randIntNum(2, 4);
    const list = new Array(randIntNum(2, 4)).fill(0).map(() => randInts(1n, 5n, size));
    const total = list.reduce((a, b) => a + b.reduce((a, b) => a + b, 0n), 0n);
    return createQuestion(`
      ${w} = ${toPyAtom(list)}
      ${z} = []
      for ${x} in ${w}:
          ${a} = 0
          for ${y} in ${x}:
              ${a} += ${y}
      ${z}.append(${a})
      ${z}
      `, [
        total, [total], [],
        list.map(row => row.reduce((a, b) => a + b, 0n)),
        list.map(row => row[0]),
        list.map(row => BigInt(row.length)),
        list.map(row => BigInt(row.length * size)),
      ], {}, ctx);
  }
}

export class ForLoopNestingSumEvens extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y, z] = randVars(3);
    const list = randInts(1n, 10n, randIntNum(4, 8), false);
    return createQuestion(`
      ${x} = ${toPyAtom(list)}
      ${y} = 0
      for ${z} in ${x}:
          if ${z} % 2 == 0:
              ${y} += ${z}
      ${y}
      `, [
        list.filter(z => z % 2n == 0n).reduce((a, b) => a + b, 0n),
        list.filter(z => z % 2n == 0n).reduce((a, b) => a + b, 0n) + 1n,
        list.filter(z => z % 2n == 0n).reduce((a, b) => a + b, 0n) + BigInt(list.length),
        list.filter(z => z % 2n == 0n).reduce((a, b) => a + b, 0n) - BigInt(list.length),
        list.reduce((a, b) => a + b, 0n),
      ], {}, ctx);
  }
}

export const FOR_LOOP_NESTING = new Topic('for-loop-nesting', "For Loop Nesting", [
  new ForLoopNestingPrintList(),
  new ForLoopNestingPrintVs(),
  new ForLoopNestingPrintVsSkipEqual(),
  new ForLoopNestingSumNested(),
  new ForLoopNestingSumEachRow(),
  new ForLoopNestingSumEachRowIndentIssue(),
  new ForLoopNestingSumEvens(),
], [FOR_LOOP_BASICS, FOR_LOOP_WITH_RANGE, LIST_NESTING, BASIC_BRANCHING]);
