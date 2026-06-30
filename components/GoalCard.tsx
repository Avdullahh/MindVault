import { Badge } from './ui/Badge';
import type { Goal } from '../types';
import { formatShortDate } from '../lib/date-format';
import { EntityCard } from './ui/EntityCard';

type Props = {
  goal: Goal;
  onPress: () => void;
};

function deadlineColor(deadline: string | null): 'red' | 'yellow' | 'gray' {
  if (!deadline) return 'gray';
  const days = (new Date(deadline).getTime() - Date.now()) / 86_400_000;
  if (days < 0) return 'red';
  if (days < 7) return 'yellow';
  return 'gray';
}

function priorityColor(p: string | null): 'red' | 'yellow' | 'gray' {
  if (p === 'high') return 'red';
  if (p === 'medium') return 'yellow';
  return 'gray';
}

function priorityLabel(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function GoalCard({ goal, onPress }: Props) {
  return (
    <EntityCard
      title={goal.title}
      onPress={onPress}
      meta={
        <>
          {goal.priority ? <Badge label={priorityLabel(goal.priority)} color={priorityColor(goal.priority)} /> : null}
          {goal.deadline ? (
            <Badge
              label={formatShortDate(new Date(goal.deadline))}
              color={deadlineColor(goal.deadline)}
            />
          ) : null}
        </>
      }
    />
  );
}
