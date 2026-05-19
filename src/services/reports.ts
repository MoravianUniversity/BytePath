import api from './api';

export interface StudentReport {
  student_id: number;
  student_name: string;
  student_email: string;
  overall_stats: {
    total_questions_answered: number;
    total_correct: number;
    total_incorrect: number;
    total_skipped: number;
    overall_accuracy: number;
    avg_time_per_question: number;
  };
  topic_breakdown: Array<{
    topic: string;
    topic_name: string;
    questions_answered: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    avg_time: number;
    completion_percentage: number;
  }>;
  struggling_subtopics?: Array<{
    topic: string;
    subtopic_type: string;
    attempts: number;
    accuracy: number;
  }>;
}

export interface ClassOverview {
  total_students: number;
  active_students_last_week: number;
  total_questions_answered: number;
  class_avg_accuracy: number;
  topics_overview: Array<{
    topic: string;
    topic_name: string;
    students_started: number;
    students_completed: number;
    avg_accuracy: number;
  }>;
  rostered_students?: Array<{
    student_id: number | null;
    student_name: string;
    student_email: string;
  }>;
  top_performers: Array<{
    student_id: number;
    student_name: string;
    questions_answered: number;
    accuracy: number;
  }>;
  struggling_students: Array<{
    student_id: number;
    student_name: string;
    questions_answered: number;
    accuracy: number;
  }>;
  recent_activity?: Array<{
    date: string;
    questions_answered: number;
    active_students: number;
  }>;
}

export interface TopicReport {
  topic: string;
  topic_name: string;
  overall_stats: {
    total_students: number;
    students_started: number;
    students_completed: number;
    total_attempts: number;
    avg_accuracy: number;
    avg_time_per_question: number;
  };
  subtopic_difficulty: Array<{
    subtopic_type: string;
    attempts: number;
    unique_students: number;
    success_rate: number;
    avg_time: number;
    difficulty_rating: string;
  }>;
  most_missed_questions: Array<{
    question_code: string;
    subtopic_type: string;
    attempts: number;
    success_rate: number;
  }>;
}

export interface QuestionAnalyticsResponse {
  topic: string;
  analytics: Array<{
    question_code: string;
    subtopic_type: string;
    times_shown: number;
    correct_count: number;
    incorrect_count: number;
    skipped_count: number;
    success_rate: number;
    avg_time_spent: number;
    students_who_saw: number;
  }>;
}

export const reportsService = {
  async getStudentReport(studentId: number, classId?: number | null): Promise<StudentReport> {
    const params = classId ? `?class_id=${classId}` : '';
    const response = await api.get(`reports/student/${studentId}${params}`);
    return response.data;
  },

  async getClassOverview(classId?: number | null): Promise<ClassOverview> {
    const params = classId ? `?class_id=${classId}` : '';
    const response = await api.get(`reports/class/overview${params}`);
    return response.data;
  },

  async getTopicReport(topicId: string, classId?: number | null): Promise<TopicReport> {
    const params = classId ? `?class_id=${classId}` : '';
    const response = await api.get(`reports/topic/${topicId}${params}`);
    return response.data;
  },

  async getQuestionAnalytics(topicId: string, subtopicType?: string, classId?: number | null): Promise<QuestionAnalyticsResponse> {
    const params: Record<string, string | number> = {};
    if (subtopicType) params.subtopic_type = subtopicType;
    if (classId) params.class_id = classId;
    const response = await api.get(`reports/question/${topicId}/analytics`, { params: Object.keys(params).length ? params : undefined });
    return response.data;
  },
};
