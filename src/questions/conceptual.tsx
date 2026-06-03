import { getAnswerClass, QuestionAnswerOptions, QuestionPrompt, QuestionQuizInputAnswerDisplay, QuestionQuizInputSingleLine, QuestionSkipButton, useQuizDisplayMode } from "./QuestionComponents";
import { fuzzyMatch } from "./fuzzyMatch";
import { QuestionTypeDef, QuestionViewProps, SerializedResponse } from "./registry";
import { ConceptualQuestion, UserAnswerFor } from "./types";

function checkAnswer(
  question: ConceptualQuestion,
  answer: UserAnswerFor<'conceptual'>,
): boolean {
  // Check if the correct answer using a check function
  if (typeof question.correct === 'object' && 'check' in question.correct) {
    return question.correct.check(answer);
  }

  // Get the correct answers as a lowercase array
  answer = answer.toLowerCase();
  const correct = (typeof question.correct === 'string' ?
    [question.correct.toLowerCase()] : question.correct.map(c => c.toLowerCase()));

  // Exact match
  if (correct.includes(answer)) { return true; }

  // Fuzzy match
  if (question.fuzzyMatch) {
    return correct.some(c => fuzzyMatch(answer, c));
  }
  return false;
}

function correctAnswerString(correct: string | string[] | { display: string, check: (answer: string) => boolean }): string {
  if (typeof correct === 'string') { return correct; }
  if (Array.isArray(correct)) {
    if (correct.length === 1) { return correct[0]; }
    if (correct.length === 2) { return correct.join(' or '); }
    return correct.slice(0, -1).join(', ') + ', or ' + correct[correct.length - 1];
  }
  return correct.display;
}

function serialize(
  question: ConceptualQuestion,
  answer: UserAnswerFor<'conceptual'> | null,
): SerializedResponse {
  return {
      questionPayload: question.prompt,
      studentAnswer: answer,
      correctAnswer: correctAnswerString(question.correct),
  };
}

function unserialize(response: SerializedResponse): { question: ConceptualQuestion, userAnswer: string | undefined } {
  return {
    question: {
      kind: 'conceptual',
      prompt: response.questionPayload,
      correct: response.correctAnswer,
      options: [],
      fuzzyMatch: true,
    },
    userAnswer: response.studentAnswer ? response.studentAnswer : undefined,
  };
}

function formatHtmlAnswer(answer: string): React.ReactNode {
  return <span>{answer}</span>;
}

const ConceptualView: React.FC<QuestionViewProps<'conceptual'>> = ({
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

  return (
    <>
      <QuestionSkipButton onClick={readOnly ? undefined : onSkip} />
      <QuestionPrompt
        prompt={question.prompt}
        helpMessage={helpMessage}
        onSkip={readOnly ? undefined : onSkip}
      />
      {useQuiz ? (
        <div className="quiz-input-container">
          {userAnswer !== undefined ? (
            <QuestionQuizInputAnswerDisplay
              userAnswer={userAnswer}
              correctAnswer={correctAnswerString(question.correct)}
              isCorrect={isCorrect}
              formatAnswer={formatHtmlAnswer}
              isShowingStats={readOnly}
            />
          ) : (
            <QuestionQuizInputSingleLine
              onSubmit={onAnswer}
              placeholder="Type the answer."
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
}

export const conceptualDef: QuestionTypeDef<'conceptual'> = {
    kind: 'conceptual',
    checkAnswer: checkAnswer,
    serialize,
    unserialize,
    View: ConceptualView,
  };
  