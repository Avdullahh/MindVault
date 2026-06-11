import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useProjects } from '../../../hooks/use-projects';
import { useProjectIdeas } from '../../../hooks/use-project-ideas';
import { useIdeas } from '../../../hooks/use-ideas';
import { useGoals } from '../../../hooks/use-goals';
import { useProjectTasks } from '../../../hooks/use-tasks';
import { useAI } from '../../../hooks/use-ai';
import { ItemPickerModal } from '../../../components/ItemPickerModal';
import { AITaskPreviewModal } from '../../../components/AITaskPreviewModal';
import { CreateTaskModal } from '../../../components/CreateTaskModal';
import { EditTaskModal } from '../../../components/EditTaskModal';
import { EditProjectModal } from '../../../components/EditProjectModal';
import { AIButton } from '../../../components/ui/AIButton';
import { emitDataChange } from '../../../lib/data-events';
import { getUserId } from '../../../lib/get-user-id';
import { useThemeColors } from '../../../context/ThemeContext';
import type { Goal, Idea, Task } from '../../../types';
import type { PlanResult } from '../../../hooks/use-ai';

const PRIORITY_COLOR: Record<string, string> = {
  high: 'text-destructive',
  medium: 'text-primary',
  low: 'text-muted',
};

function priorityLabel(priority: string) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { projects, loading, remove, update } = useProjects();
  const [editVisible, setEditVisible] = useState(false);
  const { fetchIdeasForProject, linkIdea, unlinkIdea } = useProjectIdeas();
  const { ideas: allIdeas } = useIdeas();
  const { goals: allGoals } = useGoals();
  const { tasks: projectTasks, create: createTask, update: updateTask, toggle: toggleTask, remove: removeTask } = useProjectTasks(id);
  const { planGoal, planState } = useAI();

  const project = projects.find((p) => p.id === id);
  const [editSnapshot, setEditSnapshot] = useState<typeof project>(undefined);

  const [linkedIdeas, setLinkedIdeas] = useState<Idea[]>([]);
  const [linkedGoals, setLinkedGoals] = useState<Goal[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const [createTaskVisible, setCreateTaskVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [previewPlan, setPreviewPlan] = useState<PlanResult | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const exitToProjects = () => router.replace('/(app)/projects');

  const directProjectGoals = allGoals.filter((g) => g.project_id === id);
  const projectGoals = [
    ...directProjectGoals,
    ...linkedGoals.filter((goal) => !directProjectGoals.some((direct) => direct.id === goal.id)),
  ];
  const manuallyLinkableGoals = allGoals.filter((g) => g.project_id !== id);

  const loadLinkedIdeas = () => fetchIdeasForProject(id).then(setLinkedIdeas);

  const loadLinkedGoals = async () => {
    const { data } = await supabase.from('goal_projects').select('goals(*)').eq('project_id', id);
    setLinkedGoals(((data ?? []) as { goals: Goal }[]).map((r) => r.goals).filter(Boolean));
  };

  useEffect(() => {
    if (!id) return;
    void Promise.all([loadLinkedIdeas(), loadLinkedGoals()]);
  }, [id]);

  if (loading && !project) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">Project not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete project', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await remove(id); exitToProjects(); } },
    ]);
  };

  const handleIdeaToggle = async (ideaId: string) => {
    const linked = linkedIdeas.some((i) => i.id === ideaId);
    if (linked) await unlinkIdea(id, ideaId);
    else await linkIdea(id, ideaId);
    loadLinkedIdeas();
  };

  const handleGoalToggle = async (goalId: string) => {
    const linked = linkedGoals.some((g) => g.id === goalId);
    if (linked) await supabase.from('goal_projects').delete().eq('project_id', id).eq('goal_id', goalId);
    else await supabase.from('goal_projects').insert({ project_id: id, goal_id: goalId });
    await loadLinkedGoals();
    emitDataChange(['goals', 'projects']);
  };

  const handlePlanWithAI = async () => {
    const goalTitle = project.main_goal?.trim() || project.title;
    setAiError(null);
    const { data, error } = await planGoal(goalTitle, project.main_goal ?? undefined);
    if (error) { setAiError(error); return; }
    if (!data) return;
    setPreviewPlan(data);
    setPreviewVisible(true);
  };

  const handleConfirmPlan = async (checkedTasks: string[]) => {
    if (!previewPlan || checkedTasks.length === 0) return;
    setSaving(true);
    let succeeded = false;
    try {
      const user_id = await getUserId().catch(() => null);
      if (!user_id) { setAiError('Not authenticated'); return; }

      const { error: tasksErr } = await supabase
        .from('tasks')
        .insert(checkedTasks.map((title) => ({ user_id, title, done: false, project_id: id })));
      if (tasksErr) { setAiError(tasksErr.message); return; }

      emitDataChange(['tasks', 'projects']);
      succeeded = true;
    } finally {
      setSaving(false);
      if (succeeded) { setPreviewVisible(false); setPreviewPlan(null); }
    }
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert('Delete task', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTask(taskId) },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <Pressable onPress={exitToProjects} accessibilityRole="button" accessibilityLabel="Back to projects">
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => { setEditSnapshot(project); setEditVisible(true); }} accessibilityRole="button" accessibilityLabel="Edit project">
            <Ionicons name="pencil-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete project">
            <Ionicons name="trash-outline" size={20} color={colors.destructive} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text className="text-foreground text-xl font-bold mb-2" style={{ fontFamily: 'Georgia' }}>{project.title}</Text>
        {project.main_goal && <Text className="text-muted mb-5">{project.main_goal}</Text>}

        <View className="mb-5">
          <AIButton
            label="Plan with AI"
            loading={planState.status === 'loading'}
            onPress={handlePlanWithAI}
          />
          {aiError && <Text className="text-destructive text-xs mt-2">{aiError}</Text>}
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-muted text-xs font-semibold uppercase">Goals</Text>
          <Pressable onPress={() => setGoalPickerVisible(true)} className="flex-row items-center gap-1">
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text className="text-primary text-sm">Link goal</Text>
          </Pressable>
        </View>
        {projectGoals.length === 0
          ? <Text className="text-muted text-sm mb-4">No goals yet - use Plan with AI to generate one</Text>
          : projectGoals.map((g) => (
              <Pressable
                key={g.id}
                className="bg-surface rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between"
                onPress={() => router.push(`/(app)/goals/${g.id}`)}
              >
                <Text className="text-foreground flex-1" numberOfLines={1}>{g.title}</Text>
                {g.priority && (
                  <Text className={`text-xs ml-2 capitalize ${PRIORITY_COLOR[g.priority] ?? 'text-muted'}`}>
                    {priorityLabel(g.priority)}
                  </Text>
                )}
              </Pressable>
            ))
        }

        <View className="flex-row items-center justify-between mt-4 mb-3">
          <Text className="text-muted text-xs font-semibold uppercase">Tasks</Text>
          <Pressable onPress={() => setCreateTaskVisible(true)} className="flex-row items-center gap-1">
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text className="text-primary text-sm">Add task</Text>
          </Pressable>
        </View>
        {projectTasks.length === 0
          ? <Text className="text-muted text-sm mb-4">No tasks yet</Text>
          : projectTasks.map((t) => (
              <View
                key={t.id}
                className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3 mb-2"
              >
                <Pressable onPress={() => toggleTask(t.id, !t.done)} hitSlop={8}>
                  <Ionicons
                    name={t.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={t.done ? colors.primary : colors.muted}
                  />
                </Pressable>
                <View className="flex-1">
                  <Text className={`text-sm ${t.done ? 'text-muted line-through' : 'text-foreground'}`} numberOfLines={1}>
                    {t.title}
                  </Text>
                  {t.due_date ? <Text className="text-muted text-xs mt-0.5">{t.due_date}</Text> : null}
                </View>
                {t.priority ? (
                  <Text className={`text-xs capitalize ${PRIORITY_COLOR[t.priority] ?? 'text-muted'}`}>
                    {t.priority}
                  </Text>
                ) : null}
                <Pressable onPress={() => setEditingTask(t)} hitSlop={8} className="p-1">
                  <Ionicons name="pencil-outline" size={16} color={colors.muted} />
                </Pressable>
                <Pressable onPress={() => handleDeleteTask(t.id)} hitSlop={8} className="p-1">
                  <Ionicons name="trash-outline" size={16} color={colors.muted} />
                </Pressable>
              </View>
            ))
        }

        <Text className="text-muted text-xs font-semibold uppercase mt-4 mb-3">Referenced Ideas</Text>
        {linkedIdeas.length === 0
          ? <Text className="text-muted text-sm mb-4">No ideas linked yet</Text>
          : linkedIdeas.map((idea) => (
              <View key={idea.id} className="bg-surface rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between">
                <Text className="text-foreground flex-1" numberOfLines={1}>{idea.title}</Text>
                <Pressable onPress={() => handleIdeaToggle(idea.id)}>
                  <Ionicons name="close-circle-outline" size={18} color={colors.muted} />
                </Pressable>
              </View>
            ))
        }
        <Pressable className="flex-row items-center gap-2 py-2" onPress={() => setPickerVisible(true)}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text className="text-primary">Link idea</Text>
        </Pressable>
      </ScrollView>

      <ItemPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title="Link Idea"
        items={allIdeas}
        selectedIds={linkedIdeas.map((i) => i.id)}
        onToggle={handleIdeaToggle}
        searchPlaceholder="Search ideas..."
        emptyMessage="No ideas found"
      />
      <ItemPickerModal
        visible={goalPickerVisible}
        onClose={() => setGoalPickerVisible(false)}
        title="Link Goal"
        items={manuallyLinkableGoals}
        selectedIds={linkedGoals.map((g) => g.id)}
        onToggle={handleGoalToggle}
        searchPlaceholder="Search goals..."
        emptyMessage="No goals available"
      />
      <AITaskPreviewModal
        visible={previewVisible}
        onClose={() => { setPreviewVisible(false); setPreviewPlan(null); }}
        plan={previewPlan}
        saving={saving}
        onConfirm={handleConfirmPlan}
      />
      <CreateTaskModal
        visible={createTaskVisible}
        onClose={() => setCreateTaskVisible(false)}
        onCreate={createTask}
      />
      <EditTaskModal
        task={editingTask}
        visible={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={updateTask}
      />
      <EditProjectModal
        project={editSnapshot ?? null}
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        onSave={update}
      />
    </View>
  );
}
