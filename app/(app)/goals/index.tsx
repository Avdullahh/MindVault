import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useGoals } from '../../../hooks/use-goals';
import { GoalCard } from '../../../components/GoalCard';
import { CreateGoalModal } from '../../../components/CreateGoalModal';
import { EntityListScreen } from '../../../components/ui/EntityListScreen';

export default function GoalsScreen() {
  const router = useRouter();
  const { goals, loading, create, refetch } = useGoals();
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q
    ? goals.filter((goal) =>
        goal.title.toLowerCase().includes(q) ||
        (goal.priority ?? '').toLowerCase().includes(q) ||
        (goal.deadline ?? '').toLowerCase().includes(q),
      )
    : goals;

  return (
    <EntityListScreen
      title="Goals"
      data={filtered}
      loading={loading}
      refetch={refetch}
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Search goals..."
      emptyIcon="flag-outline"
      emptyTitle="No goals yet"
      emptySubtitle="Turn a direction into milestones and action steps when an idea is ready to become a plan."
      emptyActionLabel="Create goal"
      searchEmptyTitle="No matching goals"
      searchEmptySubtitle="Try a different search or create a new goal."
      createAccessibilityLabel="Create goal"
      onCreatePress={() => setModalVisible(true)}
      renderItem={(item) => (
        <GoalCard goal={item} onPress={() => router.push(`/(app)/goals/${item.id}`)} />
      )}
    >
      <CreateGoalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={create}
      />
    </EntityListScreen>
  );
}
