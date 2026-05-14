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
    <Pressable className="bg-gray-800 rounded-2xl p-4 mb-3" onPress={onPress}>
      <Text className="text-white font-semibold text-base mb-1" numberOfLines={2}>
        {idea.title}
      </Text>
      {idea.description ? (
        <Text className="text-gray-400 text-sm mb-2" numberOfLines={2}>{idea.description}</Text>
      ) : null}
      <Text className="text-gray-600 text-xs">{formatDate(idea.created_at)}</Text>
    </Pressable>
  );
}
