import React from 'react';
import type { FuncWriteQuestion, UserAnswerFor } from './types.ts';
import type { QuestionTypeDef, QuestionViewProps, SerializedResponse } from './registry.ts';
import { QuestionAnswerOptions, QuestionPrompt, QuestionQuizInputAnswerDisplay, QuestionQuizInputMultiLine, QuestionSkipButton, useQuizDisplayMode } from './QuestionComponents.tsx';
import { isAnswerSame } from '../topics.ts';
import { toPyAtom, runLastLine, PyType, runGrabOutput, createException } from '../python.ts';
import { SKIPPED } from '../App.tsx';
import { zip } from '../util.ts';

function* testResults(question: FuncWriteQuestion, answer: string): Generator<PyType | undefined, void, unknown> {
  const testCases = question.testCases;
  const testsUseOutput = question.testsUseOutput;
  for (const testCase of testCases) {
    const code = (
        answer + '\n' +
        `${question.name}(${testCase.args.map((value) => toPyAtom(value)).join(', ')})`
    );

    // Make sure the function is defined
    const match = /^def\s+${question.name}\s*\(.*\)(\s*->[^:]*)?\s*:\s*$/.test(answer);
    if (!match) {
      yield createException('SyntaxError', 'Your function must be defined. Add a `def function_name(...):` statement and try again.');
      continue;
    }

    if (testsUseOutput) {
      yield runGrabOutput(code);
    } else {
      yield runLastLine(code);
    }
  }
}

function checkAnswer(
  question: FuncWriteQuestion,
  answer: string,
): boolean {
  for (const [result, testCase] of zip(testResults(question, answer), question.testCases)) {
    if (result === undefined || !isAnswerSame(result, testCase.expected)) { return false; }
  }
  return true;
}

function findFirstFailure(question: FuncWriteQuestion, answer: string): { result: PyType | undefined, testCase: { args: PyType[], expected: PyType } } | null {
  for (const [result, testCase] of zip(testResults(question, answer), question.testCases)) {
    if (result === undefined || !isAnswerSame(result, testCase.expected)) {
      return { result, testCase };
    }
  }
  return null;
}

function serialize(
  question: FuncWriteQuestion,
  user: UserAnswerFor<'func-write'> | null,
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

const FuncWriteView: React.FC<QuestionViewProps<'func-write'>> = ({
  question,
  userAnswer,
  isQuiz,
  isShowingStats = false,
  isCorrect,
  onSkip,
  helpMessage,
  onAnswer,
}) => {
  const useQuiz = useQuizDisplayMode(isQuiz, isShowingStats, question.options.length);
  const readOnly = isShowingStats;

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
    const callArgs = testCase.args.map((arg) => toPyAtom(arg)).join(', ');
    const call = <code className="language-python inline-code">{question.name}({callArgs})</code>;
    const expected = <code className="language-python inline-code">{toPyAtom(testCase.expected)}</code>;
    if (result === undefined || result === null) {
      failureMessage = <>{call}, your function returned nothing instead of the correct return value {expected}.</>;
    } else if (result instanceof Error) {
      failureMessage = <>{call}, your function returned an error instead of the correct return value {expected}: <code className="inline-code exception">{result.message}</code>.</>;
    } else {
      failureMessage = <>{call}, your function returned the value <code className="language-python inline-code">{toPyAtom(result)}</code> instead of the correct return value {expected}.</>;
    }
  }
  if (firstFailure !== null) {
    failureMessage = <div className="quiz-input first-failure">When calling {failureMessage}</div>;
  }

  return (
    <>
      <QuestionSkipButton onClick={readOnly ? undefined : onSkip} />
      <QuestionPrompt prompt={question.prompt} helpMessage={readOnly ? undefined : helpMessage} />
      {useQuiz ? (
        <div className="quiz-input-container">
          {userAnswer !== undefined ? (
            <QuestionQuizInputAnswerDisplay
              userAnswer={userAnswer}
              correctAnswer={question.correct}
              isCorrect={isCorrect}
              formatAnswer={formatHtmlAnswer}
              isShowingStats={readOnly}
            >
              {failureMessage}
            </QuestionQuizInputAnswerDisplay>
          ) : (
            <QuestionQuizInputMultiLine
              onSubmit={onAnswer}
              placeholder="Write the function definition."
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

export const funcWriteDef: QuestionTypeDef<'func-write'> = {
  kind: 'func-write',
  checkAnswer: checkAnswer,
  serializeResponse: serialize,
  View: FuncWriteView,
};
