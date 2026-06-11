export type Priority = 'high' | 'medium' | 'low';

export const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const priorityActive: Record<Priority, string> = {
  high: 'bg-red-900 border-red-700',
  medium: 'bg-yellow-900 border-yellow-700',
  low: 'bg-surface-2 border-border',
};
