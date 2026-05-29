import { Topic, CodeOutputSubtopic, CodeOutputQuestionGen, EvalLastLineSubtopic, EvalLastLineQuestionGen } from '../topics';
import { randVariable, randVars, randInt, range } from '../util';
import { createException } from '../python';
import { FOR_LOOP_BASICS } from './ForLoopBasics';

export class ForLoopPrintRange extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    const i = randInt(2n, 5n);
    return { code: `
      for ${x} in range(${i}):
          print(${x})
      `,
      options: [
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
      ],
    };
  }
}

export class ForLoopRangeToList extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const i = randInt(2n, 5n);
    return { code: `
      ${y} = []
      for ${x} in range(${i}):
          ${y}.append(${x})
      ${y}`,
      options: [
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
      ],
    };
  }
}

export class ForLoopPrintRangeTo1 extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    return { code: `
      for ${x} in range(1):
          print(${x})
      `,
      options: [
        range(0n, 0n).join('\n'),
        range(0n, 1n).join('\n'),
        range(1n, 1n).join('\n'),
        range(0n, 2n).join('\n'),
        range(1n, 2n).join('\n'),
      ],
    };
  }
}

export class ForLoopPrintRangeTo0 extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    return { code: `
      for ${x} in range(0):
          print(${x})
      `, options: [
        range(0n, 0n).join('\n'),
        createException('ValueError'),
      ],
    };
  }
}

export class ForLoopPrintRangeToNeg1 extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    return { code: `
      for ${x} in range(-1):
          print(${x})
      `, options: [
        range(-1n, -1n).join('\n'),
        range(-1n, 0n).join('\n'),
        range(0n, 0n).join('\n'),
        range(-1n, 0n).reverse().join('\n'),
        createException('ValueError'),
      ],
    };
  }
}

export class ForLoopPrintRangeStartStop extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    const i = randInt(2n, 3n);
    const j = randInt(4n, 5n);
    return { code: `
      for ${x} in range(${i}, ${j}):
          print(${x})
      `, options: [
        range(i, j).join('\n'),
        range(i, j-1n).join('\n'),
        range(i+1n, j).join('\n'),
        range(i, i+j).join('\n'),
        [i, j].join('\n'),
      ],
    };
  }
}

export class ForLoopPrintRangeStartStopPlus1 extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    const i = randInt(2n, 5n);
    return { code: `
      for ${x} in range(${i}, ${i+1n}):
          print(${x})
      `, options: [
        range(i, i).join('\n'),
        range(i, i+1n).join('\n'),
      ],
    };
  }
}

export class ForLoopPrintRangeStartStopSame extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    const i = randInt(2n, 5n);
    return { code: `
      for ${x} in range(${i}, ${i}):
          print(${x})
      `, options: [
        range(i, i).join('\n'),
        range(i, i+1n).join('\n'),
        createException('ValueError'),
      ],
    };
  }
}

export class ForLoopPrintRangeStartStopBackwards extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    const i = randInt(4n, 5n);
    const j = randInt(2n, 3n);
    return { code: `
      for ${x} in range(${i}, ${j}):
          print(${x})
      `, options: [
        range(i, j).join('\n'),
        range(i, j-1n).join('\n'),
        range(i, j).reverse().join('\n'),
        range(i, j-1n).reverse().join('\n'),
        [i, j].join('\n'),
        [j, i].join('\n'),
        createException('ValueError'),
      ],
    };
  }
}

export class ForLoopPrintRangeStartNegStopNeg extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    const i = randInt(-5n, -4n);
    const j = randInt(-3n, -2n);
    return { code: `
      for ${x} in range(${i}, ${j}):
          print(${x})
      `, options: [
        range(i, j).join('\n'),
        range(i, j-1n).join('\n'),
        range(i, j+1n).join('\n'),
        range(i, j).reverse().join('\n'),
        range(i, j-1n).reverse().join('\n'),
        range(i, j+1n).reverse().join('\n'),
        [i, j].join('\n'),
        [j, i].join('\n'),
        createException('ValueError'),
      ],
    };
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
