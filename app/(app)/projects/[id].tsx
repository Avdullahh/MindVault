import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProjects } from '../../../hooks/use-projects';
import { useProjectIdeas } from '../../../hooks/use-project-ideas';
import { useIdeas } from '../../../hooks/use-ideas';
import { IdeaPickerModal } from '../../../components/IdeaPickerModal';
import type { Idea } from '../../../types';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { projects, remove } = useProjects();
  const { fetchIdeasForProject, linkIdea, unlinkIdea } = useProjectIdeas();
  const { ideas: allIdeas } = useIdeas();

  const project = projects.find((p) => p.id === id);
  const [linkedIdeas, setLinkedIdeas] = useState<Idea[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    if (id) fetchIdeasForProject(id).then(setLinkedIdeas);
  }, [id]);

  if (!project) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <Text className="text-gray-400">Project not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete project', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await remove(id); router.back(); } },
    ]);
  };

  const handleIdeaToggle = async (ideaId: string) => {
    const linked = linkedIdeas.some((i) => i.id === ideaId);
    if (linked) await unlinkIdea(id, ideaId);
    else await linkIdea(id, ideaId);
    setLinkedIdeas(await fetchIdeasForProject(id));
  };

  return (
    <View className="flex-1 bg-gray-900">
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#2dd4bf" />
        </Pressable>
        <Pressable onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#f87171" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-white text-xl font-bold mb-2">{project.title}</Text>
        {project.main_goal && <Text className="text-gray-400 mb-6">{project.main_goal}</Text>}

        <Text className="text-gray-400 text-sm font-medium mb-3">Referenced Ideas</Text>
        {linkedIdeas.length === 0
          ? <Text className="text-gray-600 text-sm mb-4">No ideas linked yet</Text>
          : linkedIdeas.map((idea) => (
              <View key={idea.id} className="bg-gray-800 rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between">
                <Text className="text-white flex-1" numberOfLines={1}>{idea.title}</Text>
                <Pressable onPress={() => handleIdeaToggle(idea.id)}>
                  <Ionicons name="close-circle-outline" size={18} color="#6b7280" />
                </Pressable>
              </View>
            ))
        }
        <Pressable className="flex-row items-center gap-2 py-2" onPress={() => setPickerVisible(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#2dd4bf" />
          <Text className="text-teal-400">Link idea</Text>
        </Pressable>
      </ScrollView>

      <IdeaPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        allIdeas={allIdeas}
        selectedIds={linkedIdeas.map((i) => i.id)}
        onToggle={handleIdeaToggle}
      />
    </View>
  );
}
