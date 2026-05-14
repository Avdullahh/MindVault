import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useGoals } from '../../../hooks/use-goals';
import { useMilestones } from '../../../hooks/use-milestones';
import { useActionSteps } from '../../../hooks/use-action-steps';
import { useIdeas } from '../../../hooks/use-ideas';
import { MilestoneItem } from '../../../components/MilestoneItem';
import { IdeaPickerModal } from '../../../components/IdeaPickerModal';
import type { Idea, Task } from '../../../types';

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { goals, loading, refetch, remove } = useGoals();
  const { create: createMilestone, remove: removeMilestone } = useMilestones(refetch);
  const { create: createStep, toggle: toggleStep } = useActionSteps(refetch);
  const { ideas: allIdeas } = useIdeas();

  const goal = goals.find((g) => g.id === id);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [linkedIdeas, setLinkedIdeas] = useState<Idea[]>([]);
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [ideaPickerVisible, setIdeaPickerVisible] = useState(false);

  const loadLinkedIdeas = async () => {
    const { data } = await supabase.from('goal_ideas').select('ideas(*)').eq('goal_id', id);
    setLinkedIdeas(((data ?? []) as { ideas: Idea }[]).map((r) => r.ideas).filter(Boolean));
  };

  const loadLinkedTasks = async () => {
    const { data } = await supabase.from('task_goals').select('tasks(*)').eq('goal_id', id);
    setLinkedTasks(((data ?? []) as { tasks: Task }[]).map((r) => r.tasks).filter(Boolean));
  };

  const toggleTask = async (taskId: string, done: boolean) => {
    await supabase.from('tasks').update({ done }).eq('id', taskId);
    setLinkedTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, done } : t));
  };

  useEffect(() => { if (id) Promise.all([loadLinkedIdeas(), loadLinkedTasks()]); }, [id]);

  if (loading && !goal) {
    return (
      <View className="flex-1 bg-leather-900 justify-center items-center">
        <ActivityIndicator color="#d4a017" />
      </View>
    );
  }

  if (!goal) {
    return (
      <View className="flex-1 bg-leather-900 justify-center items-center">
        <Text className="text-leather-300">Goal not found</Text>
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
    <View className="flex-1 bg-leather-900">
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#d4a017" />
        </Pressable>
        <Pressable onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#f87171" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text className="text-leather-50 text-xl font-bold mb-1" style={{ fontFamily: 'Georgia' }}>{goal.title}</Text>
        {goal.deadline && (
          <Text className="text-leather-300 text-sm mb-4">
            Due {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        )}

        <Text className="text-leather-300 text-xs font-semibold uppercase mb-3">Milestones</Text>
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
          <View className="flex-row items-center gap-2 bg-leather-800 rounded-xl px-4 py-3 mb-3">
            <TextInput
              className="flex-1 text-leather-50"
              placeholder="Milestone title..."
              placeholderTextColor="#7a6050"
              value={newMilestoneTitle}
              onChangeText={setNewMilestoneTitle}
              autoFocus
              onSubmitEditing={handleAddMilestone}
            />
            <Pressable onPress={handleAddMilestone}>
              <Ionicons name="checkmark" size={18} color="#d4a017" />
            </Pressable>
            <Pressable onPress={() => setAddingMilestone(false)}>
              <Ionicons name="close" size={18} color="#7a6050" />
            </Pressable>
          </View>
        ) : (
          <Pressable className="flex-row items-center gap-2 py-3" onPress={() => setAddingMilestone(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#d4a017" />
            <Text className="text-gold-400">Add milestone</Text>
          </Pressable>
        )}

        {linkedTasks.length > 0 && (
          <>
            <Text className="text-leather-300 text-xs font-semibold uppercase mt-4 mb-3">Tasks</Text>
            {linkedTasks.map((t) => (
              <Pressable
                key={t.id}
                className="flex-row items-center gap-3 bg-leather-800 rounded-xl px-4 py-3 mb-2"
                onPress={() => toggleTask(t.id, !t.done)}
              >
                <Ionicons
                  name={t.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={t.done ? '#d4a017' : '#7a6050'}
                />
                <Text className={`flex-1 text-sm ${t.done ? 'text-leather-400 line-through' : 'text-leather-50'}`} numberOfLines={1}>
                  {t.title}
                </Text>
              </Pressable>
            ))}
          </>
        )}

        <Text className="text-leather-300 text-xs font-semibold uppercase mt-4 mb-3">Linked Ideas</Text>
        {linkedIdeas.map((idea) => (
          <View key={idea.id} className="bg-leather-800 rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between border border-leather-600">
            <Text className="text-leather-50 flex-1" numberOfLines={1}>{idea.title}</Text>
            <Pressable onPress={() => handleIdeaToggle(idea.id)}>
              <Ionicons name="close-circle-outline" size={18} color="#7a6050" />
            </Pressable>
          </View>
        ))}
        <Pressable className="flex-row items-center gap-2 py-2" onPress={() => setIdeaPickerVisible(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#d4a017" />
          <Text className="text-gold-400">Link idea</Text>
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
