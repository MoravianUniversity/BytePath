import api from './api';
import type { Question } from '../topics';
import type { UserAnswer } from '../questions/types';
import { serializeQuestionResponse } from '../questions/registry';

export interface SubmitResponseRequest {
  user_id: number;
  topic: string;
  subtopic_type: string;
  question_code: string;
  student_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  status: 'correct' | 'incorrect' | 'skipped';
  time_spent: number;
  class_id?: number | null;
}

export interface StudentResponse {
  id: number;
  user_id: number;
  topic: string;
  subtopic_type: string;
  question_code: string;
  student_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  status: string;
  time_spent: number;
  attempted_at: string;
}

export const responsesService = {
  async submitResponse(data: SubmitResponseRequest): Promise<void> {
    await api.post('responses', data);
  },

  async getStudentResponses(studentId: number, classId?: number | null): Promise<StudentResponse[]> {
    const params = classId != null ? `?class_id=${classId}` : '';
    const response = await api.get(`responses/student/${studentId}${params}`);
    return response.data.responses;
  },

  formatResponseData(
    userId: number,
    topicId: string,
    subtopicType: string,
    question: Question,
    userAnswer: UserAnswer | null,
    isCorrect: boolean,
    timeSpent: number,
    classId?: number | null,
  ): SubmitResponseRequest {
    const { questionPayload, studentAnswer, correctAnswer } = serializeQuestionResponse(
      question,
      userAnswer,
    );

    return {
      user_id: userId,
      topic: topicId,
      subtopic_type: subtopicType,
      question_code: questionPayload,
      student_answer: studentAnswer,
      correct_answer: correctAnswer,
      is_correct: isCorrect,
      status: userAnswer === null ? 'skipped' : isCorrect ? 'correct' : 'incorrect',
      time_spent: timeSpent,
      class_id: classId ?? null,
    };
  },
};
