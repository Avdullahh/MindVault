import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RelationshipGraph } from '../../components/RelationshipGraph';
import { useThemeColors } from '../../context/ThemeContext';
import { useEntityGraph, type EntityGraphNode } from '../../hooks/use-entity-graph';

function routeForNode(node: EntityGraphNode) {
  if (node.type === 'idea') return `/(app)/ideas/${node.entityId}` as const;
  if (node.type === 'goal') return `/(app)/goals/${node.entityId}` as const;
  return `/(app)/projects/${node.entityId}` as const;
}

export default function MindMapScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { nodes, edges, loading, refreshing, error, refetch } = useEntityGraph();

  const ideaCount = nodes.filter((node) => node.type === 'idea').length;
  const projectCount = nodes.filter((node) => node.type === 'project').length;
  const goalCount = nodes.filter((node) => node.type === 'goal').length;

  const handleNodePress = (node: EntityGraphNode) => {
    router.push(routeForNode(node));
  };

  return (
    <View className="flex-1 bg-background">
      <View className="bg-background px-5 pt-14 pb-4">
        <View className="flex-row justify-end mb-3">
          <Pressable
            className="w-9 h-9 rounded-full bg-surface items-center justify-center border border-border"
            onPress={() => router.push('/(app)/settings')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={16} color={colors.muted} />
          </Pressable>
        </View>
        <Text className="text-2xl font-bold text-foreground font-rounded">Mind Map</Text>
        <Text className="text-muted text-sm mt-1">
          Ideas, projects, and goals connected from your vault.
        </Text>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
          width: '100%',
          maxWidth: 980,
          alignSelf: 'center',
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row gap-2">
          <View className="flex-1 rounded-2xl bg-surface border border-border px-3 py-3">
            <Text className="text-muted text-[11px] font-semibold uppercase">Ideas</Text>
            <Text className="text-foreground text-xl font-bold mt-1" style={{ fontVariant: ['tabular-nums'] }}>
              {ideaCount}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-surface border border-border px-3 py-3">
            <Text className="text-muted text-[11px] font-semibold uppercase">Projects</Text>
            <Text className="text-foreground text-xl font-bold mt-1" style={{ fontVariant: ['tabular-nums'] }}>
              {projectCount}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-surface border border-border px-3 py-3">
            <Text className="text-muted text-[11px] font-semibold uppercase">Goals</Text>
            <Text className="text-foreground text-xl font-bold mt-1" style={{ fontVariant: ['tabular-nums'] }}>
              {goalCount}
            </Text>
          </View>
        </View>

        {loading ? (
          <View className="min-h-[360px] rounded-3xl bg-surface border border-border items-center justify-center gap-3">
            <ActivityIndicator color={colors.primary} />
            <Text selectable className="text-muted text-sm">
              Loading graph...
            </Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View className="rounded-3xl bg-surface border border-destructive p-5 gap-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name="warning-outline" size={20} color={colors.destructive} />
              <Text selectable className="text-foreground font-semibold flex-1">
                Mind map could not load.
              </Text>
            </View>
            <Text selectable className="text-muted text-sm leading-5">
              {error}
            </Text>
            <Pressable
              onPress={refetch}
              accessibilityRole="button"
              className="self-start rounded-full bg-primary px-4 py-2"
            >
              <Text className="text-primary-foreground font-semibold">Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && nodes.length === 0 ? (
          <View className="min-h-[360px] rounded-3xl bg-surface border border-border items-center justify-center px-6">
            <Ionicons name="git-network-outline" size={32} color={colors.primary} />
            <Text selectable className="text-foreground font-semibold text-lg mt-4">
              No graph yet
            </Text>
            <Text selectable className="text-muted text-sm text-center leading-5 mt-2">
              Create an idea, project, or goal, then link them together to build your map.
            </Text>
          </View>
        ) : null}

        {!loading && !error && nodes.length > 0 ? (
          <RelationshipGraph nodes={nodes} edges={edges} onNodePress={handleNodePress} />
        ) : null}
      </ScrollView>
    </View>
  );
}
