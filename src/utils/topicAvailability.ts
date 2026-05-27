import { Topic, TopicGroup } from '../topics';
import type { ClassTopicSetting } from '../services/classTopicSettings';

export type TopicAvailabilityMap = Map<string, boolean>;

export function buildAvailabilityMap(settings: ClassTopicSetting[]): TopicAvailabilityMap {
  const map: TopicAvailabilityMap = new Map();
  for (const setting of settings) {
    map.set(setting.topic_id, setting.effective_enabled !== false);
  }
  return map;
}

function isEnabled(topicId: string, map: TopicAvailabilityMap): boolean {
  return map.get(topicId) !== false;
}

export function filterTopicsByAvailability(
  items: (Topic | TopicGroup)[],
  map: TopicAvailabilityMap,
): (Topic | TopicGroup)[] {
  return items
    .map((item) => {
      if (item instanceof Topic) {
        return isEnabled(item.id, map) ? item : null;
      }
      const topics = item.topics.filter((topic) => isEnabled(topic.id, map));
      if (topics.length === 0) {
        return null;
      }
      return new TopicGroup(item.id, item.name, topics);
    })
    .filter((item): item is Topic | TopicGroup => item !== null);
}

export function isTopicEnabled(topicId: string, map: TopicAvailabilityMap): boolean {
  return isEnabled(topicId, map);
}
