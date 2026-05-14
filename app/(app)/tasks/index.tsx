import { useState } from 'react';
import { Pressable, SectionList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTasks } from '../../../hooks/use-tasks';
import { TaskItem } from '../../../components/TaskItem';
import { CreateTaskModal } from '../../../components/CreateTaskModal';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, loading, create, toggle } = useTasks();
  const [modalVisible, setModalVisible] = useState(false);

  const pending = tasks
    .filter((t) => !t.done)
    .sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });

  const done = tasks
    .filter((t) => t.done)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const sections = [
    { title: 'Pending', data: pending },
    ...(done.length > 0 ? [{ title: `Done (${done.length})`, data: done }] : []),
  ];

  const FAB = (
    <Pressable
      className="absolute bottom-24 right-6 bg-teal-500 rounded-full w-14 h-14 items-center justify-center shadow-lg"
      onPress={() => setModalVisible(true)}
    >
      <Ionicons name="add" size={28} color="#fff" />
    </Pressable>
  );

  if (!loading && tasks.length === 0) {
    return (
      <View className="flex-1 bg-gray-900">
        <View className="px-5 pt-14 pb-3">
          <Text className="text-2xl font-bold text-white">Tasks</Text>
        </View>
        <EmptyState title="No tasks yet" subtitle="Generate a project plan with AI or add a manual task" />
        <View className="px-5 mt-4">
          <Pressable
            className="bg-teal-900/40 border border-teal-700 rounded-xl px-4 py-3 flex-row items-center justify-center gap-2"
            onPress={() => router.push('/(app)/projects')}
          >
            <Ionicons name="folder-open-outline" size={18} color="#2dd4bf" />
            <Text className="text-teal-400 font-medium">Plan a project</Text>
          </Pressable>
        </View>
        {FAB}
        <CreateTaskModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreate={create} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      <View className="px-5 pt-14 pb-3">
        <Text className="text-2xl font-bold text-white">Tasks</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-gray-400 text-sm font-medium py-2 bg-gray-900">{title}</Text>
        )}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={() => toggle(item.id, !item.done)}
          />
        )}
      />

      {FAB}
      <CreateTaskModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreate={create} />
    </View>
  );
}
