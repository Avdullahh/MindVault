import { useMemo } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useThemeColors } from '../context/ThemeContext';
import type { EntityGraphEdge, EntityGraphEdgeType, EntityGraphNode } from '../hooks/use-entity-graph';
import { GraphNodeMarker, NODE_VISUALS, buildLayout, edgeStyle, type PositionedNode } from './RelationshipGraph';

type RelationshipGraphFullscreenProps = {
  nodes: EntityGraphNode[];
  edges: EntityGraphEdge[];
  onNodePress: (node: EntityGraphNode) => void;
};

function edgeColorForType(type: EntityGraphEdgeType) {
  switch (type) {
    case 'project_idea':
      return NODE_VISUALS.idea.color;
    case 'goal_idea':
      return NODE_VISUALS.goal.color;
    case 'goal_project':
      return NODE_VISUALS.project.color;
    default:
      return NODE_VISUALS.idea.color;
  }
}

export function RelationshipGraphFullscreen({ nodes, edges, onNodePress }: RelationshipGraphFullscreenProps) {
  const colors = useThemeColors();
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const graphWidth = viewportWidth * 1.6;
  const graphHeight = viewportHeight * 1.6;

  const positionedNodes = useMemo(
    () => buildLayout(nodes, edges, graphWidth, graphHeight),
    [nodes, edges, graphWidth, graphHeight],
  );
  const nodeById = useMemo(
    () => new Map(positionedNodes.map((node) => [node.id, node])),
    [positionedNodes],
  );
  const drawableEdges = useMemo(
    () => edges
      .map((edge) => ({ edge, source: nodeById.get(edge.source), target: nodeById.get(edge.target) }))
      .filter((item): item is { edge: EntityGraphEdge; source: PositionedNode; target: PositionedNode } => Boolean(item.source && item.target)),
    [edges, nodeById],
  );
  const degreeById = useMemo(() => {
    const degree = new Map<string, number>();
    edges.forEach((edge) => {
      degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
      degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    });
    return degree;
  }, [edges]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ width: graphWidth, height: graphHeight }}
      minimumZoomScale={0.6}
      maximumZoomScale={3}
      bouncesZoom
      centerContent
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: graphWidth, height: graphHeight }}>
        <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
          {drawableEdges.map(({ edge, source, target }) => (
            <View key={edge.id} style={edgeStyle(source, target, edgeColorForType(edge.type))} />
          ))}
        </View>

        {positionedNodes.map((node) => {
          const degree = degreeById.get(node.id) ?? 0;
          const glowScale = 1 + Math.min(degree, 6) * 0.06;
          return (
            <GraphNodeMarker key={node.id} node={node} onPress={onNodePress} glowScale={glowScale} />
          );
        })}
      </View>
    </ScrollView>
  );
}
