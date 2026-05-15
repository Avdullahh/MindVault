import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProjects } from '../../../hooks/use-projects';
import { ProjectCard } from '../../../components/ProjectCard';
import { CreateProjectModal } from '../../../components/CreateProjectModal';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function ProjectsScreen() {
  const router = useRouter();
  const { projects, loading, create } = useProjects();
  const [modalVisible, setModalVisible] = useState(false);

  const [query, setQuery] = useState('');
  const filtered = query.trim()
    ? projects.filter((project) =>
        project.title.toLowerCase().includes(query.toLowerCase()) ||
        (project.main_goal ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : projects;

  return (
    <View className="flex-1 bg-leather-900">
      <View className="px-5 pt-14 pb-3">
        <Text className="text-2xl font-bold text-leather-50" style={{ fontFamily: 'Georgia' }}>Projects</Text>
      </View>

      <View className="px-5 mb-3 w-full max-w-3xl self-center">
        <TextInput
          className="bg-leather-800 text-leather-50 rounded-xl px-4 py-3"
          placeholder="Search projects..."
          placeholderTextColor="#7a6050"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon="folder-outline"
          {...(query.trim()
            ? { title: 'No matching projects', subtitle: 'Try a different search or start a new project.' }
            : { title: 'No projects yet', subtitle: 'Group related ideas, goals, and tasks when a theme becomes bigger than a single note.', actionLabel: 'Start project', onAction: () => setModalVisible(true) }
          )}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, width: '100%', maxWidth: 720, alignSelf: 'center' }}
          renderItem={({ item }) => (
            <ProjectCard project={item} onPress={() => router.push(`/(app)/projects/${item.id}`)} />
          )}
        />
      )}

      <Pressable
        className="absolute bottom-24 right-6 bg-gold-500 rounded-full w-14 h-14 items-center justify-center shadow-lg"
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Start project"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <CreateProjectModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={create}
      />
    </View>
  );
}
