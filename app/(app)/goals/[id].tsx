import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useGoals } from '../../../hooks/use-goals';
import { useMilestones } from '../../../hooks/use-milestones';
import { useActionSteps } from '../../../hooks/use-action-steps';
import { useIdeas } from '../../../hooks/use-ideas';
import { MilestoneItem } from '../../../components/MilestoneItem';
import { IdeaPickerModal } from '../../../components/IdeaPickerModal';
import type { Idea } from '../../../types';

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { goals, refetch, remove } = useGoals();
  const { create: createMilestone, remove: removeMilestone } = useMilestones(refetch);
  const { create: createStep, toggle: toggleStep } = useActionSteps(refetch);
  const { ideas: allIdeas } = useIdeas();

  const goal = goals.find((g) => g.id === id);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [linkedIdeas, setLinkedIdeas] = useState<Idea[]>([]);
  const [ideaPickerVisible, setIdeaPickerVisible] = useState(false);

  const loadLinkedIdeas = async () => {
    const { data } = await supabase.from('goal_ideas').select('ideas(*)').eq('goal_id', id);
    setLinkedIdeas(((data ?? []) as { ideas: Idea }[]).map((r) => r.ideas).filter(Boolean));
  };

  useEffect(() => { if (id) loadLinkedIdeas(); }, [id]);

  if (!goal) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <Text className="text-gray-400">Goal not found</Text>
      </View>
    );
  }

  const handleAddMilestone = async () => {
    if (!newMilestoneTitle.trim()) return;
    await createMilestone(id, newMilestoneTitle.trim(), goal.milestones.length);
    setNewMilestoneTitle('');
    setAddingMilestone(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete goal', 'Deletes all milestones and action steps.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await remove(id); router.back(); } },
    ]);
  };

  const handleIdeaToggle = async (ideaId: string) => {
    const linked = linkedIdeas.some((i) => i.id === ideaId);
    if (linked) await supabase.from('goal_ideas').delete().eq('goal_id', id).eq('idea_id', ideaId);
    else await supabase.from('goal_ideas').insert({ goal_id: id, idea_id: ideaId });
    await loadLinkedIdeas();
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

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Text className="text-white text-xl font-bold mb-1">{goal.title}</Text>
        {goal.deadline && (
          <Text className="text-gray-400 text-sm mb-4">
            Due {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        )}

        <Text className="text-gray-400 text-sm font-medium mb-3">Milestones</Text>
        {goal.milestones
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((milestone) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              onToggleStep={(stepId, done) => toggleStep(stepId, done)}
              onRemoveMilestone={() => removeMilestone(milestone.id)}
              onAddStep={async (title) => { await createStep(milestone.id, title, milestone.action_steps.length); }}
            />
          ))}

        {addingMilestone ? (
          <View className="flex-row items-center gap-2 bg-gray-800 rounded-xl px-4 py-3 mb-3">
            <TextInput
              className="flex-1 text-white"
              placeholder="Milestone title..."
              placeholderTextColor="#6b7280"
              value={newMilestoneTitle}
              onChangeText={setNewMilestoneTitle}
              autoFocus
              onSubmitEditing={handleAddMilestone}
            />
            <Pressable onPress={handleAddMilestone}>
              <Ionicons name="checkmark" size={18} color="#2dd4bf" />
            </Pressable>
            <Pressable onPress={() => setAddingMilestone(false)}>
              <Ionicons name="close" size={18} color="#6b7280" />
            </Pressable>
          </View>
        ) : (
          <Pressable className="flex-row items-center gap-2 py-3" onPress={() => setAddingMilestone(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#2dd4bf" />
            <Text className="text-teal-400">Add milestone</Text>
          </Pressable>
        )}

        <Text className="text-gray-400 text-sm font-medium mt-4 mb-3">Linked Ideas</Text>
        {linkedIdeas.map((idea) => (
          <View key={idea.id} className="bg-gray-800 rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between">
            <Text className="text-white flex-1" numberOfLines={1}>{idea.title}</Text>
            <Pressable onPress={() => handleIdeaToggle(idea.id)}>
              <Ionicons name="close-circle-outline" size={18} color="#6b7280" />
            </Pressable>
          </View>
        ))}
        <Pressable className="flex-row items-center gap-2 py-2" onPress={() => setIdeaPickerVisible(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#2dd4bf" />
          <Text className="text-teal-400">Link idea</Text>
        </Pressable>
      </ScrollView>

      <IdeaPickerModal
        visible={ideaPickerVisible}
        onClose={() => setIdeaPickerVisible(false)}
        allIdeas={allIdeas}
        selectedIds={linkedIdeas.map((i) => i.id)}
        onToggle={handleIdeaToggle}
      />
    </View>
  );
}
