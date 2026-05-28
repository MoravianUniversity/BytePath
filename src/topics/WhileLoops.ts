import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
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
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const i = randInt(2n, 10n);
    return createQuestion(`
      ${x} = 0
      while ${x} < ${i}:
          ${x} += 1
      ${x}`, range(0n, 10n), {}, ctx);
  }
}

export class WhileLoopPrintInc extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const i = randInt(2n, 4n);
    return createQuestion(`
      ${x} = 0
      while ${x} < ${i}:
          print(${x})
          ${x} += 1
      `, [
        "0\n1\n2\n3\n4", "1\n2\n3\n4",
        "0\n1\n2\n3", "1\n2\n3",
        "0\n1\n2", "1\n2",
        "0\n1", "1",
        "0", "",
      ], {}, ctx);
  }
}

export class WhileLoopIncPrint extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const i = randInt(2n, 4n);
    return createQuestion(`
      ${x} = 0
      while ${x} < ${i}:
          ${x} += 1
          print(${x})
      `, [
        "0\n1\n2\n3\n4", "1\n2\n3\n4",
        "0\n1\n2\n3", "1\n2\n3",
        "0\n1\n2", "1\n2",
        "0\n1", "1",
        "0", "",
      ], {}, ctx);
  }
}

export class WhileLoopStringConcat extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const i = randInt(2n, 5n);
    const ch = randChoice(ASCII_LETTERS);
    return createQuestion(`
      ${x} = ""
      while len(${x}) < ${i}:
          ${x} += ${toPyStr(ch)}
      ${x}`, ["", `${ch}`, `${ch}${ch}`, `${ch}${ch}${ch}`, `${ch}${ch}${ch}${ch}`, `${ch}${ch}${ch}${ch}${ch}`], {}, ctx);
  }
}

export class WhileLoopDouble extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const i = randInt(3n, 10n);
    return createQuestion(`
      ${x} = 1
      while ${x} < ${i}:
          ${x} *= 2
      ${x}`, range(2n, 10n), {}, ctx);
  }
}

export class WhileLoopFind extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [x, y] = randVars(2);
    const list = randInts(1n, 10n, randIntNum(3, 5));
    const i = randChoice(list.slice(1));
    return createQuestion(`
      ${y} = ${toPyAtom(list)}
      ${x} = 0
      while ${y}[${x}] != ${i}:
          ${x} += 1
      ${x}`, [...range(0n, BigInt(list.length)), ...list], {}, ctx);
  }
}

export class WhileLoopAppend extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const x = randVariable();
    const i = randInt(2n, 5n);
    return createQuestion(`
      ${x} = []
      while len(${x}) < ${i}:
          ${x}.append(len(${x}) + 1)
      ${x}`, [
        [], [1n], [1n, 2n], [1n, 2n, 3n], [1n, 2n, 3n, 4n], [1n, 2n, 3n, 4n, 5n],
        [0n, 1n], [0n, 1n, 2n], [0n, 1n, 2n, 3n], [0n, 1n, 2n, 3n, 4n], [0n, 1n, 2n, 3n, 4n, 5n],
      ], {}, ctx);
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
