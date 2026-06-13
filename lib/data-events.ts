export type DataTopic =
  | 'categories'
  | 'tags'
  | 'ideas'
  | 'projects'
  | 'goals'
  | 'tasks';

type DataListener = (source?: symbol) => void;

const listeners = new Map<DataTopic, Set<DataListener>>();

export function emitDataChange(topics: DataTopic | DataTopic[], source?: symbol) {
  const topicList = Array.isArray(topics) ? topics : [topics];
  for (const topic of topicList) {
    listeners.get(topic)?.forEach((listener) => listener(source));
  }
}

export function subscribeToDataChanges(
  topics: DataTopic | DataTopic[],
  listener: DataListener,
) {
  const topicList = Array.isArray(topics) ? topics : [topics];
  for (const topic of topicList) {
    const topicListeners = listeners.get(topic) ?? new Set<DataListener>();
    topicListeners.add(listener);
    listeners.set(topic, topicListeners);
  }

  return () => {
    for (const topic of topicList) {
      const topicListeners = listeners.get(topic);
      topicListeners?.delete(listener);
      if (topicListeners?.size === 0) listeners.delete(topic);
    }
  };
}
