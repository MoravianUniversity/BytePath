import React from 'react';
import type { CodeWriteQuestion, UserAnswerFor } from './types.ts';
import type { QuestionTypeDef, QuestionViewProps, SerializedResponse } from './registry.ts';
import { QuestionAnswerOptions, QuestionPrompt, QuestionQuizInputAnswerDisplay, QuestionQuizInputSingleLine, QuestionSkipButton } from './QuestionComponents.tsx';
import { isAnswerSame } from '../topics.ts';
import { toPyAtom, runLastLine, PyType } from '../python.ts';
import { SKIPPED } from '../App.tsx';
import { zip } from '../util.ts';

function parseQuizAnswer(raw: string): string | undefined {
  const trimmed = raw.trim();
  return trimmed === '' ? undefined : trimmed;
};

function* testResults(question: CodeWriteQuestion, answer: string): Generator<PyType | undefined, void, unknown> {
  const variables = question.variables;
  const testCases = question.testCases;
  for (const testCase of testCases) {
    const code = (
      Array.from(zip(variables, testCase.values).map(
        ([variable, value]) => `${variable} = ${toPyAtom(value)}`
      )).join('\n')
    ) + '\n' + answer;
    yield runLastLine(code);
  }
}

function checkAnswer(
  question: CodeWriteQuestion,
  answer: string,
): boolean {
  for (const [result, testCase] of zip(testResults(question, answer), question.testCases)) {
    if (result === undefined || !isAnswerSame(result, testCase.expected)) { return false; }
  }
  return true;
}

function findFirstFailure(question: CodeWriteQuestion, answer: string): { result: PyType | undefined, testCase: { values: PyType[], expected: PyType } } | null {
  for (const [result, testCase] of zip(testResults(question, answer), question.testCases)) {
    if (result === undefined || !isAnswerSame(result, testCase.expected)) {
      return { result, testCase };
    }
  }
  return null;
}

function serialize(
  question: CodeWriteQuestion,
  user: UserAnswerFor<'code-write'> | null,
): SerializedResponse {
  return {
    questionPayload: question.prompt,
    studentAnswer: user,
    correctAnswer: question.correct,
  };
}

function formatHtmlAnswer(answer: string): React.ReactNode {
  return <code className="language-python">{answer}</code>;
}

function getJoiner(index: number, n: number): string {
  if (n === 1) { return ''; }
  if (n === 2) { return index === 0 ? ' and ' : ''; }
  return index < n - 2 ? ', ' : (index === n - 2 ? ', and ' : '');
}

const CodeWriteView: React.FC<QuestionViewProps<'code-write'>> = ({
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
    if (answer === question.correct) { return 'correct'; }
    if (answer === userAnswer && !isCorrect) { return 'incorrect'; }
    return '';
  };

  const hasIncorrectAnswer = userAnswer !== undefined && userAnswer !== SKIPPED && !isCorrect;
  const firstFailure = hasIncorrectAnswer ? findFirstFailure(question, userAnswer) : null;
  let failureMessage = <></>;
  if (firstFailure !== null) {
    const { result, testCase } = firstFailure;
    const n = question.variables.length;
    const input = n > 1 ? 'inputs' : 'input';
    const vars = Array.from(zip(question.variables, testCase.values)).map(
      ([variable, value], index) => {
        const joiner = getJoiner(index, n);
        return <><code className="language-python inline-code">{variable}</code> = <code className="language-python inline-code">{toPyAtom(value)}</code>{joiner}</>;
      }
    );
    const expected = <code className="language-python inline-code">{toPyAtom(testCase.expected)}</code>;
    if (result === undefined || result === null) {
      failureMessage = <>no result instead of the correct value {expected} for the {input} {vars}.</>;
    } else if (result instanceof Error) {
      failureMessage = <>an error instead of the correct value {expected} for the {input} {vars}: <code className="inline-code exception">{result.message}</code>.</>;
    } else {
      failureMessage = <>the value <code className="language-python inline-code">{toPyAtom(result)}</code> instead of the correct value {expected} for the {input} {vars}.</>;
    }
  }
  if (firstFailure !== null) {
    failureMessage = <div className="quiz-input first-failure">Your code produced {failureMessage}</div>;
  }

  return (
    <>
      <QuestionSkipButton onClick={onSkip} />
      <QuestionPrompt prompt={question.prompt} helpMessage={helpMessage} />
      {useQuiz ? (
        <div className="quiz-input-container">
          {userAnswer !== undefined ? (
            <QuestionQuizInputAnswerDisplay
              userAnswer={userAnswer}
              correctAnswer={question.correct}
              isCorrect={isCorrect}
              formatAnswer={formatHtmlAnswer}
            >
              {failureMessage}
            </QuestionQuizInputAnswerDisplay>
          ) : (
            <QuestionQuizInputSingleLine
              onSubmit={onAnswer}
              parseAnswer={parseQuizAnswer}
              placeholder="Write the line of code."
            />
          )}
        </div>
      ) : (
        <>
          <QuestionAnswerOptions
            options={question.options}
            onSelect={onAnswer}
            getAnswerClass={getAnswerClass}
            formatAnswer={formatHtmlAnswer}
            disabled={userAnswer !== undefined}
          />
          {failureMessage}
        </>
      )}
    </>
  );
};

export const codeWriteDef: QuestionTypeDef<'code-write'> = {
  kind: 'code-write',
  checkAnswer: checkAnswer,
  serializeResponse: serialize,
  View: CodeWriteView,
};
