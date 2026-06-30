import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { emitDataChange } from '../../../lib/data-events';
import { useGoals } from '../../../hooks/use-goals';
import { useIdeas } from '../../../hooks/use-ideas';
import { useProjects } from '../../../hooks/use-projects';
import { ItemPickerModal } from '../../../components/ItemPickerModal';
import { DatePicker } from '../../../components/ui/DatePicker';
import { useThemeColors } from '../../../context/ThemeContext';
import type { Idea, Project } from '../../../types';
import { formatDate } from '../../../lib/date-format';
import { toLocalDateString } from '../../../lib/date-utils';

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
  const [linkedProjects, setLinkedProjects] = useState<Project[]>([]);
  const [ideaPickerVisible, setIdeaPickerVisible] = useState(false);
  const [projectPickerVisible, setProjectPickerVisible] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const exitToGoals = () => router.replace('/(app)/goals');

  const loadLinkedIdeas = async () => {
    const { data } = await supabase.from('goal_ideas').select('ideas(*)').eq('goal_id', id);
    setLinkedIdeas(((data ?? []) as { ideas: Idea }[]).map((r) => r.ideas).filter(Boolean));
  };

  const loadLinkedProjects = async () => {
    const { data } = await supabase.from('goal_projects').select('projects(*)').eq('goal_id', id);
    setLinkedProjects(((data ?? []) as { projects: Project }[]).map((r) => r.projects).filter(Boolean));
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
    void Promise.all([loadLinkedIdeas(), loadLinkedProjects()]);
  }, [id]);

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
      deadline: newDeadline ? toLocalDateString(newDeadline) : null,
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
        <Pressable className="w-11 h-11 -ml-2 items-center justify-center" onPress={exitToGoals} accessibilityRole="button" accessibilityLabel="Back to goals">
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Pressable className="w-11 h-11 items-center justify-center" onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete goal">
          <Ionicons name="trash-outline" size={20} color={colors.destructive} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <TextInput
          value={title}
          onChangeText={setTitle}
          onBlur={handleTitleBlur}
          className="text-foreground text-xl font-bold mb-3 bg-surface rounded-xl min-h-11 px-4 py-3"
          placeholder="Title"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Goal title"
          returnKeyType="done"
        />
        {error && (
          <Text className="text-destructive text-sm px-1 pt-1">{error}</Text>
        )}
        <DatePicker
          value={deadline}
          onChange={handleDeadlineChange}
          mode="date"
          placeholder="No deadline"
          compact
        />

        <Text className="text-muted text-xs font-semibold uppercase mt-4 mb-2">Linked Ideas</Text>
        {linkedIdeas.map((idea) => (
          <View key={idea.id} className="bg-surface rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between border border-border">
            <Text className="text-foreground flex-1" numberOfLines={1}>{idea.title}</Text>
            <Pressable className="w-11 h-11 -mr-3 items-center justify-center" onPress={() => handleIdeaToggle(idea.id)}>
              <Ionicons name="close-circle-outline" size={18} color={colors.muted} />
            </Pressable>
          </View>
        ))}
        <Pressable className="flex-row min-h-11 items-center gap-2" onPress={() => setIdeaPickerVisible(true)}>
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text className="text-primary text-sm">Link idea</Text>
        </Pressable>

        <Text className="text-muted text-xs font-semibold uppercase mt-4 mb-2">Linked Projects</Text>
        {linkError && <Text className="text-destructive text-xs mb-2">{linkError}</Text>}
        {linkedProjects.map((project) => (
          <View key={project.id} className="bg-surface rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between border border-border">
            <Text className="text-foreground flex-1" numberOfLines={1}>{project.title}</Text>
            <Pressable className="w-11 h-11 -mr-3 items-center justify-center" onPress={() => handleProjectToggle(project.id)}>
              <Ionicons name="close-circle-outline" size={18} color={colors.muted} />
            </Pressable>
          </View>
        ))}
        <Pressable className="flex-row min-h-11 items-center gap-2" onPress={() => setProjectPickerVisible(true)}>
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text className="text-primary text-sm">Link project</Text>
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
    </View>
  );
}
