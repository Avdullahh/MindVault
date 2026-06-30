import { useMemo } from 'react';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationNodeDatum,
} from 'd3-force';
import type { EntityGraphEdge, EntityGraphNode, EntityGraphNodeType } from '../hooks/use-entity-graph';

type PositionedNode = EntityGraphNode & SimulationNodeDatum & {
  x: number;
  y: number;
};

type RelationshipGraphProps = {
  nodes: EntityGraphNode[];
  edges: EntityGraphEdge[];
  onNodePress: (node: EntityGraphNode) => void;
};

type NodeVisual = {
  color: string;
  glow: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
};

const NODE_VISUALS: Record<EntityGraphNodeType, NodeVisual> = {
  idea: {
    color: '#22d3ee',
    glow: 'rgba(34, 211, 238, 0.16)',
    icon: 'bulb-outline',
    label: 'Idea',
  },
  project: {
    color: '#0f766e',
    glow: 'rgba(15, 118, 110, 0.18)',
    icon: 'folder-outline',
    label: 'Project',
  },
  goal: {
    color: '#5b21b6',
    glow: 'rgba(91, 33, 182, 0.2)',
    icon: 'flag-outline',
    label: 'Goal',
  },
};

function buildLayout(nodes: EntityGraphNode[], edges: EntityGraphEdge[], width: number, height: number) {
  if (nodes.length === 0) return [];

  const simulationNodes: PositionedNode[] = nodes.map((node, index) => ({
    ...node,
    x: width / 2 + Math.cos(index) * 140,
    y: height / 2 + Math.sin(index) * 140,
  }));
  const validNodeIds = new Set(simulationNodes.map((node) => node.id));
  const simulationLinks = edges
    .filter((edge) => validNodeIds.has(edge.source) && validNodeIds.has(edge.target))
    .map((edge) => ({ source: edge.source, target: edge.target }));

  forceSimulation(simulationNodes)
    .force('charge', forceManyBody<PositionedNode>().strength(-460))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide<PositionedNode>().radius(78).strength(0.95))
    .force(
      'link',
      forceLink<PositionedNode, { source: string; target: string }>(simulationLinks)
        .id((node) => node.id)
        .distance(190)
        .strength(0.64),
    )
    .stop()
    .tick(220);

  const padding = 110;
  const minX = Math.min(...simulationNodes.map((node) => node.x));
  const maxX = Math.max(...simulationNodes.map((node) => node.x));
  const minY = Math.min(...simulationNodes.map((node) => node.y));
  const maxY = Math.max(...simulationNodes.map((node) => node.y));
  const graphWidth = Math.max(1, maxX - minX);
  const graphHeight = Math.max(1, maxY - minY);
  const scale = Math.min((width - padding * 2) / graphWidth, (height - padding * 2) / graphHeight, 1);

  return simulationNodes.map((node) => ({
    ...node,
    x: (node.x - minX - graphWidth / 2) * scale + width / 2,
    y: (node.y - minY - graphHeight / 2) * scale + height / 2,
  }));
}

function edgeStyle(source: PositionedNode, target: PositionedNode) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = `${Math.atan2(dy, dx)}rad`;

  return {
    position: 'absolute' as const,
    left: source.x,
    top: source.y,
    width: length,
    height: 1.5,
    backgroundColor: 'rgba(148, 163, 184, 0.36)',
    transform: [{ rotate: angle }],
    transformOrigin: '0px 0px',
  };
}

export function RelationshipGraph({ nodes, edges, onNodePress }: RelationshipGraphProps) {
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const graphWidth = Math.max(980, viewportWidth * 1.35);
  const graphHeight = Math.max(720, viewportHeight * 0.72);
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

  return (
    <View
      style={{
        height: graphHeight,
        overflow: 'hidden',
        backgroundColor: '#111827',
        borderRadius: 28,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: '#253142',
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ minWidth: graphWidth }}
      >
        <View style={{ width: graphWidth, height: graphHeight }}>
          <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
            {drawableEdges.map(({ edge, source, target }) => (
              <View key={edge.id} style={edgeStyle(source, target)} />
            ))}
          </View>

          {positionedNodes.map((node) => {
            const visual = NODE_VISUALS[node.type];
            return (
              <Pressable
                key={node.id}
                onPress={() => onNodePress(node)}
                accessibilityRole="button"
                accessibilityLabel={`${visual.label}: ${node.title}`}
                style={{
                  position: 'absolute',
                  left: node.x - 58,
                  top: node.y - 58,
                  width: 116,
                  minHeight: 104,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                }}
              >
                <View
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: visual.glow,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: visual.color,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#111827',
                      }}
                    >
                      <Ionicons name={visual.icon} size={16} color={visual.color} />
                    </View>
                  </View>
                </View>
                <View
                  style={{
                    maxWidth: 112,
                    minHeight: 42,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderRadius: 10,
                    borderCurve: 'continuous',
                    backgroundColor: 'rgba(17, 24, 39, 0.88)',
                    borderWidth: 1,
                    borderColor: 'rgba(148, 163, 184, 0.22)',
                  }}
                >
                  <Text
                    selectable
                    numberOfLines={2}
                    style={{
                      color: '#f8fafc',
                      fontSize: 11,
                      lineHeight: 14,
                      fontWeight: '700',
                      textAlign: 'center',
                      includeFontPadding: false,
                    }}
                  >
                    {node.title}
                  </Text>
                  <Text
                    selectable
                    numberOfLines={1}
                    style={{
                      color: visual.color,
                      fontSize: 9,
                      lineHeight: 12,
                      fontWeight: '700',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      includeFontPadding: false,
                    }}
                  >
                    {visual.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
