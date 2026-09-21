import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { emitDataChange } from '../../../lib/data-events';
import { useIdeas } from '../../../hooks/use-ideas';
import { useGoals } from '../../../hooks/use-goals';
import { useAI } from '../../../hooks/use-ai';
import { useAiUsage } from '../../../hooks/use-ai-usage';
import { ItemPickerModal } from '../../../components/ItemPickerModal';
import { ModalSheet } from '../../../components/ui/ModalSheet';
import { AIButton } from '../../../components/ui/AIButton';
import { useThemeColors } from '../../../context/ThemeContext';
import { ExpansionSections } from '../../../components/ExpansionSections';
import { useIdeaExpansions } from '../../../hooks/use-idea-expansions';
import { formatShortDate, formatTime } from '../../../lib/date-format';
import type { Goal } from '../../../types';

export default function IdeaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { ideas, loading, update, remove } = useIdeas();
  const { goals: allGoals } = useGoals();
  const { expandIdea, expandState, resetExpand } = useAI();
  const { usage: aiUsage, hint: usageHint } = useAiUsage();

  const idea = ideas.find((i) => i.id === id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkedGoals, setLinkedGoals] = useState<Goal[]>([]);
  const [linkedProjects, setLinkedProjects] = useState<{ id: string; title: string }[]>([]);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const {
    expansions,
    loading: expansionsLoading,
    error: expansionsError,
    refetch: refetchExpansions,
  } = useIdeaExpansions(id, historyVisible);
  const savedTitle = useRef('');
  const savedDescription = useRef('');
  const [error, setError] = useState<string | null>(null);

  const exitToIdeas = () => router.replace('/(app)/ideas');

  const loadLinkedGoals = async () => {
    const { data } = await supabase.from('goal_ideas').select('goals(*)').eq('idea_id', id);
    setLinkedGoals(((data ?? []) as { goals: Goal }[]).map((r) => r.goals).filter(Boolean));
  };

  const loadLinkedProjects = async () => {
    const { data } = await supabase.from('project_ideas').select('projects(id, title)').eq('idea_id', id);
    setLinkedProjects(((data ?? []) as { projects: { id: string; title: string } }[]).map((r) => r.projects).filter(Boolean));
  };

  useEffect(() => {
    if (!id) return;
    loadLinkedGoals();
    loadLinkedProjects();
    update(id, { last_viewed_at: new Date().toISOString() });
  }, [id]);

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.description ?? '');
      savedTitle.current = idea.title;
      savedDescription.current = idea.description ?? '';
    }
  }, [idea?.id]);

  if (loading && !idea) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!idea) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">Idea not found</Text>
      </View>
    );
  }

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

  const handleDescriptionBlur = async () => {
    const trimmed = description.trim() || null;
    const savedTrimmed = savedDescription.current.trim() || null;
    if (trimmed === savedTrimmed) return;
    const previous = savedDescription.current;
    const err = await update(id, { description: trimmed });
    if (err) {
      setDescription(previous);
      setError(err);
    } else {
      savedDescription.current = trimmed ?? '';
      setError(null);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete idea', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await remove(id); exitToIdeas(); } },
    ]);
  };

  const handleGoalToggle = async (goalId: string) => {
    const linked = linkedGoals.some((g) => g.id === goalId);
    if (linked) await supabase.from('goal_ideas').delete().eq('idea_id', id).eq('goal_id', goalId);
    else await supabase.from('goal_ideas').insert({ idea_id: id, goal_id: goalId });
    await loadLinkedGoals();
    emitDataChange(['ideas', 'goals']);
  };

  const handleExpand = () => {
    expandIdea(idea.id, title.trim() || idea.title, description.trim() || (idea.description ?? undefined));
  };

  const handleOpenHistory = () => {
    setHistoryVisible(true);
    refetchExpansions();
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <Pressable className="w-11 h-11 -ml-2 items-center justify-center" onPress={exitToIdeas} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Pressable className="w-11 h-11 items-center justify-center" onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete idea">
          <Ionicons name="trash-outline" size={20} color={colors.destructive} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <TextInput
          className="text-foreground text-xl font-bold mb-1 bg-surface rounded-xl min-h-11 px-4 py-3"
          value={title}
          onChangeText={setTitle}
          onBlur={handleTitleBlur}
          placeholder="Title"
          placeholderTextColor={colors.muted}
          returnKeyType="next"
        />
        {error && (
          <Text className="text-destructive text-sm px-1 pt-1">{error}</Text>
        )}
        <TextInput
          className="text-foreground bg-surface rounded-xl min-h-32 px-4 py-3 mb-4 mt-3"
          value={description}
          onChangeText={setDescription}
          onBlur={handleDescriptionBlur}
          placeholder="Description"
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <View className="flex-row mb-5">
          <AIButton
            label="Expand with AI"
            icon="sparkles-outline"
            loading={expandState.status === 'loading'}
            onPress={handleExpand}
            flex
            disabled={aiUsage?.remaining === 0}
            hint={usageHint ?? 'Generates questions, fresh angles, and related concepts for this idea'}
          />
        </View>

        <View className="flex-row justify-end mb-5 -mt-2">
          <AIButton
            label="History"
            icon="time-outline"
            compact
            onPress={handleOpenHistory}
          />
        </View>

        <Text className="text-muted text-xs font-semibold uppercase mb-2">Linked Goals</Text>
        {linkedGoals.map((g) => (
          <View key={g.id} className="bg-surface rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between border border-border">
            <Text className="text-foreground flex-1" numberOfLines={1}>{g.title}</Text>
            <Pressable className="w-11 h-11 -mr-3 items-center justify-center" onPress={() => handleGoalToggle(g.id)} accessibilityRole="button" accessibilityLabel={`Unlink ${g.title}`}>
              <Ionicons name="close-circle-outline" size={18} color={colors.muted} />
            </Pressable>
          </View>
        ))}
        <Pressable className="flex-row min-h-11 items-center gap-2 mb-6" onPress={() => setGoalPickerVisible(true)}>
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text className="text-primary text-sm">Link goal</Text>
        </Pressable>

        <Text className="text-muted text-xs font-semibold uppercase mb-2">Linked Projects</Text>
        {linkedProjects.length === 0
          ? <Text className="text-muted text-sm mb-4">No projects linked</Text>
          : linkedProjects.map((p) => (
              <Pressable key={p.id} className="bg-surface rounded-xl min-h-11 px-4 py-3 mb-2 justify-center border border-border" onPress={() => router.push(`/(app)/projects/${p.id}`)}>
                <Text className="text-foreground" numberOfLines={1}>{p.title}</Text>
              </Pressable>
            ))
        }
      </ScrollView>

      <ModalSheet visible={expandState.status !== 'idle'} onClose={resetExpand} title="Expand with AI">
        {expandState.status === 'loading' && (
          <View className="items-center py-8">
            <ActivityIndicator color={colors.primary} />
            <Text className="text-muted mt-3 text-sm">Thinking…</Text>
          </View>
        )}
        {expandState.status === 'error' && (
          <Text className="text-destructive text-sm">{expandState.error}</Text>
        )}
        {expandState.status === 'success' && expandState.data && (
          <ExpansionSections
            questions={expandState.data.questions}
            angles={expandState.data.angles}
            related={expandState.data.related}
          />
        )}
      </ModalSheet>

      <ModalSheet visible={historyVisible} onClose={() => setHistoryVisible(false)} title="Suggestion History">
        {expansionsLoading && (
          <View className="items-center py-8">
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        {!expansionsLoading && expansionsError && (
          <Text className="text-destructive text-sm">{expansionsError}</Text>
        )}
        {!expansionsLoading && !expansionsError && expansions.length === 0 && (
          <Text className="text-muted text-sm">No AI suggestions yet for this idea.</Text>
        )}
        {!expansionsLoading && !expansionsError && expansions.length > 0 && expansions.map((expansion, i) => {
          const createdAt = new Date(expansion.created_at);
          const dateLabel = formatShortDate(createdAt);
          const previousDateLabel = i > 0
            ? formatShortDate(new Date(expansions[i - 1].created_at))
            : null;
          const showDateHeader = dateLabel !== previousDateLabel;

          return (
            <View key={expansion.id} className={i > 0 ? 'mt-4 pt-4 border-t border-border' : ''}>
              {showDateHeader && (
                <Text className="text-muted text-xs font-semibold uppercase mb-3">
                  {dateLabel}
                </Text>
              )}
              <Text className="text-muted text-xs mb-3">
                {formatTime(createdAt)}
              </Text>
              <ExpansionSections
                questions={expansion.questions}
                angles={expansion.angles}
                related={expansion.related}
              />
            </View>
          );
        })}
      </ModalSheet>

      <ItemPickerModal
        visible={goalPickerVisible}
        onClose={() => setGoalPickerVisible(false)}
        title="Link Goal"
        items={allGoals}
        selectedIds={linkedGoals.map((g) => g.id)}
        onToggle={handleGoalToggle}
        searchPlaceholder="Search goals..."
        emptyMessage="No goals yet"
      />
    </View>
  );
}
