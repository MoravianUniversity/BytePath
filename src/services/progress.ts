import api from './api';

export interface TopicProgress {
  user_id: number;
  topic: string;
  topic_name: string;
  subtopics_completed: number;
  total_subtopics: number;
  completion_percentage: number;
  questions_answered: number;
  last_accessed: string | null;
  class_id?: number | null;
}

export interface UpdateProgressRequest {
  subtopics_completed: number;
  total_subtopics: number;
  class_id?: number | null;
}

export const progressService = {
  async getUserProgress(userId: number, classId?: number | null): Promise<TopicProgress[]> {
    const params = classId != null ? `?class_id=${classId}` : '';
    const response = await api.get(`progress/${userId}${params}`);
    return response.data.progress;
  },

  async getTopicProgress(userId: number, topic: string): Promise<TopicProgress> {
    const response = await api.get(`progress/${userId}/${topic}`);
    return response.data;
  },

  async updateProgress(
    userId: number,
    topic: string,
    data: UpdateProgressRequest,
  ): Promise<void> {
    await api.put(`progress/${userId}/${topic}`, data);
  },

  async incrementProgress(userId: number, topic: string): Promise<void> {
    await api.post(`progress/${userId}/${topic}/increment`);
  },
};
