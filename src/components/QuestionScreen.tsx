import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SKIPPED } from '../App';
import type { Question, UserAnswer } from '../questions/types';
import { QUESTION_TYPES, checkAnswer } from '../questions/registry';
import { getCorrectClass } from '../questions/QuestionComponents.tsx';
import '../code.css';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';

interface QuestionScreenProps {
  question: Question;
  userAnswer?: UserAnswer | typeof SKIPPED;
  onAnswerSelect: (answer: UserAnswer | undefined, question: Question) => void;
  isQuiz: boolean;
  canSkip: boolean;
  helpMessage?: string;
}

const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  userAnswer,
  onAnswerSelect,
  isQuiz,
  canSkip,
  helpMessage,
}) => {
  const def = QUESTION_TYPES[question.kind];
  const isCompleted = userAnswer !== undefined;
  const skipped = userAnswer === SKIPPED;
  const isCorrect = isCompleted && !skipped && checkAnswer(question, userAnswer) === true;

  useEffect(() => {
    Prism.highlightAll();
  }, [question, userAnswer, isQuiz]);

  const correctClass = getCorrectClass(userAnswer, isCorrect);

  const handleAnswer = (
    element: EventTarget | null,
    answer: UserAnswer | undefined,
  ) => {
    if (answer === undefined && !canSkip) { return; }
    const correct = answer !== undefined && checkAnswer(question, answer) === true;
    if (element instanceof HTMLElement && correct) {
      const rect = element.getBoundingClientRect();
      const originX = (rect.x + 0.5 * rect.width) / window.innerWidth;
      const originY = (rect.y + rect.height) / window.innerHeight;
      confetti({
        particleCount: 100,
        spread: 70,
        decay: 0.8,
        gravity: 1.5,
        origin: { x: originX, y: originY },
      });
    }
    onAnswerSelect(answer, question);
  };

  return (
    <div className={`question-screen ${isCompleted ? 'completed' : ''} ${question.kind} ${correctClass}`}>
      <div className="question-content">
        <def.View
          question={question as never}
          userAnswer={userAnswer as never}
          isQuiz={isQuiz || (question.forceQuiz ?? false)}
          isCorrect={isCorrect}
          onSkip={canSkip && !isCompleted ? () => handleAnswer(null, undefined) : undefined}
          onAnswer={handleAnswer as never}
          helpMessage={helpMessage}
        />
      </div>
    </div>
  );
};

export default QuestionScreen;
