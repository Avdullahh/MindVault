import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIdeas } from '../../../hooks/use-ideas';
import { IdeaCard } from '../../../components/IdeaCard';
import { CreateIdeaModal } from '../../../components/CreateIdeaModal';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function IdeasScreen() {
  const router = useRouter();
  const { ideas, loading, create } = useIdeas();
  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const filtered = query.trim()
    ? ideas.filter((i) =>
        i.title.toLowerCase().includes(query.toLowerCase()) ||
        (i.description ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : ideas;

  return (
    <View className="flex-1 bg-leather-900">
      <View className="px-5 pt-14 pb-3">
        <Text className="text-2xl font-bold text-leather-50" style={{ fontFamily: 'Georgia' }}>Ideas</Text>
      </View>

      <View className="px-5 mb-3 w-full max-w-3xl self-center">
        <TextInput
          className="bg-leather-800 text-leather-50 rounded-xl px-4 py-3"
          placeholder="Search ideas..."
          placeholderTextColor="#7a6050"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon="bulb-outline"
          {...(query.trim()
            ? { title: 'No matching ideas', subtitle: 'Try a different search or capture a new thought.' }
            : { title: 'No ideas yet', subtitle: 'Capture the thought now, organize it later, and connect it when it becomes useful.', actionLabel: 'Capture idea', onAction: () => setModalVisible(true) }
          )}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, width: '100%', maxWidth: 720, alignSelf: 'center' }}
          renderItem={({ item }) => (
            <IdeaCard idea={item} onPress={() => router.push(`/(app)/ideas/${item.id}`)} />
          )}
        />
      )}

      <Pressable
        className="absolute bottom-24 right-6 bg-gold-500 rounded-full w-14 h-14 items-center justify-center shadow-lg"
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <CreateIdeaModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={(title, description, categoryId) =>
          create({ title, description, category_id: categoryId })
        }
      />
    </View>
  );
}
