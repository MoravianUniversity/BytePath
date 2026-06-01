import { QuestionAnswerOptions, QuestionPrompt, QuestionQuizInputAnswerDisplay, QuestionQuizInputSingleLine, QuestionSkipButton } from "./QuestionComponents";
import { QuestionTypeDef, QuestionViewProps, SerializedResponse } from "./registry";
import { ConceptualQuestion, UserAnswerFor } from "./types";

function checkAnswer(
  question: ConceptualQuestion,
  answer: UserAnswerFor<'conceptual'>,
): boolean {
  answer = answer.toLowerCase();
  const correct = (typeof question.correct === 'string' ?
    [question.correct.toLowerCase()] : question.correct.map(c => c.toLowerCase()));

  // Exact match
  if (correct.includes(answer)) { return true; }

  // Fuzzy match
  if (question.fuzzyMatch) {
    // TODO: return correct.some(c => fuzzyMatch(answer, c));
  }
  return false;
}

function correctAnswerString(correct: string | string[]): string {
  if (typeof correct === 'string') { return correct; }
  if (correct.length === 1) { return correct[0]; }
  if (correct.length === 2) { return correct.join(' or '); }
  return correct.slice(0, -1).join(', ') + ', or ' + correct[correct.length - 1];
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

function formatHtmlAnswer(answer: string): React.ReactNode {
  return <span>{answer}</span>;
}

const ConceptualView: React.FC<QuestionViewProps<'conceptual'>> = ({
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
    if (checkAnswer(question, answer)) { return 'correct'; }
    if (answer === userAnswer && !isCorrect) { return 'incorrect'; }
    return '';
  };

  return (
    <>
      <QuestionSkipButton onClick={onSkip} />
      <QuestionPrompt prompt={question.prompt} helpMessage={helpMessage} />
      {useQuiz ? (
        <div className="quiz-input-container">
          {userAnswer !== undefined ? (
            <QuestionQuizInputAnswerDisplay
              userAnswer={userAnswer}
              correctAnswer={correctAnswerString(question.correct)}
              isCorrect={isCorrect}
              formatAnswer={formatHtmlAnswer}
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
          getAnswerClass={getAnswerClass}
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
    serializeResponse: serialize,
    View: ConceptualView,
  };
  