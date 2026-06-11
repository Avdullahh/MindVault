import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { emitDataChange } from '../../../lib/data-events';
import { useIdeas } from '../../../hooks/use-ideas';
import { useIdeaTags } from '../../../hooks/use-idea-tags';
import { useTags } from '../../../hooks/use-tags';
import { useGoals } from '../../../hooks/use-goals';
import { useAI } from '../../../hooks/use-ai';
import { CategoryPicker } from '../../../components/CategoryPicker';
import { TagPicker } from '../../../components/TagPicker';
import { ItemPickerModal } from '../../../components/ItemPickerModal';
import { ModalSheet } from '../../../components/ui/ModalSheet';
import { AIButton } from '../../../components/ui/AIButton';
import { Tag } from '../../../components/ui/Tag';
import { useThemeColors } from '../../../context/ThemeContext';
import type { Goal, Tag as TagType } from '../../../types';

const EXPAND_SECTION_LABELS = {
  questions: 'Questions to Explore',
  angles: 'Different Angles',
  related: 'Related Concepts',
} as const;

export default function IdeaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { ideas, loading, update, remove } = useIdeas();
  const { fetchTagsForIdea, addTag, removeTag } = useIdeaTags();
  const { tags: allTags, create: createTag } = useTags();
  const { goals: allGoals } = useGoals();
  const { categorise, categoriseState, expandIdea, expandState, resetExpand } = useAI();

  const idea = ideas.find((i) => i.id === id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [ideaTags, setIdeaTags] = useState<TagType[]>([]);
  const [linkedGoals, setLinkedGoals] = useState<Goal[]>([]);
  const [linkedProjects, setLinkedProjects] = useState<{ id: string; title: string }[]>([]);
  const [tagPickerVisible, setTagPickerVisible] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

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
    fetchTagsForIdea(id).then(setIdeaTags);
    loadLinkedGoals();
    loadLinkedProjects();
    update(id, { last_viewed_at: new Date().toISOString() });
  }, [id]);

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.description ?? '');
      setCategoryId(idea.category_id ?? null);
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

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await update(id, { title: title.trim(), description: description.trim() || null, category_id: categoryId });
    setSaving(false);
    exitToIdeas();
  };

  const handleDelete = () => {
    Alert.alert('Delete idea', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await remove(id); exitToIdeas(); } },
    ]);
  };

  const handleTagToggle = async (tagId: string) => {
    const linked = ideaTags.some((t) => t.id === tagId);
    if (linked) await removeTag(id, tagId);
    else await addTag(id, tagId);
    setIdeaTags(await fetchTagsForIdea(id));
  };

  const handleGoalToggle = async (goalId: string) => {
    const linked = linkedGoals.some((g) => g.id === goalId);
    if (linked) await supabase.from('goal_ideas').delete().eq('idea_id', id).eq('goal_id', goalId);
    else await supabase.from('goal_ideas').insert({ idea_id: id, goal_id: goalId });
    await loadLinkedGoals();
    emitDataChange(['ideas', 'goals']);
  };

  const handleSuggestCategory = async () => {
    const { data } = await categorise(title.trim() || idea.title, description.trim() || (idea.description ?? undefined));
    if (data) Alert.alert('Suggested category', data.categoryName);
  };

  const handleExpand = () => {
    expandIdea(title.trim() || idea.title, description.trim() || (idea.description ?? undefined));
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <Pressable className="w-11 h-11 -ml-2 items-center justify-center" onPress={exitToIdeas} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable className="min-h-11 px-3 items-center justify-center" onPress={handleSave} disabled={saving || !title.trim()} accessibilityRole="button" accessibilityState={{ disabled: saving || !title.trim(), busy: saving }}>
            <Text className={saving ? 'text-muted' : 'text-primary font-semibold'}>Save</Text>
          </Pressable>
          <Pressable className="w-11 h-11 items-center justify-center" onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete idea">
            <Ionicons name="trash-outline" size={20} color={colors.destructive} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <TextInput
          className="text-foreground text-xl font-bold mb-3 bg-surface rounded-xl min-h-11 px-4 py-3"
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={colors.muted}
          returnKeyType="next"
        />
        <TextInput
          className="text-foreground bg-surface rounded-xl min-h-32 px-4 py-3 mb-4"
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <View className="flex-row gap-3 mb-5">
          <AIButton
            label="Suggest category"
            icon="pricetag-outline"
            loading={categoriseState.status === 'loading'}
            onPress={handleSuggestCategory}
            flex
            hint="Reads your title & description, then suggests a matching category"
          />
          <AIButton
            label="Expand with AI"
            icon="sparkles-outline"
            loading={expandState.status === 'loading'}
            onPress={handleExpand}
            flex
            hint="Generates questions, fresh angles, and related concepts for this idea"
          />
        </View>

        {categoriseState.status === 'error' && (
          <Text className="text-destructive text-xs mb-3">{categoriseState.error}</Text>
        )}

        <Text className="text-muted text-xs font-semibold uppercase mb-2">Category</Text>
        <CategoryPicker value={categoryId} onChange={setCategoryId} />

        <Text className="text-muted text-xs font-semibold uppercase mt-4 mb-2">Tags</Text>
        <View className="flex-row flex-wrap mb-2">
          {ideaTags.map((t) => (
            <Tag key={t.id} label={t.name} onRemove={() => handleTagToggle(t.id)} />
          ))}
        </View>
        <Pressable className="self-start min-h-11 justify-center mb-6" onPress={() => setTagPickerVisible(true)}>
          <Text className="text-primary text-sm">+ Add tag</Text>
        </Pressable>

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
          <ScrollView showsVerticalScrollIndicator={false}>
            {(Object.keys(EXPAND_SECTION_LABELS) as (keyof typeof EXPAND_SECTION_LABELS)[]).map((key) => (
              <View key={key} className="mb-4">
                <Text className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">
                  {EXPAND_SECTION_LABELS[key]}
                </Text>
                {expandState.data![key].map((item, i) => (
                  <View key={i} className="flex-row gap-2 mb-1.5">
                    <Text className="text-muted text-sm">·</Text>
                    <Text className="text-foreground text-sm flex-1">{item}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </ModalSheet>

      <TagPicker
        visible={tagPickerVisible}
        onClose={() => setTagPickerVisible(false)}
        allTags={allTags}
        selectedIds={ideaTags.map((t) => t.id)}
        onToggle={handleTagToggle}
        onCreateTag={createTag}
      />

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
