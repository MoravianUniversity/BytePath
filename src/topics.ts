/**
 * Classes, types, and helper functions for creating topics
 */
import { runLastLine, runGrabOutput, setInput, getInput, PyType, toPyAtom } from './python';
import { shuffle, randChoice, isClose } from './util';
import dedent from 'dedent-js';


// Special case for raw contents that aren't parsed like normal types
export type RawAnswer = {
  type: 'raw';
  value: string;
}
export function raw(value: string): RawAnswer {
  return { type: 'raw', value };
}
export function isRawAnswer(answer: Answer): answer is RawAnswer {
  return typeof answer === 'object' && answer !== null && 'type' in answer && answer.type === 'raw';
}

// For answers, there can be any Python type, along with the following special cases:
// - RawAnswer -> raw output (no transformations, can never be the correct answer)
export type Answer = PyType | RawAnswer;

/**
 * Question: the code to be executed, the correct answer, and the options (includes the correct answer)
 */
export interface Question {
  code: string;
  correct: Answer;
  options: Answer[];
  forceQuiz: boolean;

  // Whether the question uses output (from print()) as the answer instead of the final expression
  // value. The correct answer and all options should be strings in this case.
  usesOutput: boolean;
  input?: string[] | string; // user input for the question
}

/** One tier of progressive help, unlocked after enough failed attempts on this question type. */
export interface QuestionHelpTier {
  afterFailedAttempts: number;
  message: string;
}

/** Progressive help for a question type (defined on the Subtopic). */
export type QuestionHelp = QuestionHelpTier[];

/** Highest-tier help message that applies, or undefined if help should stay hidden. */
export function getActiveHelpMessage(
  help: QuestionHelp | undefined,
  failedAttempts: number,
): string | undefined {
  if (!help?.length) { return undefined; }
  const tiers = [...help].sort((a, b) => a.afterFailedAttempts - b.afterFailedAttempts);
  let message: string | undefined;
  for (const tier of tiers) {
    if (failedAttempts >= tier.afterFailedAttempts) {
      message = tier.message;
    }
  }
  return message;
}

// Check if an answer is correct for a question
export function isAnswerCorrect(answer: Answer, question: Question): boolean {
  return isAnswerSame(answer, question.correct);
}

// Check if two answers are the same
export function isAnswerSame(ans1: Answer, ans2: Answer): boolean {
  // primitive types
  if (ans1 === ans2) { return true; }
  if (typeof ans1 !== typeof ans2) { return false; }
  if (typeof ans1 === 'number') { return isClose(ans1, ans2 as number); }
  if (typeof ans1 === 'symbol') { return ans1.description === (ans2 as symbol).description; }

  // all other answers must be objects or not equal
  if (typeof ans1 !== 'object' || typeof ans2 !== 'object') { return false; }
  if (ans1 === null || ans2 === null) { return false; }
  if (ans1.constructor !== ans2.constructor || Object.isFrozen(ans1) !== Object.isFrozen(ans2)) { return false; }
  if (isRawAnswer(ans1)) { return isRawAnswer(ans2) && ans1.value === ans2.value; }
  if (ans1 instanceof Error) { return ans2 instanceof Error && ans1.name === ans2.name; }
  if (Array.isArray(ans1)) { return Array.isArray(ans2) && ans1.length === ans2.length && ans1.every((v, i) => isAnswerSame(v, ans2[i])); }

  // TODO: these have edge case issues where the keys are not the same, but isAnswerSame() would still return true
  if (ans1 instanceof Map) { return ans2 instanceof Map && ans1.size === ans2.size && Array.from(ans1.entries()).every(([k, v]) => isAnswerSame(ans2.get(k) as Answer, v)); }
  if (ans1 instanceof Set) { return ans2 instanceof Set && ans1.size === ans2.size && Array.from(ans1).every(v => ans2.has(v)); }
  return false;
}

// Filter a list to remove duplicates
export function deduplicateAnswers(answers: Answer[]): Answer[] {
  const output: Answer[] = [];
  for (const answer of answers) {
    if (!output.some((o: Answer) => isAnswerSame(o, answer))) {
      output.push(answer);
    }
  }
  return output;
}

// Convert an answer to a string (mostly using toPyAtom() except for special cases)
export function formatAnswer(answer: Answer): string {
  if (answer === undefined) { return ''; }
  if (isRawAnswer(answer)) { return answer.value; }
  return toPyAtom(answer as PyType);
}

/**
 * Subtopic: a subtopic of a topic. Knows how to generate a specific type of question.
 */
export abstract class Subtopic {
  completed: boolean = false;
  incorrectLastTime: boolean = false;
  /** Incorrect answers on this question type (used for progressive help). */
  failedAttempts: number = 0;
  /** Optional progressive help; hidden on first show, then unlocked by failed attempts. */
  readonly help?: QuestionHelp;

  getActiveHelpMessage(): string | undefined {
    return getActiveHelpMessage(this.help, this.failedAttempts);
  }

  abstract generateQuestion(): Question;
}

/**
 * Topic: a topic is a collection of subtopics.
 */
export class Topic {
  id: string;
  name: string;
  subtopics: Subtopic[];
  dependencies: Topic[];
  order: 'random' | 'random-beginning' | 'sequential' = 'random-beginning';
  sharedCode?: string;
  forceQuiz: boolean = false;

