import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, CodeOutputQuestionGen, EvalLastLineQuestionGen } from '../topics';
import { randInts, range, randChoices, randIntNum, randVars } from '../util';
import { toPyAtom } from '../python.ts';
import { FOR_LOOP_BASICS } from './ForLoopBasics.ts';
import { FOR_LOOP_WITH_RANGE } from './ForLoopWithRange';
import { LIST_NESTING } from './ListNesting';
import { BASIC_BRANCHING } from './BasicBranching';

const ANIMALS = ["cat", "dog", "bird", "fish", "snake", "turtle", "duck", "cow", "pig"]

export class ForLoopNestingPrintList extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const [x, y] = ['i', 'j'];
    const [i, j] = randInts(2n, 3n, 2);
    return { code: `
      for ${x} in range(${i}):
          for ${y} in range(${j}):
              print(${x}, ${y})
      `, options: [
          range(0n, i-1n).map(x => range(0n, j-1n).map(y => `${x} ${y}`).join('\n')).join('\n'),
          range(0n, j-1n).map(x => range(0n, i-1n).map(y => `${x} ${y}`).join('\n')).join('\n'),
          range(0n, j-1n).map(x => range(0n, i-1n).map(y => `${x}\n${y}`).join('\n')).join('\n'),
          range(0n, i-1n).map(x => range(0n, j-1n).map(y => `${x}\n${y}`).join('\n')).join('\n'),
        ] };
  }
}

export class ForLoopNestingPrintVs extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const w = "animals";
    const x = "animal1";
    const y = "animal2";
    const animals = randChoices(ANIMALS, 3);
    return { code: `
      ${w} = ${toPyAtom(animals)}
      for ${x} in ${w}:
          for ${y} in ${w}:
              print(${x} + " vs " + ${y})
      `, options: [
        animals.map(animal => `${animal} vs ${animal}`).join('\n'),
        animals.map(animal => animals.map(a => `${animal} vs ${a}`).join('\n')).join('\n'),
        animals.map(animal => animals.filter(a => a !== animal).map(a => `${animal} vs ${a}`).join('\n')).join('\n'),
        animals.map((animal, i) => animals.slice(i+1).map(a => `${animal} vs ${a}`).join('\n')).join('\n'),
        animals.map(animal => `${animals[0]} vs ${animal}`).join('\n'),
        animals.slice(1).map(animal => `${animals[0]} vs ${animal}`).join('\n'),
      ] };
  }
}

export class ForLoopNestingPrintVsSkipEqual extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const w = "animals";
    const x = "animal1";
    const y = "animal2";
    const animals = randChoices(ANIMALS, 3);
    return { code: `
      ${w} = ${toPyAtom(animals)}
      for ${x} in ${w}:
          for ${y} in ${w}:
              if ${x} != ${y}:
                  print(${x} + " vs " + ${y})
      `, options: [
        animals.map(animal => `${animal} vs ${animal}`).join('\n'),
        animals.map(animal => animals.map(a => `${animal} vs ${a}`).join('\n')).join('\n'),
        animals.map(animal => animals.filter(a => a !== animal).map(a => `${animal} vs ${a}`).join('\n')).join('\n'),
        animals.map((animal, i) => animals.slice(i+1).map(a => `${animal} vs ${a}`).join('\n')).join('\n'),
        animals.map(animal => `${animals[0]} vs ${animal}`).join('\n'),
        animals.slice(1).map(animal => `${animals[0]} vs ${animal}`).join('\n'),
      ] };
  }
}

export class ForLoopNestingSumNested extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [w, x, y, z] = ['data', 'row', 'value', 'total'];
    const size = randIntNum(2, 4);
    const list = new Array(randIntNum(2, 4)).fill(0).map(() => randInts(1n, 5n, size));
    const total = list.reduce((a, b) => a + b.reduce((a, b) => a + b, 0n), 0n);
    return { code: `
      ${w} = ${toPyAtom(list)}
      ${z} = 0
      for ${x} in ${w}:
          for ${y} in ${x}:
              ${z} += ${y}
      ${z}
      `,
      options: [
        total,
        total + 1n,
        total + BigInt(list.length),
        total - BigInt(list.length),
        list.reduce((a, b) => a + b[0], 0n),
        BigInt(list.length), BigInt(list.length * size),
      ],
    };
  }
}

export class ForLoopNestingSumEachRow extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [w, x, y, z, a] = ['data', 'row', 'value', 'totals', 'total'];
    const size = randIntNum(2, 4);
    const list = new Array(randIntNum(2, 4)).fill(0).map(() => randInts(1n, 5n, size));
    return { code: `
      ${w} = ${toPyAtom(list)}
      ${z} = []
      for ${x} in ${w}:
          ${a} = 0
          for ${y} in ${x}:
              ${a} += ${y}
          ${z}.append(${a})
      ${z}
      `,
      options: [
        list.reduce((a, b) => a + b.reduce((a, b) => a + b, 0n), 0n),
        list.map(row => row.reduce((a, b) => a + b, 0n)),
        list.map(row => row.reduce((a, b) => a + b, 0n) + 1n),
        list.map(row => row.reduce((a, b) => a + b, 0n) + BigInt(row.length)),
        list.map(row => row.reduce((a, b) => a + b, 0n) - BigInt(row.length)),
        list.map(row => row[0]),
        list.map(row => BigInt(row.length)),
        list.map(row => BigInt(row.length * size)),
      ],
    };
  }
}

export class ForLoopNestingSumEachRowIndentIssue extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [w, x, y, z, a] = ['data', 'row', 'value', 'totals', 'total'];
    const size = randIntNum(2, 4);
    const list = new Array(randIntNum(2, 4)).fill(0).map(() => randInts(1n, 5n, size));
    const total = list.reduce((a, b) => a + b.reduce((a, b) => a + b, 0n), 0n);
    return { code: `
      ${w} = ${toPyAtom(list)}
      ${z} = []
      for ${x} in ${w}:
          ${a} = 0
          for ${y} in ${x}:
              ${a} += ${y}
      ${z}.append(${a})
      ${z}
      `,
      options: [
        total, [total], [],
        list.map(row => row.reduce((a, b) => a + b, 0n)),
        list.map(row => row[0]),
        list.map(row => BigInt(row.length)),
        list.map(row => BigInt(row.length * size)),
      ],
    };
  }
}

export class ForLoopNestingSumEvens extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y, z] = randVars(3);
    const list = randInts(1n, 10n, randIntNum(4, 8), false);
    return { code: `
      ${x} = ${toPyAtom(list)}
      ${y} = 0
      for ${z} in ${x}:
          if ${z} % 2 == 0:
              ${y} += ${z}
      ${y}
      `,
      options: [
        list.filter(z => z % 2n == 0n).reduce((a, b) => a + b, 0n),
        list.filter(z => z % 2n == 0n).reduce((a, b) => a + b, 0n) + 1n,
        list.filter(z => z % 2n == 0n).reduce((a, b) => a + b, 0n) + BigInt(list.length),
        list.filter(z => z % 2n == 0n).reduce((a, b) => a + b, 0n) - BigInt(list.length),
        list.reduce((a, b) => a + b, 0n),
      ],
    };
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
