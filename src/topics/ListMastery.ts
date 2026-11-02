import { Topic, EvalLastLineSubtopic, CodeOutputSubtopic, CodeWriteSubtopic, CodeWriteQuestionGen, ConceptualSubtopic, ConceptualQuestionGen, TopicContext } from '../topics';
import { randChoice, randChoices, randVars, randInt, randInts, randIntNum, randBool, shuffle } from '../util';
import { toPyStr, toPyAtom, asTuple, PyType } from '../python';
import dedent from 'dedent-js';
import { MEMBERSHIP_OPERATORS } from './MembershipOperator';
import { LIST_BASICS } from './ListBasics';
import { LIST_SLICING } from './ListSlicing';

const ANIMALS = ["cat", "dog", "bird", "fish", "frog", "snake", "turtle", "duck", "cow", "pig"]
const VAR_NAMES_SHORT = ["a", "b", "c", "d", "s", "x", "y", "z"];
const VAR_NAMES_LONG = ["foo", "bar", "baz", "qux", "quux"];

class ListMasteryContext extends TopicContext {
  var1: string;
  var2: string;
  var3: string;
  int: bigint;
  str: string;
  list: string[];
  start: bigint;
  stop: bigint;
  constructor() {
    super();
    const [var1, var2, var3] = randVars(3);
    const list_len = randIntNum(4, 7);
    const int = randInt(2n, BigInt(list_len));
    const str = randChoice(ANIMALS);
    const list = randChoices(ANIMALS, list_len);
    let [start, stop] = randInts(1n, BigInt(list_len - 2), 2);
    if (start > stop) { [start, stop] = [stop, start]; }
    this.var1 = var1;
    this.var2 = var2;
    this.var3 = var3;
    this.int = int;
    this.str = str;
    this.list = list;
    this.start = start;
    this.stop = stop;
    this.sharedCode = dedent`
      ${var1} = ${this.int}
      ${var2} = ${toPyStr(this.str)}
      ${var3} = ${toPyAtom(this.list)}
    `;
  }
}

class ListMastery_1 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'Gets a single element from the list at the given index, starting at index 0.' }];
  readonly contextConstructor = ListMasteryContext;
  gen(ctx: ListMasteryContext): string { return `${ctx.var3}[1]`; }
}
class ListMastery_2 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'Negative indexing starts from the end of the list, with -1 being the last element.' }];
  readonly contextConstructor = ListMasteryContext;
  gen(ctx: ListMasteryContext): string { return `${ctx.var3}[-1]`; }
}
class ListMastery_3 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'Gets a single element from the list at the given index, starting at index 0.' }];
  readonly contextConstructor = ListMasteryContext;
  gen(ctx: ListMasteryContext): string { return `${ctx.var3}[${ctx.var1}]`; }
}
class ListMastery_4 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'When slicing, copy between the start index (inclusive) and stop index (exclusive), stopping before the last element in the slice.' }];
  readonly contextConstructor = ListMasteryContext;
  gen(ctx: ListMasteryContext): string { return `${ctx.var3}[${ctx.start}:${ctx.stop}]`; }
}
class ListMastery_5 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'When slicing, copy between the start index (inclusive) and stop index (exclusive), stopping before the last element in the slice. A missing start index means the slice starts at the beginning of the list. A missing stop index means the slice goes to the end of the list.' }];
  readonly contextConstructor = ListMasteryContext;
  gen(ctx: ListMasteryContext): string { return `${ctx.var3}[:${ctx.start}] + ${ctx.var3}[${ctx.stop}:]`; }
}
class ListMastery_6 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The length of a list or string is the actual number of elements in the list (one more than the index of the last element).' }];
  readonly contextConstructor = ListMasteryContext;
  gen(ctx: ListMasteryContext): string { return `len(${ctx.var3})`; }
}
class ListMastery_7 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The length of a list or string is the actual number of elements in the list (one more than the index of the last element).' }];
  readonly contextConstructor = ListMasteryContext;
  gen(ctx: ListMasteryContext): string { return `len(${ctx.var3}[${randInt(1n, BigInt(ctx.list.length-1))}])`; }
}
class ListMastery_8 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The membership operator checks if an entire element is in a list or string.' }];
  readonly contextConstructor = ListMasteryContext;
  gen(ctx: ListMasteryContext): string { return `${ctx.var2} ${randChoice(["not ", ""])}in ${ctx.var3}`; }
}
class ListMastery_9 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The membership operator checks if an entire element is in a list or string.' }];
  readonly contextConstructor = ListMasteryContext;
  gen(ctx: ListMasteryContext): string {
    const ch = randChoice([...ctx.list.slice(0, 2).join("")]);
    return `${toPyAtom(ch)} ${randChoice(["not ", ""])}in ${ctx.var3}`;
  }
}
class ListMastery_10 extends EvalLastLineSubtopic {
  readonly help = [{ afterFailedAttempts: 1, message: 'The membership operator checks if an entire element is in a list or string.' }];
  readonly contextConstructor = ListMasteryContext;
  gen(ctx: ListMasteryContext): string {
    const ch = randChoice([...ctx.list.slice(1, 3).join("")]);
    return `${toPyAtom(ch)} in ${ctx.var3}[${randInt(1n, 3n)}]`;
  }
}

