import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useIdeas } from '../../../hooks/use-ideas';
import { IdeaCard } from '../../../components/IdeaCard';
import { CreateIdeaModal } from '../../../components/CreateIdeaModal';
import { EntityListScreen } from '../../../components/ui/EntityListScreen';

export default function IdeasScreen() {
  const router = useRouter();
  const { ideas, loading, create, refetch } = useIdeas();
  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? ideas.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        (i.description ?? '').toLowerCase().includes(q),
      )
    : ideas;

  return (
    <EntityListScreen
      title="Ideas"
      data={filtered}
      loading={loading}
      refetch={refetch}
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Search ideas..."
      emptyIcon="bulb-outline"
      emptyTitle="No ideas yet"
      emptySubtitle="Capture the thought now, organize it later, and connect it when it becomes useful."
      emptyActionLabel="Capture idea"
      searchEmptyTitle="No matching ideas"
      searchEmptySubtitle="Try a different search or capture a new thought."
      createAccessibilityLabel="Capture idea"
      onCreatePress={() => setModalVisible(true)}
      renderItem={(item) => (
        <IdeaCard idea={item} onPress={() => router.push(`/(app)/ideas/${item.id}`)} />
      )}
    >
      <CreateIdeaModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={(title, description, categoryId) =>
          create({ title, description, category_id: categoryId })
        }
      />
    </EntityListScreen>
  );
}
