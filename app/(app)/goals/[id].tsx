import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { emitDataChange, subscribeToDataChanges } from '../../../lib/data-events';
import { useGoals } from '../../../hooks/use-goals';
import { useIdeas } from '../../../hooks/use-ideas';
import { useProjects } from '../../../hooks/use-projects';
import { ItemPickerModal } from '../../../components/ItemPickerModal';
import { DatePicker } from '../../../components/ui/DatePicker';
import { useThemeColors } from '../../../context/ThemeContext';
import type { Idea, Project, Task } from '../../../types';

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const source = useRef(Symbol('goal-detail'));
  const { goals, loading, remove, update } = useGoals();
  const { ideas: allIdeas } = useIdeas();
  const { projects: allProjects } = useProjects();
  const colors = useThemeColors();

  const goal = goals.find((g) => g.id === id);

  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savedTitle = useRef('');
  const savedDeadline = useRef<Date | null>(null);

  const [linkedIdeas, setLinkedIdeas] = useState<Idea[]>([]);
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [linkedProjects, setLinkedProjects] = useState<Project[]>([]);
  const [availableProjectTasks, setAvailableProjectTasks] = useState<Task[]>([]);
  const [ideaPickerVisible, setIdeaPickerVisible] = useState(false);
  const [projectPickerVisible, setProjectPickerVisible] = useState(false);
  const [taskPickerVisible, setTaskPickerVisible] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const exitToGoals = () => router.replace('/(app)/goals');

  const loadLinkedIdeas = async () => {
    const { data } = await supabase.from('goal_ideas').select('ideas(*)').eq('goal_id', id);
    setLinkedIdeas(((data ?? []) as { ideas: Idea }[]).map((r) => r.ideas).filter(Boolean));
  };

  const loadLinkedTasks = async () => {
    const { data } = await supabase.from('task_goals').select('tasks(*)').eq('goal_id', id);
    setLinkedTasks(((data ?? []) as { tasks: Task }[]).map((r) => r.tasks).filter(Boolean));
  };

  const loadLinkedProjects = async () => {
    const { data } = await supabase.from('goal_projects').select('projects(*)').eq('goal_id', id);
    const projects = ((data ?? []) as { projects: Project }[]).map((r) => r.projects).filter(Boolean);
    setLinkedProjects(projects);
    await loadAvailableProjectTasks(projects);
  };

  const loadAvailableProjectTasks = async (projects: Project[]) => {
    const projectIds = Array.from(
      new Set([
        ...projects.map((p) => p.id),
        ...(goal?.project_id ? [goal.project_id] : []),
      ]),
    );
    if (projectIds.length === 0) { setAvailableProjectTasks([]); return; }
    const { data } = await supabase.from('tasks').select('*').in('project_id', projectIds);
    setAvailableProjectTasks(data ?? []);
  };

  const handleTaskToggle = async (taskId: string) => {
    const linked = linkedTasks.some((t) => t.id === taskId);
    const { error } = linked
      ? await supabase.from('task_goals').delete().eq('goal_id', id).eq('task_id', taskId)
      : await supabase.from('task_goals').insert({ goal_id: id, task_id: taskId });
    if (error) { setLinkError(error.message); return; }
    await loadLinkedTasks();
    emitDataChange(['goals', 'tasks']);
  };

  const handleProjectToggle = async (projectId: string) => {
    setLinkError(null);
    const linked = linkedProjects.some((p) => p.id === projectId);
    const { error } = linked
      ? await supabase.from('goal_projects').delete().eq('goal_id', id).eq('project_id', projectId)
      : await supabase.from('goal_projects').insert({ goal_id: id, project_id: projectId });
    if (error) { setLinkError(error.message); return; }
    setProjectPickerVisible(false);
    await loadLinkedProjects();
    emitDataChange(['goals', 'projects']);
  };

  useEffect(() => {
    if (!id) return;
    void Promise.all([loadLinkedIdeas(), loadLinkedTasks(), loadLinkedProjects()]);
    return subscribeToDataChanges('tasks', (src) => {
      if (src !== source.current) void loadLinkedTasks();
    });
  }, [id, goal?.project_id]);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      savedTitle.current = goal.title;
      const parsed = goal.deadline ? new Date(goal.deadline) : null;
      setDeadline(parsed);
      savedDeadline.current = parsed;
    }
  }, [goal?.id]);

  if (loading && !goal) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!goal) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">Goal not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete goal', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await remove(id); exitToGoals(); } },
    ]);
  };

  const handleIdeaToggle = async (ideaId: string) => {
    const linked = linkedIdeas.some((i) => i.id === ideaId);
    if (linked) await supabase.from('goal_ideas').delete().eq('goal_id', id).eq('idea_id', ideaId);
    else await supabase.from('goal_ideas').insert({ goal_id: id, idea_id: ideaId });
    await loadLinkedIdeas();
    emitDataChange(['goals', 'ideas']);
  };

  const handleTitleBlur = async () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === savedTitle.current) return;
    const previous = savedTitle.current;
    const err = await update(id, { title: trimmed });
    if (err) {
      setTitle(previous);
      setError(err);
    } else {
      savedTitle.current = trimmed;
      setTitle(trimmed);
      setError(null);
    }
  };

  const handleDeadlineChange = async (newDeadline: Date | null) => {
    const previous = savedDeadline.current;
    setDeadline(newDeadline);
    const err = await update(id, {
      deadline: newDeadline ? toIsoDate(newDeadline) : null,
    });
    if (err) {
      setDeadline(previous);
      setError(err);
    } else {
      savedDeadline.current = newDeadline;
      setError(null);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <Pressable onPress={exitToGoals} accessibilityRole="button" accessibilityLabel="Back to goals">
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <View className="flex-row items-center gap-4">
          <Pressable onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete goal">
            <Ionicons name="trash-outline" size={20} color={colors.destructive} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <TextInput
          value={title}
          onChangeText={setTitle}
          onBlur={handleTitleBlur}
          className="text-2xl font-bold text-foreground font-rounded"
          accessibilityLabel="Goal title"
          returnKeyType="done"
        />
        {error && (
          <Text className="text-destructive text-sm pt-1 pb-2">{error}</Text>
        )}
        <DatePicker
          value={deadline}
          onChange={handleDeadlineChange}
          mode="date"
          placeholder="No deadline"
          compact
        />

        {linkedProjects.length > 0 && (
          <>
            <Text className="text-muted text-xs font-semibold uppercase mb-3">Milestones</Text>
            {linkedTasks.length === 0
              ? <Text className="text-muted text-sm mb-3">No milestones yet - link tasks from the project below</Text>
              : linkedTasks.map((t) => (
                  <View key={t.id} className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3 mb-2">
                    <View className={`w-2.5 h-2.5 rounded-full ${t.done ? 'bg-primary' : 'bg-surface-2'}`} />
                    <Text className={`flex-1 text-sm ${t.done ? 'text-muted line-through' : 'text-foreground'}`} numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Pressable onPress={() => handleTaskToggle(t.id)} hitSlop={8}>
                      <Ionicons name="close-circle-outline" size={16} color={colors.muted} />
                    </Pressable>
                  </View>
                ))
            }
            <Pressable className="flex-row items-center gap-2 py-2 mb-4" onPress={() => setTaskPickerVisible(true)}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text className="text-primary">Link task from project</Text>
            </Pressable>
          </>
        )}

        <Text className="text-muted text-xs font-semibold uppercase mt-4 mb-3">Linked Ideas</Text>
        {linkedIdeas.map((idea) => (
          <View key={idea.id} className="bg-surface rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between border border-border">
            <Text className="text-foreground flex-1" numberOfLines={1}>{idea.title}</Text>
            <Pressable onPress={() => handleIdeaToggle(idea.id)}>
              <Ionicons name="close-circle-outline" size={18} color={colors.muted} />
            </Pressable>
          </View>
        ))}
        <Pressable className="flex-row items-center gap-2 py-2" onPress={() => setIdeaPickerVisible(true)}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text className="text-primary">Link idea</Text>
        </Pressable>

        <Text className="text-muted text-xs font-semibold uppercase mt-4 mb-3">Linked Projects</Text>
        {linkError && <Text className="text-destructive text-xs mb-2">{linkError}</Text>}
        {linkedProjects.map((project) => (
          <View key={project.id} className="bg-surface rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between border border-border">
            <Text className="text-foreground flex-1" numberOfLines={1}>{project.title}</Text>
            <Pressable onPress={() => handleProjectToggle(project.id)}>
              <Ionicons name="close-circle-outline" size={18} color={colors.muted} />
            </Pressable>
          </View>
        ))}
        <Pressable className="flex-row items-center gap-2 py-2" onPress={() => setProjectPickerVisible(true)}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text className="text-primary">Link project</Text>
        </Pressable>
      </ScrollView>

      <ItemPickerModal
        visible={ideaPickerVisible}
        onClose={() => setIdeaPickerVisible(false)}
        title="Link Idea"
        items={allIdeas}
        selectedIds={linkedIdeas.map((i) => i.id)}
        onToggle={handleIdeaToggle}
        searchPlaceholder="Search ideas..."
        emptyMessage="No ideas found"
      />
      <ItemPickerModal
        visible={projectPickerVisible}
        onClose={() => setProjectPickerVisible(false)}
        title="Link Project"
        items={allProjects}
        selectedIds={linkedProjects.map((p) => p.id)}
        onToggle={handleProjectToggle}
        searchPlaceholder="Search projects..."
        emptyMessage="No projects found"
      />
      <ItemPickerModal
        visible={taskPickerVisible}
        onClose={() => setTaskPickerVisible(false)}
        title="Link Task"
        items={availableProjectTasks}
        selectedIds={linkedTasks.map((t) => t.id)}
        onToggle={handleTaskToggle}
        searchPlaceholder="Search tasks..."
        emptyMessage="No tasks found in linked projects"
      />
    </View>
  );
}
