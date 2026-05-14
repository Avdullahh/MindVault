import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useProjects } from '../../../hooks/use-projects';
import { useProjectIdeas } from '../../../hooks/use-project-ideas';
import { useIdeas } from '../../../hooks/use-ideas';
import { useGoals } from '../../../hooks/use-goals';
import { useAI } from '../../../hooks/use-ai';
import { IdeaPickerModal } from '../../../components/IdeaPickerModal';
import { AITaskPreviewModal } from '../../../components/AITaskPreviewModal';
import { AIButton } from '../../../components/ui/AIButton';
import { getUserId } from '../../../lib/get-user-id';
import type { Idea, Task } from '../../../types';
import type { PlanResult } from '../../../hooks/use-ai';

type GoalRow = { id: string; title: string; priority: string | null; deadline: string | null };

const PRIORITY_COLOR: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-gray-400',
};

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { projects, loading, remove } = useProjects();
  const { fetchIdeasForProject, linkIdea, unlinkIdea } = useProjectIdeas();
  const { ideas: allIdeas } = useIdeas();
  const { goals: allGoals, refetch: refetchGoals } = useGoals();
  const { planGoal, planState } = useAI();

  const project = projects.find((p) => p.id === id);
  const projectGoals = allGoals.filter((g) => g.project_id === id);

  const [linkedIdeas, setLinkedIdeas] = useState<Idea[]>([]);
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [previewPlan, setPreviewPlan] = useState<PlanResult | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadLinkedIdeas = () => fetchIdeasForProject(id).then(setLinkedIdeas);

  const loadLinkedTasks = async () => {
    if (projectGoals.length === 0) { setLinkedTasks([]); return; }
    const goalIds = projectGoals.map((g) => g.id);
    const { data } = await supabase
      .from('tasks')
      .select('*, task_goals!inner(goal_id)')
      .in('task_goals.goal_id', goalIds);
    setLinkedTasks((data ?? []) as Task[]);
  };

  useEffect(() => {
    if (id) loadLinkedIdeas();
  }, [id]);

  useEffect(() => {
    loadLinkedTasks();
  }, [projectGoals.length]);

  if (loading && !project) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator color="#2dd4bf" />
      </View>
    );
  }

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
    loadLinkedIdeas();
  };

  const handlePlanWithAI = async () => {
    const goalTitle = project.main_goal?.trim() || project.title;
    setAiError(null);
    const { data, error } = await planGoal(goalTitle);
    if (error) { setAiError(error); return; }
    if (!data) return;
    setPreviewPlan(data);
    setPreviewVisible(true);
  };

  const handleConfirmPlan = async (checkedTasks: string[]) => {
    if (!previewPlan) return;
    setSaving(true);
    let succeeded = false;
    try {
      const user_id = await getUserId().catch(() => null);
      if (!user_id) { setAiError('Not authenticated'); return; }

      const { data: goalRow, error: goalErr } = await supabase
        .from('goals')
        .insert({ user_id, project_id: id, title: previewPlan.title, deadline: previewPlan.deadline, priority: previewPlan.priority })
        .select('id')
        .single();
      if (goalErr || !goalRow) { setAiError(goalErr?.message ?? 'Failed to create goal'); return; }

      for (let mi = 0; mi < previewPlan.milestones.length; mi++) {
        const m = previewPlan.milestones[mi];
        const { data: mRow, error: mErr } = await supabase
          .from('milestones')
          .insert({ goal_id: goalRow.id, title: m.title, position: mi })
          .select('id')
          .single();
        if (mErr || !mRow) continue;
        const steps = m.steps.map((s, si) => ({ milestone_id: mRow.id, title: s, done: false, position: si }));
        await supabase.from('action_steps').insert(steps);
      }

      if (checkedTasks.length > 0) {
        const { data: createdTasks, error: tasksErr } = await supabase
          .from('tasks')
          .insert(checkedTasks.map((title) => ({ user_id, title, done: false })))
          .select('id');
        if (tasksErr) { setAiError(tasksErr.message); return; }
        if (createdTasks && createdTasks.length > 0) {
          const links = createdTasks.map((t: { id: string }) => ({ task_id: t.id, goal_id: goalRow.id }));
          const { error: linksErr } = await supabase.from('task_goals').insert(links);
          if (linksErr) { setAiError(linksErr.message); return; }
        }
      }

      await refetchGoals();
      succeeded = true;
    } finally {
      setSaving(false);
      if (succeeded) { setPreviewVisible(false); setPreviewPlan(null); }
    }
  };

  const toggleTask = async (taskId: string, done: boolean) => {
    await supabase.from('tasks').update({ done }).eq('id', taskId);
    setLinkedTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, done } : t));
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

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text className="text-white text-xl font-bold mb-2">{project.title}</Text>
        {project.main_goal && <Text className="text-gray-400 mb-5">{project.main_goal}</Text>}

        <View className="mb-5">
          <AIButton
            label="Plan with AI"
            glyph="✦"
            loading={planState.status === 'loading'}
            onPress={handlePlanWithAI}
          />
          {aiError && <Text className="text-red-400 text-xs mt-2">{aiError}</Text>}
        </View>

        <Text className="text-gray-400 text-sm font-medium mb-3">Goals</Text>
        {projectGoals.length === 0
          ? <Text className="text-gray-600 text-sm mb-4">No goals yet — use Plan with AI to generate one</Text>
          : projectGoals.map((g) => (
              <Pressable
                key={g.id}
                className="bg-gray-800 rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between"
                onPress={() => router.push(`/(app)/goals/${g.id}`)}
              >
                <Text className="text-white flex-1" numberOfLines={1}>{g.title}</Text>
                {g.priority && (
                  <Text className={`text-xs ml-2 capitalize ${PRIORITY_COLOR[g.priority] ?? 'text-gray-400'}`}>
                    {g.priority}
                  </Text>
                )}
              </Pressable>
            ))
        }

        {linkedTasks.length > 0 && (
          <>
            <Text className="text-gray-400 text-sm font-medium mt-4 mb-3">Tasks</Text>
            {linkedTasks.map((t) => (
              <Pressable
                key={t.id}
                className="flex-row items-center gap-3 bg-gray-800 rounded-xl px-4 py-3 mb-2"
                onPress={() => toggleTask(t.id, !t.done)}
              >
                <Ionicons
                  name={t.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={t.done ? '#2dd4bf' : '#6b7280'}
                />
                <Text className={`flex-1 text-sm ${t.done ? 'text-gray-500 line-through' : 'text-white'}`} numberOfLines={1}>
                  {t.title}
                </Text>
              </Pressable>
            ))}
          </>
        )}

        <Text className="text-gray-400 text-sm font-medium mt-4 mb-3">Referenced Ideas</Text>
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
      <AITaskPreviewModal
        visible={previewVisible}
        onClose={() => { setPreviewVisible(false); setPreviewPlan(null); }}
        plan={previewPlan}
        saving={saving}
        onConfirm={handleConfirmPlan}
      />
    </View>
  );
}
