import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useIdeas } from '../../../hooks/use-ideas';
import { useIdeaTags } from '../../../hooks/use-idea-tags';
import { useTags } from '../../../hooks/use-tags';
import { useGoals } from '../../../hooks/use-goals';
import { useAI } from '../../../hooks/use-ai';
import { CategoryPicker } from '../../../components/CategoryPicker';
import { TagPicker } from '../../../components/TagPicker';
import { GoalPickerModal } from '../../../components/GoalPickerModal';
import { ModalSheet } from '../../../components/ui/ModalSheet';
import { AIButton } from '../../../components/ui/AIButton';
import { Tag } from '../../../components/ui/Tag';
import type { Goal, Tag as TagType } from '../../../types';

const EXPAND_SECTION_LABELS = {
  questions: 'Questions to Explore',
  angles: 'Different Angles',
  related: 'Related Concepts',
} as const;

export default function IdeaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator color="#2dd4bf" />
      </View>
    );
  }

  if (!idea) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <Text className="text-gray-400">Idea not found</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await update(id, { title: title.trim(), description: description.trim() || null, category_id: categoryId });
    setSaving(false);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete idea', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await remove(id); router.back(); } },
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
  };

  const handleSuggestCategory = async () => {
    const { data } = await categorise(title.trim() || idea.title, description.trim() || (idea.description ?? undefined));
    if (data) Alert.alert('Suggested category', data.categoryName);
  };

  const handleExpand = () => {
    expandIdea(title.trim() || idea.title, description.trim() || (idea.description ?? undefined));
  };

  return (
    <View className="flex-1 bg-gray-900">
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <Pressable className="w-11 h-11 -ml-2 items-center justify-center" onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color="#2dd4bf" />
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable className="min-h-11 px-3 items-center justify-center" onPress={handleSave} disabled={saving || !title.trim()} accessibilityRole="button" accessibilityState={{ disabled: saving || !title.trim(), busy: saving }}>
            <Text className={saving ? 'text-gray-500' : 'text-teal-400 font-semibold'}>Save</Text>
          </Pressable>
          <Pressable className="w-11 h-11 items-center justify-center" onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete idea">
            <Ionicons name="trash-outline" size={20} color="#f87171" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <TextInput
          className="text-white text-xl font-bold mb-3 bg-gray-800 rounded-xl min-h-11 px-4 py-3"
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor="#6b7280"
          returnKeyType="next"
        />
        <TextInput
          className="text-gray-300 bg-gray-800 rounded-xl min-h-32 px-4 py-3 mb-4"
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
          placeholderTextColor="#6b7280"
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
          <Text className="text-red-400 text-xs mb-3">{categoriseState.error}</Text>
        )}

        <Text className="text-gray-400 text-sm font-medium mb-2">Category</Text>
        <CategoryPicker value={categoryId} onChange={setCategoryId} />

        <Text className="text-gray-400 text-sm font-medium mt-4 mb-2">Tags</Text>
        <View className="flex-row flex-wrap mb-2">
          {ideaTags.map((t) => (
            <Tag key={t.id} label={t.name} onRemove={() => handleTagToggle(t.id)} />
          ))}
        </View>
        <Pressable className="self-start min-h-11 justify-center mb-6" onPress={() => setTagPickerVisible(true)}>
          <Text className="text-teal-400 text-sm">+ Add tag</Text>
        </Pressable>

        <Text className="text-gray-400 text-sm font-medium mb-2">Linked Goals</Text>
        {linkedGoals.map((g) => (
          <View key={g.id} className="bg-gray-800 rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between">
            <Text className="text-white flex-1" numberOfLines={1}>{g.title}</Text>
            <Pressable className="w-11 h-11 -mr-3 items-center justify-center" onPress={() => handleGoalToggle(g.id)} accessibilityRole="button" accessibilityLabel={`Unlink ${g.title}`}>
              <Ionicons name="close-circle-outline" size={18} color="#6b7280" />
            </Pressable>
          </View>
        ))}
        <Pressable className="flex-row min-h-11 items-center gap-2 mb-6" onPress={() => setGoalPickerVisible(true)}>
          <Ionicons name="add-circle-outline" size={18} color="#2dd4bf" />
          <Text className="text-teal-400 text-sm">Link goal</Text>
        </Pressable>

        <Text className="text-gray-400 text-sm font-medium mb-2">Linked Projects</Text>
        {linkedProjects.length === 0
          ? <Text className="text-gray-600 text-sm mb-4">No projects linked</Text>
          : linkedProjects.map((p) => (
              <Pressable key={p.id} className="bg-gray-800 rounded-xl min-h-11 px-4 py-3 mb-2 justify-center" onPress={() => router.push(`/(app)/projects/${p.id}`)}>
                <Text className="text-white" numberOfLines={1}>{p.title}</Text>
              </Pressable>
            ))
        }
      </ScrollView>

      <ModalSheet visible={expandState.status !== 'idle'} onClose={resetExpand} title="Expand with AI">
        {expandState.status === 'loading' && (
          <View className="items-center py-8">
            <ActivityIndicator color="#2dd4bf" />
            <Text className="text-gray-400 mt-3 text-sm">Thinking…</Text>
          </View>
        )}
        {expandState.status === 'error' && (
          <Text className="text-red-400 text-sm">{expandState.error}</Text>
        )}
        {expandState.status === 'success' && expandState.data && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {(Object.keys(EXPAND_SECTION_LABELS) as (keyof typeof EXPAND_SECTION_LABELS)[]).map((key) => (
              <View key={key} className="mb-4">
                <Text className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  {EXPAND_SECTION_LABELS[key]}
                </Text>
                {expandState.data![key].map((item, i) => (
                  <View key={i} className="flex-row gap-2 mb-1.5">
                    <Text className="text-gray-500 text-sm">·</Text>
                    <Text className="text-gray-200 text-sm flex-1">{item}</Text>
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

      <GoalPickerModal
        visible={goalPickerVisible}
        onClose={() => setGoalPickerVisible(false)}
        allGoals={allGoals}
        selectedIds={linkedGoals.map((g) => g.id)}
        onToggle={handleGoalToggle}
      />
    </View>
  );
}
