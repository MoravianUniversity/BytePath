import React from 'react';
import type { CodeOutputQuestion, UserAnswerFor } from './types.ts';
import type { QuestionTypeDef, QuestionViewProps, SerializedResponse } from './registry.ts';
import { QuestionAnswerOptions, QuestionCodeBlock, QuestionInput, QuestionPrompt, QuestionQuizInputAnswerDisplay, QuestionQuizInputMultiLine } from './QuestionComponents.tsx';

function parseQuizAnswer(raw: string): string | undefined {
  const trimmed = raw.trim();
  return trimmed === '' ? undefined : trimmed;
};

function checkAnswer(
  question: CodeOutputQuestion,
  answer: UserAnswerFor<'code-output'>,
): boolean {
  return answer === question.correct;  // TODO: more advanced checking?
}

function serialize(
  question: CodeOutputQuestion,
  user: UserAnswerFor<'code-output'> | null,
): SerializedResponse {
  return {
    questionPayload: question.code,
    studentAnswer: user,
    correctAnswer: question.correct,
  };
}

function formatHtmlAnswer(answer: string): React.ReactNode {
  const outputs: React.ReactNode[] = [];
  let ans = String(answer);  // just in case the answer is not a string...
  // Go through the string and find the \x02 and \x03 characters
  // Each time add a span with class "input-echo" around the text between the characters
  while (ans.includes('\x02')) {
    const start = ans.indexOf('\x02');
    const end = ans.indexOf('\x03');
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
    if (answer === question.correct) { return 'correct'; }
    if (answer === userAnswer && !isCorrect) { return 'incorrect'; }
    return '';
  };

  return (
    <>
      <QuestionCodeBlock code={question.code} />
      <QuestionInput input={question.input} />
      <QuestionPrompt prompt={<>What is the <em>output to the user</em>?</>} helpMessage={helpMessage} onSkip={onSkip} />
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
              parseAnswer={parseQuizAnswer}
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
