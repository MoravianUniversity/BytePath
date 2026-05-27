import api from './api';

export interface ClassTopicSetting {
  topic_id: string;
  is_enabled?: boolean;
  available_at?: string | null;
  effective_enabled: boolean;
}

export interface ClassTopicSettingInput {
  topic_id: string;
  name?: string;
  is_enabled: boolean;
  available_at: string | null;
}

export const classTopicSettingsService = {
  async getSettings(classId: number): Promise<ClassTopicSetting[]> {
    const response = await api.get(`classes/${classId}/topic-settings`);
    return response.data.settings ?? [];
  },

  async updateSettings(
    classId: number,
    settings: ClassTopicSettingInput[],
  ): Promise<ClassTopicSetting[]> {
    const response = await api.put(`classes/${classId}/topic-settings`, { settings });
    return response.data.settings ?? [];
  },
};
