import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
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

  return (
    <View className="flex-1 bg-leather-900">
      <View className="px-5 pt-14 pb-3">
        <Text className="text-2xl font-bold text-leather-50" style={{ fontFamily: 'Georgia' }}>Projects</Text>
      </View>

      {!loading && projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          subtitle="Group related ideas, goals, and tasks when a theme becomes bigger than a single note."
          actionLabel="Start project"
          icon="folder-outline"
          onAction={() => setModalVisible(true)}
        />
      ) : (
        <FlatList
          data={projects}
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
