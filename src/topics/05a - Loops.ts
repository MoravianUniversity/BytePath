import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, EvalLastLineQuestionGen, CodeOutputQuestionGen } from '../topics';
import { randInts, randChoice, randChoices, randIntNum, randVars, randInt, range } from '../util';
import { toPyAtom, toPyStr } from '../python.ts';

import { WHILE_LOOPS } from './WhileLoops';
import { FOR_LOOP_BASICS } from './ForLoopBasics';
import { FOR_LOOP_WITH_RANGE } from './ForLoopWithRange';
import { FOR_LOOP_NESTING } from './ForLoopNesting';

const ANIMALS = ["cat", "dog", "bird", "fish", "snake", "turtle", "duck", "cow", "pig"]

export class ReadRangeBasic extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randInt(3n, 6n);
    return {
      code: `list(range(${a}))`,
      options: [
        range(0n, a), range(0n, a-1n), range(0n, a+1n),
        range(1n, a), range(1n, a-1n), range(1n, a+1n),
      ],
    };
  }
}

export class ReadRangeStartStop extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    let [a, b] = randInts(3n, 6n, 2);
    if (a > b) { [a, b] = [b, a]; }
    return {
      code: `list(range(${a}, ${b}))`,
      options: [
        range(a, b), range(a, b-1n), range(a, b+1n),
        range(b, a), range(b, a-1n), range(b, a+1n),
        range(a-1n, b), range(a-1n, b-1n), range(a-1n, b+1n),
        range(b-1n, a), range(b-1n, a-1n), range(b-1n, a+1n),
      ],
    };
  }
}

export class ReadRangeStartStopBackwards extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    let [a, b] = randInts(3n, 6n, 2);
    if (a < b) { [a, b] = [b, a]; }
    return {
      code: `list(range(${a}, ${b}))`,
      options: [
        range(a, b), range(a, b-1n), range(a, b+1n),
        range(b, a), range(b, a-1n), range(b, a+1n),
        range(a-1n, b), range(a-1n, b-1n), range(a-1n, b+1n),
        range(b-1n, a), range(b-1n, a-1n), range(b-1n, a+1n),
      ],
    };
  }
}

export class ReadRangeStartStopEquals extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const a = randInt(3n, 6n);
    return {
      code: `list(range(${a}, ${a}))`,
      options: [
        [a],
        [a, a],
        [0n],
        [a-1n, a],
        [a-1n],
      ],
    };
  }
}

export class ReadRange0 extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    return {
      code: `list(range(0))`,
      options: [[0n], [0n, 1n], [1n], [-1n]],
    };
  }
}

export class NumberOfLoopsList extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const lst = randChoices(ANIMALS, randIntNum(2, 4));
    return {
      code: `
        ${y} = 0
        for ${x} in ${toPyAtom(lst)}:
            ${y} += 1
        ${y}
      `,
      options: [
        ...range(0n, 5n), ...lst.map(s => BigInt(s.length)),
        lst.reduce((a, b) => a + BigInt(b.length), 0n),
        lst.reduce((a, b) => a + BigInt(b.length-1), 0n)
      ],
    };
  }
}

export class NumberOfLoopsStr extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const str = randChoice(ANIMALS);
    return {
      code: `
        ${y} = 0
        for ${x} in ${toPyStr(str)}:
            ${y} += 1
        ${y}
      `,
      options: [...range(0n, 5n), 1n, BigInt(str.length), BigInt(str.length-1)],
    };
  }
}

export class NumberOfLoopsRange extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(3);
    const num = randInt(3n, 5n);
    return {
      code: `
        ${y} = 0
        for ${x} in range(${num}):
            ${y} += 1
        ${y}
      `,
      options: [...range(0n, 5n), num, num+1n, num-1n],
    };
  }
}

export class NumberOfLoopsRangeNested extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y, z] = randVars(3);
    const [a, b] = randInts(2n, 4n, 2);
    return {
      code: `
        ${z} = 0
        for ${x} in range(${a}):
            for ${y} in range(${b}):
                ${z} += 1
        ${z}
      `,
      options: [a, b, a*b, a*b+1n, a*b-1n, (a+1n)*(b+1n), (a-1n)*(b-1n)],
    };
  }
}

export class ShortCode0 extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const [word, letter] = randChoice([
      ["potato", "t"], ["better", "e"], ["kinetic", "i"], ["perfect", "e"], ["vacant", "a"],
      ["banana", "n"], ["doctor", "o"], ["icicle", "c"], ["library", "r"], ["drawers", "r"],
      ["borrow", "o"],
    ]);
    const [x, y, z, w] = randVars(4);
    return {code: `
      ${x} = ${toPyStr(word)}
      ${y} = ${x}.split(${toPyStr(letter)})
      ${z} = 0
      for ${w} in ${y}:
          ${z} += len(${w})
          print(${z}, ${w})
    `};
  }
}

export class ShortCode1 extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const words = (Math.random() < 0.7) ? randChoices(ANIMALS, 3) : ["Coding", "Is", "Fun!"];
    const [x, y, z] = randVars(4);
    return {code: `
      ${x} = ${toPyAtom(words)}
      for ${y} in ${x}:
          print(len(${y}), ${y})
      for ${z} in range(len(${x})):
          print(${z}, ${x}[${z}])
    `};
  }
}

export class ShortCode2 extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    let [outer, inner] = randInts(2n, 4n, 2);
    if (outer > inner) { [outer, inner] = [inner, outer]; }
    if (outer === 2n) { [outer, inner] = [inner, outer]; }
    const [x, y, z] = randVars(3);
    return {code: `
      for ${x} in range(1, ${outer}):
          ${y} = ''
          for ${z} in range(${inner}):
              ${y} += str(${z})
          print(${x}, ${y})
    `};
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
