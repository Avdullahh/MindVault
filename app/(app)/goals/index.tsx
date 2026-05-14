import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGoals } from '../../../hooks/use-goals';
import { GoalCard } from '../../../components/GoalCard';
import { CreateGoalModal } from '../../../components/CreateGoalModal';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function GoalsScreen() {
  const router = useRouter();
  const { goals, loading, create } = useGoals();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View className="flex-1 bg-leather-900">
      <View className="px-5 pt-14 pb-3">
        <Text className="text-2xl font-bold text-leather-50" style={{ fontFamily: 'Georgia' }}>Goals</Text>
      </View>

      {!loading && goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          subtitle="Turn a direction into milestones and action steps when an idea is ready to become a plan."
          actionLabel="Create goal"
          icon="flag-outline"
          onAction={() => setModalVisible(true)}
        />
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <GoalCard goal={item} onPress={() => router.push(`/(app)/goals/${item.id}`)} />
          )}
        />
      )}

      <Pressable
        className="absolute bottom-24 right-6 bg-gold-500 rounded-full w-14 h-14 items-center justify-center shadow-lg"
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <CreateGoalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={create}
      />
    </View>
  );
}
