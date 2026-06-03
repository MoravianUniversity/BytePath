import React from 'react';
import type { CodeWriteQuestion, UserAnswerFor } from './types.ts';
import type { QuestionTypeDef, QuestionViewProps, SerializedResponse } from './registry.ts';
import { getAnswerClass, QuestionAnswerOptions, QuestionPrompt, QuestionQuizInputAnswerDisplay, QuestionQuizInputSingleLine, QuestionSkipButton, useQuizDisplayMode } from './QuestionComponents.tsx';
import { isAnswerSame } from '../topics.ts';
import { toPyAtom, runLastLine, PyType, runGrabOutput, createException } from '../python.ts';
import { SKIPPED } from '../App.tsx';
import { zip } from '../util.ts';

function* testResults(question: CodeWriteQuestion, answer: string): Generator<PyType | undefined, void, unknown> {
  const variables = question.variables;
  const testCases = question.testCases;
  const testsUseOutput = question.testsUseOutput;
  for (const testCase of testCases) {
    const code = (
      Array.from(zip(variables, testCase.values).map(
        ([variable, value]) => `${variable} = ${toPyAtom(value)}`
      )).join('\n')
    ) + '\n' + (question.transform ? question.transform(answer) : answer);
    const lines = code.trimEnd().split('\n');

    // Check for pseudo-syntax errors in the last line
    const lastLine = lines[lines.length - 1].trim();
    const keywordMatch = lastLine.match(/^(return|if|else|elif|while|for|def)[\s(]/);
    if (keywordMatch !== null) {
      yield createException('SyntaxError', `Your code must end with a simple expression, not a ${keywordMatch[1]} statement. Remove the ${keywordMatch[1]} and try again.`);
      continue;
    }
    if (/^\(?[a-zA-Z_][a-zA-Z0-9_]*(,\s*[a-zA-Z_][a-zA-Z0-9_]*)*\)?\s*=/.test(lastLine)) {
      yield createException('SyntaxError', `Your code must end with a simple expression, not an assignment statement. Remove the assignment and try again.`);
      continue;
    }
    if (lastLine.endsWith(':')) {
      yield createException('SyntaxError', `Your code must end with a simple expression, not a line with a colon. Remove the colon and try again.`);
      continue;
    }

    const printMatch = /^print\s*\(/.test(lastLine);
    if (testsUseOutput) {
      if (!printMatch) {
        yield createException('SyntaxError', `Your code must end with a print statement. Add a print statement and try again.`);
      } else {
        yield runGrabOutput(code);
      }
    } else {
      if (printMatch) {
        yield createException('SyntaxError', `Your code must end with a simple expression, not a print statement. Remove the print statement and try again.`);
      } else {
        yield runLastLine(code);
      }
    }
  }
}

function findFirstFailure(question: CodeWriteQuestion, answer: string): { result: PyType | undefined, testCase: { values: PyType[], expected: PyType } } | null {
  for (const [result, testCase] of zip(testResults(question, answer), question.testCases)) {
    if (result === undefined || !isAnswerSame(result, testCase.expected)) {
      return { result, testCase };
    }
  }
  return null;
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

function formatHtmlAnswer(answer: string): React.ReactNode {
  return <code className="language-python">{answer}</code>;
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

function unserialize(response: SerializedResponse): { question: CodeWriteQuestion, userAnswer: string | undefined } {
  return {
    question: {
      kind: 'code-write',
      prompt: response.questionPayload,
      correct: response.correctAnswer,
      options: [],
      variables: [],
      testCases: [],
    },
    userAnswer: response.studentAnswer ? response.studentAnswer : undefined,
  };
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
  readOnly,
  isCorrect,
  onSkip,
  helpMessage,
  onAnswer,
}) => {
  const useQuiz = useQuizDisplayMode(isQuiz, readOnly, question.options.length);
  const myGetAnswerClass = (answer: string) =>
    getAnswerClass(answer, userAnswer, question.correct, isCorrect);

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
    const input_vars = n > 0 ? <> for the {input} {vars}</> : '';
    const expected = <code className="language-python inline-code">{toPyAtom(testCase.expected)}</code>;
    if (result === undefined || result === null) {
      failureMessage = <>no result instead of the correct value {expected}{input_vars}.</>;
    } else if (result instanceof Error) {
      failureMessage = <>an error instead of the correct value {expected}{input_vars}: <code className="inline-code exception">{result.name}: {result.message}</code></>;
    } else {
      failureMessage = <>the value <code className="language-python inline-code">{toPyAtom(result)}</code> instead of the correct value {expected}{input_vars}.</>;
    }
  }
  if (firstFailure !== null) {
    failureMessage = <div className="quiz-input first-failure">Your code produced {failureMessage}</div>;
  }

  return (
    <>
      <QuestionSkipButton onClick={readOnly ? undefined : onSkip} />
      <QuestionPrompt prompt={question.prompt} helpMessage={helpMessage} />
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
            <QuestionQuizInputSingleLine
              onSubmit={onAnswer}
              placeholder="Write the line of code."
            />
          )}
        </div>
      ) : (
        <>
          <QuestionAnswerOptions
            options={question.options}
            onSelect={onAnswer}
            getAnswerClass={myGetAnswerClass}
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
  serialize,
  unserialize,
  View: CodeWriteView,
};