class ListMastery_Long extends CodeOutputSubtopic {
  readonly showWorkspace = true;
  gen(): string {
    const [lst_var, item_var, none_var] = randVars(3);
    const alphabet = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
    const list_len = randIntNum(3, 5);
    const lst = randChoices(alphabet, list_len+2);
    const ch1 = lst[0];
    const ch2 = lst[1];
    lst.splice(0, 2);
    const [index1, index2, index3] = randInts(0n, BigInt(list_len-1), 3);
    const lst_repr = lst.map(item => toPyStr(item));
    lst_repr.splice(Number(index3), 0, item_var);
    const option = randIntNum(0, 2);

    let code = `${item_var} = ${toPyStr(ch1)}\n`
    code += `${lst_var} = [${lst_repr.join(", ")}]\n`
    if (option <= 1) {
      code += `${item_var} = ${lst_var}[${index1}]\n`
    }
    if (option >= 1) {
      code += `${lst_var}[${index2}] = ${item_var}\n`
    }
    if (randBool(0.67)) {
      code += `${none_var} = ${lst_var}.append(${toPyStr(ch2)})\n`
    } else {
      code += `${none_var} = ${lst_var}.sort()\n`
    }
    const vars = shuffle([item_var, none_var, lst_var]);
    code += `print(${vars[0]}, ${vars[1]}, ${vars[2]})`
    return code;
  }
}

function asSequence(items: string[], typ: 'list' | 'tuple'): PyType {
  return typ === 'tuple' ? asTuple(items) : items;
}

class ListMastery_Write extends CodeWriteSubtopic {
  gen(): CodeWriteQuestionGen {
    const varName = randChoice(VAR_NAMES_LONG);
    const typ = randChoice(['list', 'tuple'] as const);
    const size = randIntNum(2, 4);
    const other = randChoice(VAR_NAMES_SHORT);
    const otherLit = `'${other}'`;
    const seq = (items: string[]) => asSequence(items, typ);

    const middle = (): CodeWriteQuestionGen => {
      const samples = [
        ["cat", "dog", "bird"],
        ["cat", "dog", "bird", "fish"],
        ["ant", "bee", "cow", "pig", "duck"],
      ];
      return {
        prompt: `Write the code to get the element in the middle of the \`${typ}\` variable \`${varName}\`.`,
        correct: `${varName}[len(${varName})//2]`,
        variables: [varName],
        testCases: samples.map(items => ({
          values: [seq(items)],
          expected: items[Math.floor(items.length / 2)],
        })),
      };
    };
    const last = (): CodeWriteQuestionGen => {
      const samples = [
        ["cat", "dog", "bird"],
        ["ant", "bee", "cow", "pig", "duck"],
      ];
      return {
        prompt: `Write the code to get the last element of the \`${typ}\` variable \`${varName}\`.`,
        correct: `${varName}[-1]`,
        variables: [varName],
        testCases: samples.map(items => ({
          values: [seq(items)],
          expected: items[items.length - 1],
        })),
      };
    };
    const firstSlice = (): CodeWriteQuestionGen => {
      const samples = [
        ["cat", "dog", "bird", "fish", "frog", "snake"],
        ["cow", "pig", "duck", "ant", "bee", "eel"],
      ];
      return {
        prompt: `Write the code to get the first ${size} elements of the \`${typ}\` variable \`${varName}\`.`,
        correct: `${varName}[:${size}]`,
        variables: [varName],
        testCases: samples.map(items => ({
          values: [seq(items)],
          expected: seq(items.slice(0, size)),
        })),
      };
    };
    const lastSlice = (): CodeWriteQuestionGen => {
      const samples = [
        ["cat", "dog", "bird", "fish", "frog", "snake"],
        ["cow", "pig", "duck", "ant", "bee", "eel"],
      ];
      return {
        prompt: `Write the code to get the last ${size} elements of the \`${typ}\` variable \`${varName}\`.`,
        correct: `${varName}[-${size}:]`,
        variables: [varName],
        testCases: samples.map(items => ({
          values: [seq(items)],
          expected: seq(items.slice(-size)),
        })),
      };
    };
    const contains = (): CodeWriteQuestionGen => {
      const samples: [string[], boolean][] = [
        [[other, "cat", "dog"], true],
        [["cat", "dog", "bird"], false],
        [["bird", "frog", other], true],
      ];
      return {
        prompt: `Write the code to check if the value \`${otherLit}\` is in the \`${typ}\` variable \`${varName}\`.`,
        correct: `${otherLit} in ${varName}`,
        variables: [varName],
        testCases: samples.map(([items, expected]) => ({
          values: [seq(items)],
          expected,
        })),
      };
    };

    // The middle-element prompt is duplicated so it is chosen more often.
    return randChoice([middle, middle, last, firstSlice, lastSlice, contains])();
  }
}

