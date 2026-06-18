import { useState } from 'react';
import { Animated, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProjects } from '../../../hooks/use-projects';
import { ProjectCard } from '../../../components/ProjectCard';
import { CreateProjectModal } from '../../../components/CreateProjectModal';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CollapsibleHeader } from '../../../components/ui/CollapsibleHeader';
import { RefreshIndicator } from '../../../components/ui/RefreshIndicator';
import { useCollapsibleHeader, HEADER_HEIGHT } from '../../../hooks/use-collapsible-header';
import { useThemeColors } from '../../../context/ThemeContext';

export default function ProjectsScreen() {
  const router = useRouter();
  const { projects, loading, create, refetch } = useProjects();
  const [modalVisible, setModalVisible] = useState(false);
  const colors = useThemeColors();
  const [query, setQuery] = useState('');

  const { isRefreshing, handleRefresh, refreshPaneAnim, headerTranslateY, onScroll } = useCollapsibleHeader(refetch);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? projects.filter((project) =>
        project.title.toLowerCase().includes(q) ||
        (project.main_goal ?? '').toLowerCase().includes(q),
      )
    : projects;

  return (
    <View className="flex-1 bg-background">
      <CollapsibleHeader translateY={headerTranslateY}>
        <View className="flex-row justify-end mb-3">
          <Pressable className="w-9 h-9 rounded-full bg-surface items-center justify-center border border-border" onPress={() => router.push('/(app)/settings')} accessibilityRole="button" accessibilityLabel="Settings">
            <Ionicons name="settings-outline" size={16} color={colors.muted} />
          </Pressable>
        </View>
        <Text className="text-2xl font-bold text-foreground font-rounded pb-3">Projects</Text>
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
              placeholder="Search projects..."
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="folder-outline"
              {...(query.trim()
                ? { title: 'No matching projects', subtitle: 'Try a different search or start a new project.' }
                : { title: 'No projects yet', subtitle: 'Group related ideas, goals, and tasks when a theme becomes bigger than a single note.', actionLabel: 'Start project', onAction: () => setModalVisible(true) }
              )}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <ProjectCard project={item} onPress={() => router.push(`/(app)/projects/${item.id}`)} />
        )}
      />

      <Pressable
        className="absolute bottom-24 right-6 bg-primary rounded-full w-14 h-14 items-center justify-center shadow-lg border border-primary/40"
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Start project"
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </Pressable>

      <CreateProjectModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={create}
      />
    </View>
  );
}
