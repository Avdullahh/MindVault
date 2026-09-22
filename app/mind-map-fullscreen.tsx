import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RelationshipGraphFullscreen } from '../components/RelationshipGraphFullscreen';
import { useThemeColors } from '../context/ThemeContext';
import { useEntityGraph, type EntityGraphNode } from '../hooks/use-entity-graph';

function routeForNode(node: EntityGraphNode) {
  if (node.type === 'idea') return `/(app)/ideas/${node.entityId}` as const;
  if (node.type === 'goal') return `/(app)/goals/${node.entityId}` as const;
  return `/(app)/projects/${node.entityId}` as const;
}

export default function MindMapFullscreenScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { nodes, edges, loading, error } = useEntityGraph();

  const handleNodePress = (node: EntityGraphNode) => {
    router.push(routeForNode(node));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {loading || error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? (
            <Text selectable style={{ color: colors.muted, fontSize: 14, paddingHorizontal: 24, textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}
        </View>
      ) : (
        <RelationshipGraphFullscreen nodes={nodes} edges={edges} onNodePress={handleNodePress} />
      )}

      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Close fullscreen mind map"
        style={{
          position: 'absolute',
          top: insets.top + 12,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons name="close" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}