function normAnswer(answer: string): string {
  return answer.toLowerCase().replace(/[`'"]/g, '').replace(/[.]/g, '').replace(/\s+/g, ' ').trim();
}

/** Words such as "mutable" attach to the nearest list/tuple, with adjectives before a noun belonging to that noun. */
function traitsFor(answer: string): { list: Set<string>, tuple: Set<string> } {
  const tokens = normAnswer(answer).replace(/,/g, ' , ').split(' ').filter(Boolean);
  const nouns: { kind: 'list' | 'tuple', index: number }[] = [];
  tokens.forEach((token, index) => {
    if (/^lists?$/.test(token)) { nouns.push({ kind: 'list', index }); }
    if (/^tuples?$/.test(token)) { nouns.push({ kind: 'tuple', index }); }
  });
  const traits = { list: new Set<string>(), tuple: new Set<string>() };
  tokens.forEach((token, index) => {
    let trait = '';
    if (/^(?:mutable|immutable)$/.test(token)) {
      trait = (token === 'mutable' && /^(?:not|isnt|isn't|arent|aren't)$/.test(tokens[index - 1] ?? '')) ? 'immutable' : token;
    } else if (/^(?:changed|changeable|modified)$/.test(token) && /^(?:be|being)$/.test(tokens[index - 1] ?? '')) {
      trait = /^(?:not|cannot|can't|cant)$/.test(tokens[index - 2] ?? '') ? 'fixed' : 'changeable';
    } else if (token === 'change' && /^(?:can|cannot|can't|cant)$/.test(tokens[index - 1] ?? '')) {
      trait = tokens[index - 1] === 'can' ? 'changeable' : 'fixed';
    } else if (/^(?:cannot|can't|cant)$/.test(token)) {
      trait = 'fixed';
    }
    if (!trait || nouns.length === 0) { return; }
    const next = nouns.find(noun => noun.index > index);
    const prev = [...nouns].reverse().find(noun => noun.index < index);
    const target = (next && next.index === index + 1) ? next
      : (prev && index - prev.index <= 4) ? prev
      : next ?? prev;
    if (target) { traits[target.kind].add(trait); }
  });
  return traits;
}

const SHORT_ANSWERS: { prompt: string, display: string, check: (answer: string) => boolean }[] = [
  {
    prompt: "What is the primary functional difference between a `list` and a `tuple`?",
    display: "list is mutable, tuple is immutable",
    check: (answer) => {
      const traits = traitsFor(answer);
      const listMutable = traits.list.has('mutable') || traits.list.has('changeable');
      const tupleImmutable = traits.tuple.has('immutable') || traits.tuple.has('fixed');
      const swapped = traits.list.has('immutable') || traits.list.has('fixed') || traits.tuple.has('mutable') || traits.tuple.has('changeable');
      return listMutable && tupleImmutable && !swapped;
    },
  },
  {
    prompt: "When looking at a slice, how can you mentally compute the number of elements in the resulting list? (not using `len()`)",
    display: "stop - start",
    check: (answer) => {
      const a = normAnswer(answer);
      if (/start\s*(?:-|minus)\s*(?:the\s+)?(?:stop|end)/.test(a)) { return false; }
      return /(?:stop|end)\s*(?:-|minus)\s*(?:the\s+)?start/.test(a)
        || /subtract\s+(?:the\s+)?start(?:\s+index)?\s+from\s+(?:the\s+)?(?:stop|end)/.test(a);
    },
  },
  {
    prompt: "When a slice has both ends missing, what does that mean?",
    display: "Copy the entire list.",
    check: (answer) => {
      const a = normAnswer(answer);
      if (a === '[:]' || a === ':') { return true; }
      const copy = /\b(?:copy|copies|copying)\b/.test(a);
      const entire = /\b(?:entire|whole|full|all|everything)\b/.test(a);
      const list = /\blists?\b/.test(a);
      return (copy && (entire || list)) || (entire && list);
    },
  },
  {
    prompt: "What does the `list.sort()` method return?",
    display: "None",
    check: (answer) => {
      const a = normAnswer(answer);
      return /\b(?:none|nothing)\b/.test(a) && !/\bnot\b/.test(a);
    },
  },
];

class ListMastery_ShortAnswer extends ConceptualSubtopic {
  gen(): ConceptualQuestionGen {
    const question = randChoice(SHORT_ANSWERS);
    return {
      prompt: question.prompt,
      correct: { display: question.display, check: question.check },
    };
  }
}

export const LIST_MASTERY = new Topic('list-mastery', 'List Mastery', [
  new ListMastery_1(),
  new ListMastery_2(),
  new ListMastery_3(),
  new ListMastery_4(),
  new ListMastery_5(),
  new ListMastery_6(),
  new ListMastery_7(),
  new ListMastery_8(),
  new ListMastery_9(),
  new ListMastery_10(),
  new ListMastery_Write(),
  new ListMastery_ShortAnswer(),
  new ListMastery_Long(),
], [LIST_BASICS, MEMBERSHIP_OPERATORS, LIST_SLICING],
{order: 'sequential', forceQuiz: true, skippable: true});
