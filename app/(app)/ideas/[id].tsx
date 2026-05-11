import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useIdeas } from '../../../hooks/use-ideas';
import { useIdeaTags } from '../../../hooks/use-idea-tags';
import { useTags } from '../../../hooks/use-tags';
import { useGoals } from '../../../hooks/use-goals';
import { CategoryPicker } from '../../../components/CategoryPicker';
import { TagPicker } from '../../../components/TagPicker';
import { GoalPickerModal } from '../../../components/GoalPickerModal';
import { Tag } from '../../../components/ui/Tag';
import type { Goal, Tag as TagType } from '../../../types';

export default function IdeaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { ideas, update, remove } = useIdeas();
  const { fetchTagsForIdea, addTag, removeTag } = useIdeaTags();
  const { tags: allTags, create: createTag } = useTags();
  const { goals: allGoals } = useGoals();

  const idea = ideas.find((i) => i.id === id);

  const [title, setTitle] = useState(idea?.title ?? '');
  const [description, setDescription] = useState(idea?.description ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(idea?.category_id ?? null);
  const [ideaTags, setIdeaTags] = useState<TagType[]>([]);
  const [linkedGoals, setLinkedGoals] = useState<Goal[]>([]);
  const [tagPickerVisible, setTagPickerVisible] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadLinkedGoals = async () => {
    const { data } = await supabase.from('goal_ideas').select('goals(*)').eq('idea_id', id);
    setLinkedGoals(((data ?? []) as { goals: Goal }[]).map((r) => r.goals).filter(Boolean));
  };

  useEffect(() => {
    if (!id) return;
    fetchTagsForIdea(id).then(setIdeaTags);
    loadLinkedGoals();
    update(id, { last_viewed_at: new Date().toISOString() });
  }, [id]);

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

  return (
    <View className="flex-1 bg-gray-900">
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#2dd4bf" />
        </Pressable>
        <View className="flex-row gap-4">
          <Pressable onPress={handleSave} disabled={saving}>
            <Text className={saving ? 'text-gray-500' : 'text-teal-400 font-semibold'}>Save</Text>
          </Pressable>
          <Pressable onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#f87171" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <TextInput
          className="text-white text-xl font-bold mb-3 bg-gray-800 rounded-xl px-4 py-3"
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor="#6b7280"
        />
        <TextInput
          className="text-gray-300 bg-gray-800 rounded-xl px-4 py-3 mb-4"
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <Text className="text-gray-400 text-sm font-medium mb-2">Category</Text>
        <CategoryPicker value={categoryId} onChange={setCategoryId} />

        <Text className="text-gray-400 text-sm font-medium mt-4 mb-2">Tags</Text>
        <View className="flex-row flex-wrap mb-2">
          {ideaTags.map((t) => (
            <Tag key={t.id} label={t.name} onRemove={() => handleTagToggle(t.id)} />
          ))}
        </View>
        <Pressable className="self-start mb-6" onPress={() => setTagPickerVisible(true)}>
          <Text className="text-teal-400 text-sm">+ Add tag</Text>
        </Pressable>

        <Text className="text-gray-400 text-sm font-medium mb-2">Linked Goals</Text>
        {linkedGoals.map((g) => (
          <View key={g.id} className="bg-gray-800 rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between">
            <Text className="text-white flex-1" numberOfLines={1}>{g.title}</Text>
            <Pressable onPress={() => handleGoalToggle(g.id)}>
              <Ionicons name="close-circle-outline" size={18} color="#6b7280" />
            </Pressable>
          </View>
        ))}
        <Pressable className="flex-row items-center gap-2 mb-6" onPress={() => setGoalPickerVisible(true)}>
          <Ionicons name="add-circle-outline" size={18} color="#2dd4bf" />
          <Text className="text-teal-400 text-sm">Link goal</Text>
        </Pressable>
      </ScrollView>

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
