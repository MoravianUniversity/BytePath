import type { StudentResponse } from '../services/responses';

export type SubtopicCompletionState = {
  completed: boolean;
  incorrectLastTime: boolean;
};

type ResponseLike = Pick<StudentResponse, 'is_correct' | 'attempted_at' | 'id' | 'subtopic_type'>;

function sortResponses<T extends Pick<StudentResponse, 'attempted_at' | 'id'>>(responses: T[]): T[] {
  return responses.slice().sort((a, b) => {
    const aTime = new Date(a.attempted_at).getTime();
    const bTime = new Date(b.attempted_at).getTime();
    if (aTime !== bTime) return aTime - bTime;
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

/**
 * Replay one subtopic-type stream with the live App.tsx rule:
 *   completed = incorrectLastTime ? false : isCorrect
 *   incorrectLastTime = !isCorrect
 */
export function replaySubtopicCompletion(
  responses: Array<Pick<StudentResponse, 'is_correct' | 'attempted_at' | 'id'>>,
): SubtopicCompletionState {
  let incorrectLastTime = false;
  let completed = false;
  for (const response of sortResponses(responses)) {
    const isCorrect = Boolean(response.is_correct);
    completed = incorrectLastTime ? false : isCorrect;
    incorrectLastTime = !isCorrect;
  }
  return { completed, incorrectLastTime };
}

/** Each response that leaves the type complete earns one slot credit. */
export function completionCreditsByType(responses: ResponseLike[]): Map<string, number> {
  const byType = new Map<string, ResponseLike[]>();
  for (const response of responses) {
    const list = byType.get(response.subtopic_type) ?? [];
    list.push(response);
    byType.set(response.subtopic_type, list);
  }
  const credits = new Map<string, number>();
  for (const [subtopicType, typed] of byType) {
    let incorrectLastTime = false;
    let earned = 0;
    for (const response of sortResponses(typed)) {
      const isCorrect = Boolean(response.is_correct);
      const isComplete = incorrectLastTime ? false : isCorrect;
      incorrectLastTime = !isCorrect;
      if (isComplete) earned += 1;
    }
    credits.set(subtopicType, earned);
  }
  return credits;
}
