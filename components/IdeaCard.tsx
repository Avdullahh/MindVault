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
    <Pressable className="bg-surface rounded-2xl p-4 mb-3 border border-border" onPress={onPress}>
      <Text className="text-foreground font-normal font-rounded text-base mb-1" numberOfLines={2}>
        {idea.title}
      </Text>
      {idea.description ? (
        <Text className="text-muted text-sm mb-2 font-rounded italic" numberOfLines={2}>{idea.description}</Text>
      ) : null}
      <Text className="text-muted text-xs font-rounded italic">{formatDate(idea.created_at)}</Text>
    </Pressable>
  );
}