  constructor(id: string, name: string, subtopics: Subtopic[], dependencies: Topic[] = [],
    {order = 'random-beginning', sharedCode, forceQuiz = false}: {order?: 'random' | 'random-beginning' | 'sequential', sharedCode?: string, forceQuiz?: boolean} = {}) {
    this.id = id;
    this.name = name;
    this.subtopics = subtopics;
    this.dependencies = dependencies;
    this.order = order;
    this.sharedCode = sharedCode;
    this.forceQuiz = forceQuiz;
  }

  // Get a random subtopic that needs work
  getRandomSubtopic(): Subtopic | null {
    const incompleteSubtopics = this.subtopics.filter(subtopic => !subtopic.completed);
    if (incompleteSubtopics.length === 0) return null;

    if (this.order === 'sequential') {
      return incompleteSubtopics[0];
    } else if (this.order === 'random-beginning') {
      // more likely to select subtopics closer to the start of the list
      const weights = incompleteSubtopics.map((_, i) => 2 ** (incompleteSubtopics.length - i));
      const sum = weights.reduce((acc, curr) => acc + curr, 0);
      const rand = Math.random() * sum;
      let cumsum = 0;
      for (let i = 0; i < incompleteSubtopics.length; i++) {
        cumsum += weights[i];
        if (rand < cumsum) {
          return incompleteSubtopics[i];
        }
      }
      return incompleteSubtopics[0];
    } else {
      return randChoice(incompleteSubtopics);
    }
  }

  // Check if all subtopics are completed
  get isCompleted(): boolean {
    return this.subtopics.every(subtopic => subtopic.completed);
  }

  // Get the number of subtopics that are completed
  get numCompletedSubtopics(): number {
    return this.subtopics.filter(subtopic => subtopic.completed).length;
  }

  isAccessible(completedTopics: Set<string>): boolean {
    return this.dependencies.length === 0 || this.dependencies.every(dep => completedTopics.has(dep.id));
  }

  start(): void { } // override to do something when the topic is started

  reset(): void {
    this.subtopics.forEach(subtopic => {
      subtopic.completed = false;
      subtopic.incorrectLastTime = false;
      subtopic.failedAttempts = 0;
    });
  }
}

/**
 * TopicGroup: a group that contains topics
 */
export class TopicGroup {
  id: string;
  name: string;
  topics: Topic[];
  expanded: boolean = false;

  constructor(id: string, name: string, topics: Topic[]) {
    this.id = id;
    this.name = name;
    this.topics = topics;
  }

  // Check if all topics in this group are completed
  isCompleted(completedTopics: Set<string>): boolean {
    return this.topics.every(topic => completedTopics.has(topic.id));
  }

  // Check if any topics in this group are completed
  hasCompletedTopics(completedTopics: Set<string>): boolean {
    return this.topics.some(topic => completedTopics.has(topic.id));
  }

  // Get the first incomplete topic in this group
  getFirstIncompleteTopic(completedTopics: Set<string>): Topic | null {
    for (const topic of this.topics) {
      if (!completedTopics.has(topic.id) && topic.isAccessible(completedTopics)) {
        return topic;
      }
    }
    return null;
  }
}

// Create a question
export function createQuestion(
  code: string,
  options: (Answer | undefined)[], // the correct answer is always added to the options
  // if correct is provided, it will be used as the correct answer instead of the actual answer
  // if usesOutput is provided, it will be used to determine whether the question uses output as the answer (default is true if code includes print())
  // if input is provided, it will be used to set the user input for the question
  // if sharedCode is provided, it will be used to add code to the beginning of the question
  {correct, usesOutput, input, sharedCode, forceQuiz}: {correct?: Answer, usesOutput?: boolean, input?: string[] | string, sharedCode?: string, forceQuiz?: boolean} = {}
): Question {
  if (code[0] === '\n' || code[0] === ' ') { code = dedent(code); }
  usesOutput = usesOutput ?? code.includes('print(');
  if (input !== undefined) { setInput(input); }
  const fullCode = sharedCode ? `${sharedCode}\n${code}` : code;
  const actual = usesOutput ? runGrabOutput(fullCode) : runLastLine(fullCode);
  const answer = (correct !== undefined) ? correct : actual;
  if (actual === undefined) { console.error("Syntax error in question"); console.error(code); console.error(actual, answer); }
  else if (answer !== undefined && !isAnswerSame(actual, answer)) {
    console.error("Possible bug in question (answer)"); console.error(code); console.error(actual, answer);
  }
  if (input !== undefined) {
    const remainingInput = getInput();
    if (remainingInput !== "") { console.error("Possible bug in question (input)"); console.error(code); console.error(remainingInput, input); }
  }
  // TODO: don't use toFixed() for numbers?
  let opts = deduplicateAnswers([answer as Answer, ...options.filter(o => o !== undefined).map(o => typeof o === 'number' ? +o.toFixed(5) : o)]);
  forceQuiz = forceQuiz ?? (opts.length === 1);
  return {
    code,
    correct: answer as Answer,
    options: shuffle(opts),
    usesOutput,
    input,
    forceQuiz,
  };
}
