import api from './api';
import { formatAnswer } from '../topics';
import type { Question, Answer } from '../topics';

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
    userAnswer: Answer | null,
    isCorrect: boolean,
    timeSpent: number,
    classId?: number | null,
  ): SubmitResponseRequest {
    const studentAnswer = userAnswer === null ? null : formatAnswer(userAnswer);

    return {
      user_id: userId,
      topic: topicId,
      subtopic_type: subtopicType,
      question_code: question.code,
      student_answer: studentAnswer,
      correct_answer: formatAnswer(question.correct),
      is_correct: isCorrect,
      status: userAnswer === null ? 'skipped' : isCorrect ? 'correct' : 'incorrect',
      time_spent: timeSpent,
      class_id: classId ?? null,
    };
  },
};
