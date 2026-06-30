import type { Idea } from '../types';
import { formatShortDate } from '../lib/date-format';
import { EntityCard } from './ui/EntityCard';

type Props = {
  idea: Idea;
  onPress: () => void;
};


export function IdeaCard({ idea, onPress }: Props) {
  return (
    <EntityCard
      title={idea.title}
      subtitle={idea.description}
      footer={formatShortDate(new Date(idea.created_at))}
      onPress={onPress}
    />
  );
}
