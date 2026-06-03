import api from './api';

export interface ClassTopicSetting {
  topic_id: string;
  section?: string | null;
  is_enabled?: boolean;
  available_at?: string | null;
  is_assigned?: boolean;
  due_at?: string | null;
  effective_enabled: boolean;
}

export interface ClassTopicSettingsResponse {
  global_settings: ClassTopicSetting[];
  section_overrides: Record<string, ClassTopicSetting[]>;
}

export interface ClassTopicSettingInput {
  topic_id: string;
  name?: string;
  is_enabled: boolean;
  available_at: string | null;
  is_assigned: boolean;
  due_at: string | null;
}

export const classTopicSettingsService = {
  async getSettings(classId: number): Promise<ClassTopicSettingsResponse> {
    const response = await api.get(`classes/${classId}/topic-settings`);
    return {
      global_settings: response.data.global_settings ?? [],
      section_overrides: response.data.section_overrides ?? {},
    };
  },

  async updateSettings(
    classId: number,
    settings: ClassTopicSettingInput[],
    options?: { section?: string | null; replace_scope?: boolean },
  ): Promise<ClassTopicSettingsResponse> {
    const response = await api.put(`classes/${classId}/topic-settings`, {
      settings,
      section: options?.section ?? null,
      replace_scope: options?.replace_scope ?? false,
    });
    return {
      global_settings: response.data.global_settings ?? [],
      section_overrides: response.data.section_overrides ?? {},
    };
  },
};
