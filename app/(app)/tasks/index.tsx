import { useState } from 'react';
import { Pressable, SectionList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTasks } from '../../../hooks/use-tasks';
import { TaskItem } from '../../../components/TaskItem';
import { CreateTaskModal } from '../../../components/CreateTaskModal';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function TasksScreen() {
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
      className="absolute bottom-8 right-6 bg-teal-500 rounded-full w-14 h-14 items-center justify-center"
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
        <EmptyState title="No tasks yet" subtitle="Tap + to add your first task" />
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
            onPress={() => {}}
          />
        )}
      />

      {FAB}
      <CreateTaskModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreate={create} />
    </View>
  );
}
