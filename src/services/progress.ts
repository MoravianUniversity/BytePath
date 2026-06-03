import api from './api';

export interface TopicProgress {
  user_id: number;
  topic: string;
  topic_name: string;
  subtopics_completed: number;
  max_subtopics_completed: number;
  total_subtopics: number;
  completion_percentage: number;
  best_completion_percentage: number;
  questions_answered: number;
  last_accessed: string | null;
  class_id: number;
}

export interface UpdateProgressRequest {
  subtopics_completed: number;
  total_subtopics: number;
  class_id: number;
}

export const progressService = {
  async getUserProgress(userId: number, classId: number): Promise<TopicProgress[]> {
    const response = await api.get(`progress/${userId}?class_id=${classId}`);
    return response.data.progress;
  },

  async getTopicProgress(
    userId: number,
    topic: string,
    classId: number,
  ): Promise<TopicProgress> {
    const response = await api.get(`progress/${userId}/${topic}?class_id=${classId}`);
    return response.data;
  },

  async updateProgress(
    userId: number,
    topic: string,
    data: UpdateProgressRequest,
  ): Promise<void> {
    await api.put(`progress/${userId}/${topic}`, data);
  },

  async incrementProgress(userId: number, topic: string, classId: number): Promise<void> {
    await api.post(`progress/${userId}/${topic}/increment?class_id=${classId}`);
  },
};
