import React from 'react';
import type { CodeOutputQuestion, TopicContext, UserAnswerFor } from './types.ts';
import type { QuestionTypeDef, QuestionViewProps, SerializedResponse } from './registry.ts';
import { QuestionAnswerOptions, QuestionCodeBlock, QuestionInput, QuestionPrompt, QuestionQuizInputAnswerDisplay, QuestionQuizInputMultiLine } from './QuestionComponents.tsx';
import { createCodeQuestionCore, prepareOptions, type BuildCodeQuestionOpts } from './utils.ts';
import { Exception, normalizeOutputContainers, runGrabOutput, INPUT_START, INPUT_END, injectInputEcho, removeInputEcho } from '../python.ts';

function correctOutputString(correct: CodeOutputQuestion['correct']): string {
  return correct instanceof Error ? correct.name : correct;
}

function removeTrailingSpaces(s: string): string {
  return s.split('\n').map(line => line.trimEnd()).join('\n');
}

function correct(userAnswer: string, question: CodeOutputQuestion): boolean {
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
    typeof answer === 'string' && correct(answer, question)
  );
}

function answerToString(answer: string | Exception | null): string {
  if (answer == null) { return ""; }
  if (answer instanceof Error) { return answer.message; }
  return answer;
}

function serialize(
  question: CodeOutputQuestion,
  user: UserAnswerFor<'code-output'> | null,
): SerializedResponse {
  return {
    questionPayload: question.code,
    studentAnswer: answerToString(user),
    correctAnswer: answerToString(question.correct),
  };
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

const CodeOutputView: React.FC<QuestionViewProps<'code-output'>> = ({
  question,
  userAnswer,
  isQuiz,
  isCorrect,
  onSkip,
  helpMessage,
  onAnswer,
}) => {
  const useQuiz = isQuiz || question.options.length <= 1;

  const getAnswerClass = (answer: string) => {
    if (userAnswer === undefined) { return ''; }
    if (correct(answer, question)) { return 'correct'; }
    if (answer === userAnswer && !isCorrect) { return 'incorrect'; }
    return '';
  };

  return (
    <>
      <QuestionCodeBlock code={question.code} />
      <QuestionInput input={question.input} />
      <QuestionPrompt prompt={<>What is the <em>output to the user</em>? {useQuiz && <small>You can either include or omit all of the input echos.</small>}</>} helpMessage={helpMessage} onSkip={onSkip} />
      {useQuiz ? (
        <div className="quiz-input-container">
          {userAnswer !== undefined ? (
            <QuestionQuizInputAnswerDisplay
              userAnswer={userAnswer}
              correctAnswer={question.correct}
              isCorrect={isCorrect}
              formatAnswer={formatHtmlAnswer}
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
          getAnswerClass={getAnswerClass}
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
  serializeResponse: serialize,
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
