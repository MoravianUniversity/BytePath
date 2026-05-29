import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, EvalLastLineQuestionGen, CodeOutputQuestionGen } from '../topics';
import { randInt, randInts, randIntNum, randChoice, randVariable, randVars, ASCII_LETTERS, range } from '../util';
import { toPyAtom, toPyStr } from '../python';
import { BASIC_VARIABLES } from './BasicVariables';
import { BASIC_PRINTS } from './BasicPrints';
import { COMPOUND_OPERATORS } from './CompoundOperators';
import { STRING_CONCAT } from './StringConcat';
import { LIST_BASICS } from './ListBasics';
import { BASIC_BRANCHING } from './BasicBranching';
import { BASIC_RELATIONAL_OPERATORS } from './BasicRelationalOperators';


export class WhileLoopInc extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const i = randInt(2n, 10n);
    return { code: `
      ${x} = 0
      while ${x} < ${i}:
          ${x} += 1
      ${x}`,
      options: range(0n, 10n),
    };
  }
}

export class WhileLoopPrintInc extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    const i = randInt(2n, 4n);
    return { code: `
      ${x} = 0
      while ${x} < ${i}:
          print(${x})
          ${x} += 1
      `, options: [
        "0\n1\n2\n3\n4", "1\n2\n3\n4",
        "0\n1\n2\n3", "1\n2\n3",
        "0\n1\n2", "1\n2",
        "0\n1", "1",
        "0", "",
      ] };
  }
}

export class WhileLoopIncPrint extends CodeOutputSubtopic {
  gen(): CodeOutputQuestionGen {
    const x = randVariable();
    const i = randInt(2n, 4n);
    return { code: `
      ${x} = 0
      while ${x} < ${i}:
          ${x} += 1
          print(${x})
      `, options: [
        "0\n1\n2\n3\n4", "1\n2\n3\n4",
        "0\n1\n2\n3", "1\n2\n3",
        "0\n1\n2", "1\n2",
        "0\n1", "1",
        "0", "",
      ] };
  }
}

export class WhileLoopStringConcat extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const i = randInt(2n, 5n);
    const ch = randChoice(ASCII_LETTERS);
    return { code: `
      ${x} = ""
      while len(${x}) < ${i}:
          ${x} += ${toPyStr(ch)}
      ${x}`,
      options: ["", `${ch}`, `${ch}${ch}`, `${ch}${ch}${ch}`, `${ch}${ch}${ch}${ch}`, `${ch}${ch}${ch}${ch}${ch}`],
    };
  }
}

export class WhileLoopDouble extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const i = randInt(3n, 10n);
    return { code: `
      ${x} = 1
      while ${x} < ${i}:
          ${x} *= 2
      ${x}`,
      options: range(2n, 10n),
    };
  }
}

export class WhileLoopFind extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const [x, y] = randVars(2);
    const list = randInts(1n, 10n, randIntNum(3, 5));
    const i = randChoice(list.slice(1));
    return { code: `
      ${y} = ${toPyAtom(list)}
      ${x} = 0
      while ${y}[${x}] != ${i}:
          ${x} += 1
      ${x}`,
      options: [...range(0n, BigInt(list.length)), ...list],
    };
  }
}

export class WhileLoopAppend extends EvalLastLineSubtopic {
  gen(): EvalLastLineQuestionGen {
    const x = randVariable();
    const i = randInt(2n, 5n);
    return { code: `
      ${x} = []
      while len(${x}) < ${i}:
          ${x}.append(len(${x}) + 1)
      ${x}`, options: [
        [], [1n], [1n, 2n], [1n, 2n, 3n], [1n, 2n, 3n, 4n], [1n, 2n, 3n, 4n, 5n],
        [0n, 1n], [0n, 1n, 2n], [0n, 1n, 2n, 3n], [0n, 1n, 2n, 3n, 4n], [0n, 1n, 2n, 3n, 4n, 5n],
      ],
    };
  }
}

export const WHILE_LOOPS = new Topic('while-loops', "While Loops", [
  new WhileLoopInc(),
  new WhileLoopPrintInc(),
  new WhileLoopIncPrint(),
  new WhileLoopStringConcat(),
  new WhileLoopDouble(),
  new WhileLoopFind(),
  new WhileLoopAppend(),
], [BASIC_VARIABLES, BASIC_PRINTS, COMPOUND_OPERATORS, STRING_CONCAT, LIST_BASICS, BASIC_BRANCHING, BASIC_RELATIONAL_OPERATORS]);
