import React from 'react';
import type { CodeOutputQuestion, TopicContext, UserAnswerFor } from './types.ts';
import type { QuestionTypeDef, QuestionViewProps, SerializedResponse } from './registry.ts';
import { getAnswerClass, QuestionAnswerOptions, QuestionCodeBlock, QuestionInput, QuestionPrompt, QuestionQuizInputAnswerDisplay, QuestionQuizInputMultiLine, useQuizDisplayMode } from './QuestionComponents.tsx';
import { createCodeQuestionCore, prepareOptions, type BuildCodeQuestionOpts } from './utils.ts';
import { createException, Exception, normalizeOutputContainers, runGrabOutput, INPUT_START, INPUT_END, injectInputEcho, removeInputEcho } from '../python.ts';
import { SKIPPED } from '../App.tsx';

function correctOutputString(correct: CodeOutputQuestion['correct']): string {
  return correct instanceof Error ? correct.name : correct;
}

function correctOutputStringWithSkipped(correct: CodeOutputQuestion['correct'] | typeof SKIPPED | undefined): string | typeof SKIPPED | undefined {
  if (correct === undefined || correct === SKIPPED) { return correct; }
  return correctOutputString(correct);
}

function removeTrailingSpaces(s: string): string {
  return s.split('\n').map(line => line.trimEnd()).join('\n');
}

function checkAnswerCorrect(userAnswer: string, question: CodeOutputQuestion): boolean {
  let inputs = Array.isArray(question.input) ? question.input : (question.input ? [question.input] : []);
  let correct = correctOutputString(question.correct);
  // if there are inputs or the answer doesn't contain INPUT_START/INPUT_END, deal with input echos
  if (inputs.length !== 0 && !userAnswer.includes(INPUT_START)) {
    // if answer contains all of the inputs at the end of lines, use injectInputEcho()
    const [maybeUserAnswer, remainingInputs] = injectInputEcho(userAnswer, inputs);
    if (remainingInputs.length === 0) { userAnswer = maybeUserAnswer; }
    else { correct = removeInputEcho(correct); } // otherwise use removeInputEcho()
  }
  // remove trailing spaces from each line of the answer and correct
  userAnswer = removeTrailingSpaces(userAnswer.trimEnd());
  correct = removeTrailingSpaces(correct.trimEnd());
  // normalize the output containers and compare
  return normalizeOutputContainers(userAnswer) === normalizeOutputContainers(correct);
}

function checkAnswer(
  question: CodeOutputQuestion,
  answer: UserAnswerFor<'code-output'>,
): boolean {
  return (
    answer === question.correct ||
    answer instanceof Error && question.correct instanceof Error && answer.name === question.correct.name ||
    typeof answer === 'string' && checkAnswerCorrect(answer, question)
  );
}

function parseAnswer(value: string): string | Exception {
  const trimmed = value.trim();
  const errors = [
    'syntaxerror', 'nameerror', 'attributeerror', 'typeerror', 'valueerror',
    'zerodivisionerror', 'indexerror', 'keyerror',
  ];
  if (errors.includes(trimmed.toLowerCase())) {
    return createException(trimmed);
  }
  return trimmed;
}

function formatHtmlAnswer(answer: string): React.ReactNode {
  const outputs: React.ReactNode[] = [];
  let ans = String(answer);  // just in case the answer is not a string...
  // Go through the string and find the INPUT_START and INPUT_END characters
  // Each time add a span with class "input-echo" around the text between the characters
  while (ans.includes(INPUT_START)) {
    const start = ans.indexOf(INPUT_START);
    const end = ans.indexOf(INPUT_END);
    if (start === -1 || end === -1) { break; }
    const echo = (
      <>
        {ans.slice(0, start)}
        <span className="input-echo">{ans.slice(start + 1, end)}</span>
      </>
    );
    outputs.push(echo);
    ans = ans.slice(end + 1);
  }
  outputs.push(ans);
  return <code>{outputs}</code>;
}

function answerToString(answer: string | Exception | null): string {
  if (answer == null) { return ""; }
  if (answer instanceof Error) { return answer.name; }
  return answer;
}

function serialize(
  question: CodeOutputQuestion,
  user: UserAnswerFor<'code-output'> | null,
  ctx?: TopicContext,
): SerializedResponse {
  return {
    questionPayload: ((ctx?.sharedCode ?? '') + '\n' + question.code).trim(),
    studentAnswer: answerToString(user),
    correctAnswer: answerToString(question.correct),
  };
}

function unserialize(response: SerializedResponse): { question: CodeOutputQuestion, userAnswer: string | Exception | undefined } {
  return {
    question: {
      kind: 'code-output',
      code: response.questionPayload,
      correct: parseAnswer(response.correctAnswer),
      options: [],
    },
    userAnswer: response.studentAnswer ? parseAnswer(response.studentAnswer) : undefined,
  };
}

const CodeOutputView: React.FC<QuestionViewProps<'code-output'>> = ({
  question,
  userAnswer,
  isQuiz,
  readOnly,
  isCorrect,
  onSkip,
  helpMessage,
  onAnswer,
}) => {
  const useQuiz = useQuizDisplayMode(isQuiz, readOnly, question.options.length);

  const userAnswerString = correctOutputStringWithSkipped(userAnswer);
  const correctAnswerString = correctOutputString(question.correct);
  const myGetAnswerClass = (answer: string) =>
    getAnswerClass(answer, userAnswerString, correctAnswerString, isCorrect);

  return (
    <>
      <QuestionCodeBlock code={question.code} />
      {!readOnly && <QuestionInput input={question.input} />}
      <QuestionPrompt
        prompt={<>What is the <em>output to the user</em>? {useQuiz && !readOnly && <small>You can either include or omit all of the input echos.</small>}</>}
        helpMessage={helpMessage}
        onSkip={readOnly ? undefined : onSkip}
      />
      {useQuiz ? (
        <div className="quiz-input-container">
          {userAnswer !== undefined ? (
            <QuestionQuizInputAnswerDisplay
              userAnswer={userAnswer}
              correctAnswer={question.correct}
              isCorrect={isCorrect}
              formatAnswer={formatHtmlAnswer}
              isShowingStats={readOnly}
            />
          ) : (
            <QuestionQuizInputMultiLine
              onSubmit={onAnswer}
              placeholder="Enter the output to the user."
            />
          )}
        </div>
      ) : (
        <QuestionAnswerOptions
          options={question.options}
          onSelect={onAnswer}
          getAnswerClass={myGetAnswerClass}
          formatAnswer={formatHtmlAnswer}
          disabled={userAnswer !== undefined}
        />
      )}
    </>
  );
};

export const codeOutputDef: QuestionTypeDef<'code-output'> = {
  kind: 'code-output',
  checkAnswer: checkAnswer,
  serialize,
  unserialize,
  View: CodeOutputView,
};

export function createCodeOutputQuestion(
  code: string,
  options: (string | Exception | undefined)[],
  opts: BuildCodeQuestionOpts<string | Exception>,
  ctx: TopicContext,
): CodeOutputQuestion {
  const { code: cleaned_code, correct, input } = createCodeQuestionCore(
    code, opts, runGrabOutput, (a, b) => a === b, ctx
  );
  return {
    kind: 'code-output',
    code: cleaned_code,
    correct: correct,
    options: prepareOptions(correct, options),
    input,
  };
}
