import { useState } from 'react';
import { Animated, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIdeas } from '../../../hooks/use-ideas';
import { IdeaCard } from '../../../components/IdeaCard';
import { CreateIdeaModal } from '../../../components/CreateIdeaModal';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CollapsibleHeader } from '../../../components/ui/CollapsibleHeader';
import { RefreshIndicator } from '../../../components/ui/RefreshIndicator';
import { useCollapsibleHeader, HEADER_HEIGHT } from '../../../hooks/use-collapsible-header';
import { useThemeColors } from '../../../context/ThemeContext';

export default function IdeasScreen() {
  const router = useRouter();
  const { ideas, loading, create, refetch } = useIdeas();
  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const colors = useThemeColors();

  const { isRefreshing, handleRefresh, refreshPaneAnim, headerTranslateY, onScroll } = useCollapsibleHeader(refetch);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? ideas.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        (i.description ?? '').toLowerCase().includes(q),
      )
    : ideas;

  return (
    <View className="flex-1 bg-background">
      <CollapsibleHeader translateY={headerTranslateY}>
        <View className="flex-row justify-end mb-3">
          <Pressable className="w-9 h-9 rounded-full bg-surface items-center justify-center border border-border" onPress={() => router.push('/(app)/settings')} accessibilityRole="button" accessibilityLabel="Settings">
            <Ionicons name="settings-outline" size={16} color={colors.muted} />
          </Pressable>
        </View>
        <Text className="text-2xl font-bold text-foreground font-rounded pb-3">Ideas</Text>
      </CollapsibleHeader>

      <RefreshIndicator animValue={refreshPaneAnim} top={HEADER_HEIGHT} />

      <Animated.FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="transparent"
            colors={['transparent']}
            progressBackgroundColor="transparent"
          />
        }
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingHorizontal: 20, paddingBottom: 100, width: '100%', maxWidth: 720, alignSelf: 'center' }}
        ListHeaderComponent={
          <View className="mb-3">
            <TextInput
              className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border"
              placeholder="Search ideas..."
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="bulb-outline"
              {...(query.trim()
                ? { title: 'No matching ideas', subtitle: 'Try a different search or capture a new thought.' }
                : { title: 'No ideas yet', subtitle: 'Capture the thought now, organize it later, and connect it when it becomes useful.', actionLabel: 'Capture idea', onAction: () => setModalVisible(true) }
              )}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <IdeaCard idea={item} onPress={() => router.push(`/(app)/ideas/${item.id}`)} />
        )}
      />

      <Pressable
        className="absolute bottom-24 right-6 bg-primary rounded-full w-14 h-14 items-center justify-center shadow-lg border border-primary/40"
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Capture idea"
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
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
