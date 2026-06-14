import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGoals } from '../../../hooks/use-goals';
import { GoalCard } from '../../../components/GoalCard';
import { CreateGoalModal } from '../../../components/CreateGoalModal';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useThemeColors } from '../../../context/ThemeContext';

export default function GoalsScreen() {
  const router = useRouter();
  const { goals, loading, create } = useGoals();
  const colors = useThemeColors();
  const [modalVisible, setModalVisible] = useState(false);

  const [query, setQuery] = useState('');
  const filtered = query.trim()
    ? goals.filter((goal) =>
        goal.title.toLowerCase().includes(query.toLowerCase()) ||
        (goal.priority ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (goal.deadline ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : goals;

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-14 pb-3">
        <Text className="text-2xl font-bold text-foreground font-rounded">Goals</Text>
      </View>

      <View className="px-5 mb-3 w-full max-w-3xl self-center">
        <TextInput
          className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border"
          placeholder="Search goals..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon="flag-outline"
          {...(query.trim()
            ? { title: 'No matching goals', subtitle: 'Try a different search or create a new goal.' }
            : { title: 'No goals yet', subtitle: 'Turn a direction into milestones and action steps when an idea is ready to become a plan.', actionLabel: 'Create goal', onAction: () => setModalVisible(true) }
          )}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, width: '100%', maxWidth: 720, alignSelf: 'center' }}
          renderItem={({ item }) => (
            <GoalCard goal={item} onPress={() => router.push(`/(app)/goals/${item.id}`)} />
          )}
        />
      )}

      <Pressable
        className="absolute bottom-24 right-6 bg-primary rounded-full w-14 h-14 items-center justify-center shadow-lg border border-primary/40"
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Create goal"
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </Pressable>

      <CreateGoalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={create}
      />
    </View>
  );
}
