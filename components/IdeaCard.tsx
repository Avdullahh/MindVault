import { Pressable, Text, View } from 'react-native';
import type { Idea } from '../types';

type Props = {
  idea: Idea;
  onPress: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function IdeaCard({ idea, onPress }: Props) {
  return (
    <Pressable className="bg-leather-800 rounded-2xl p-4 mb-3 border border-leather-600" onPress={onPress}>
      <Text className="text-leather-50 font-semibold text-base mb-1" numberOfLines={2}>
        {idea.title}
      </Text>
      {idea.description ? (
        <Text className="text-leather-300 text-sm mb-2" numberOfLines={2}>{idea.description}</Text>
      ) : null}
      <Text className="text-leather-400 text-xs">{formatDate(idea.created_at)}</Text>
    </Pressable>
  );
}
