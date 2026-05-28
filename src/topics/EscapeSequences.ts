import { Topic, createQuestion, EvalLastLineSubtopic, GenerateContext } from '../topics';
import { STRINGS, randChoice, randChoices } from "../util";
import { toPyStr } from "../python";
import { BASIC_VARIABLES } from "./BasicVariables";

export class EscapeSequenceSingleQuote extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    return createQuestion(`'\\''`, ['\'', '\\\''], {}, ctx);
  }
}

export class EscapeSequenceSingleQuotePrint extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    return createQuestion(`print('\\'')`, ['\'', '\\\''], {}, ctx);
  }
}

export class EscapeSequenceDoubleQuote extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    return createQuestion(`"\\""`, ['"', '\\"'], {}, ctx);
  }
}

export class EscapeSequenceDoubleQuotePrint extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    return createQuestion(`print("\\"")`, ['"', '\\"'], {}, ctx);
  }
}

const QUOTES = [
  "She said, \"I'm hungry.\"",
  "He said, \"We're going to the store.\"",
  "They asked, \"Can't you see?\"",
  "We said, \"Let's go.\"",
  "She stated, \"He's here.\"",
  "He said, \"I've been waiting for you.\"",
  "They asked, \"Don't you know?\"",
  "We told you, \"There's a problem.\"",
];

export class EscapeSequenceQuotePrint extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const s = randChoice(QUOTES);
    return createQuestion(`print(${toPyStr(s)})`, [s, toPyStr(s).slice(1, -1), toPyStr(s)], {}, ctx);
  }
}

export class EscapeSequenceNewline extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randChoices(STRINGS, 2);
    return createQuestion(`print('${a}\\n${b}')`, [a, b, `${a}\\n${b}`, `${a}n${b}`, `${a}${b}`, `${a}\n${b}`], {}, ctx);
  }
}

export class EscapeSequenceBackslash extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    const [a, b] = randChoices(STRINGS, 2);
    const s = `${a}\\\\${b}`;
    return createQuestion(`print(${toPyStr(s)})`, [s, `${a}\\${b}`, `${a}\\\\${b}`, `${a}${b}`], {}, ctx);
  }
}

export class EscapeSequenceUnicode extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    // π ° ♣ ⌘ Ω β √ ½ € ¿
    const char = randChoice(['\\u03C0', '\\u00B0', '\\u2663', '\\u2318', '\\u03A9', '\\u03B2', '\\u221A', '\\u00BD', '\\u20AC', '\\u00BF']);
    const code = char.slice(2);
    return createQuestion(`print(${toPyStr(char)})`, [code, char], {}, ctx);
  }
}

export class EscapeSequenceUnicode2 extends EvalLastLineSubtopic {
  generateQuestion(ctx: GenerateContext) {
    // 😛 😜 😝 😞 😟 😠 😡 😢 😣 😤
    const char = randChoice(['\\U0001F61B', '\\U0001F61C', '\\U0001F61D', '\\U0001F61E', '\\U0001F61F', '\\U0001F620', '\\U0001F621', '\\U0001F622', '\\U0001F623', '\\U0001F624']);
    const code = char.slice(2);
    return createQuestion(`print(${toPyStr(char)})`, [code, `\\U${code}`], {}, ctx);
  }
}

export const ESCAPE_SEQUENCES: Topic = new Topic('escape-sequences', 'Escape Sequences', [
  new EscapeSequenceSingleQuote(),
  new EscapeSequenceSingleQuotePrint(),
  new EscapeSequenceDoubleQuote(),
  new EscapeSequenceDoubleQuotePrint(),
  new EscapeSequenceQuotePrint(),
  new EscapeSequenceNewline(),
  new EscapeSequenceBackslash(),
  new EscapeSequenceUnicode(),
  new EscapeSequenceUnicode2(),
], [BASIC_VARIABLES]);