import React from 'react';
import type { QuestionKind, QuestionFor, UserAnswerFor } from './types';
import type { QuestionTypeDef, QuestionViewProps } from './registry';

function notImplementedView(kind: string): React.FC<QuestionViewProps<QuestionKind>> {
  return function StubView() {
    return <p>Question kind &quot;{kind}&quot; is not implemented yet.</p>;
  };
}

function stubDef<K extends QuestionKind>(kind: K): QuestionTypeDef<K> {
  return {
    kind,
    checkAnswer: () => false,
    serializeResponse: (question: QuestionFor<K>) => ({
      questionPayload: JSON.stringify(question),
      studentAnswer: null,
      correctAnswer: '',
    }),
    View: notImplementedView(kind) as unknown as React.FC<QuestionViewProps<K>>,
  };
}

export const codeEditDef = stubDef('code-edit');
export const traceOrderDef = stubDef('trace-order');
export const conceptualDef = stubDef('conceptual');

export type _StubUserAnswers =
  | UserAnswerFor<'code-edit'>
  | UserAnswerFor<'trace-order'>
  | UserAnswerFor<'conceptual'>;
