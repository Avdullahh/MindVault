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
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <Text className="text-2xl font-bold text-leather-50" style={{ fontFamily: 'Georgia' }}>Ideas</Text>
        <Pressable onPress={() => router.push('/(app)/settings')}>
          <Ionicons name="settings-outline" size={22} color="#7a6050" />
        </Pressable>
      </View>

      <View className="px-5 mb-3">
        <TextInput
          className="bg-leather-800 text-leather-50 rounded-xl px-4 py-3"
          placeholder="Search ideas..."
          placeholderTextColor="#7a6050"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No ideas yet" subtitle="Tap + to capture your first idea" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
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
