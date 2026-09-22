import { useMemo, useRef, useState } from 'react';
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
import { useThemeColors } from '../context/ThemeContext';
import type { EntityGraphEdge, EntityGraphNode, EntityGraphNodeType } from '../hooks/use-entity-graph';

export type PositionedNode = EntityGraphNode & SimulationNodeDatum & {
  x: number;
  y: number;
};

type RelationshipGraphProps = {
  nodes: EntityGraphNode[];
  edges: EntityGraphEdge[];
  onNodePress: (node: EntityGraphNode) => void;
};

export type NodeVisual = {
  color: string;
  glow: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
};

export const DOUBLE_TAP_DELAY_MS = 300;

export const NODE_VISUALS: Record<EntityGraphNodeType, NodeVisual> = {
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

export function buildLayout(nodes: EntityGraphNode[], edges: EntityGraphEdge[], width: number, height: number) {
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

  const degreeById = new Map<string, number>();
  simulationLinks.forEach((link) => {
    degreeById.set(link.source, (degreeById.get(link.source) ?? 0) + 1);
    degreeById.set(link.target, (degreeById.get(link.target) ?? 0) + 1);
  });

  forceSimulation(simulationNodes)
    .force('charge', forceManyBody<PositionedNode>().strength(-460))
    .force('center', forceCenter(width / 2, height / 2))
    .force(
      'collide',
      forceCollide<PositionedNode>()
        .radius((node) => 78 + Math.min(degreeById.get(node.id) ?? 0, 6) * 6)
        .strength(0.95)
        .iterations(3),
    )
    .force(
      'link',
      forceLink<PositionedNode, { source: string; target: string }>(simulationLinks)
        .id((node) => node.id)
        .distance(190)
        .strength(0.64),
    )
    .stop()
    .tick(260);

  const padding = 130;
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

export function edgeStyle(source: PositionedNode, target: PositionedNode, edgeColor: string) {
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
    backgroundColor: edgeColor,
    transform: [{ rotate: angle }],
    transformOrigin: '0px 0px',
  };
}

type GraphNodeMarkerProps = {
  node: PositionedNode;
  isSelected: boolean;
  onToggle: (node: EntityGraphNode) => void;
  onOpen: (node: EntityGraphNode) => void;
  glowScale?: number;
};

export function GraphNodeMarker({ node, isSelected, onToggle, onOpen, glowScale = 1 }: GraphNodeMarkerProps) {
  const colors = useThemeColors();
  const visual = NODE_VISUALS[node.type];
  const glowSize = 76 * glowScale;
  const badgeSize = 48 * glowScale;
  const iconWrapSize = 28 * glowScale;
  const lastTapRef = useRef(0);

  const handlePress = () => {
    const now = Date.now();
    const isDoubleTap = isSelected && now - lastTapRef.current < DOUBLE_TAP_DELAY_MS;
    lastTapRef.current = now;
    if (isDoubleTap) {
      onOpen(node);
      return;
    }
    onToggle(node);
  };

  return (
    <Pressable
      onPress={handlePress}
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
        zIndex: isSelected ? 10 : 1,
        elevation: isSelected ? 10 : 1,
      }}
    >
      <View
        style={{
          width: glowSize,
          height: glowSize,
          borderRadius: glowSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: visual.glow,
        }}
      >
        <View
          style={{
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: visual.color,
          }}
        >
          <View
            style={{
              width: iconWrapSize,
              height: iconWrapSize,
              borderRadius: iconWrapSize / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
            }}
          >
            <Ionicons name={visual.icon} size={16} color={visual.color} />
          </View>
        </View>
      </View>
      {isSelected ? (
        <View
          style={{
            maxWidth: 112,
            minHeight: 42,
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: 10,
            borderCurve: 'continuous',
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            selectable
            numberOfLines={2}
            style={{
              color: colors.foreground,
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
      ) : null}
    </Pressable>
  );
}

export function RelationshipGraph({ nodes, edges, onNodePress }: RelationshipGraphProps) {
  const colors = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const handleToggle = (node: EntityGraphNode) => {
    setSelectedId((prev) => (prev === node.id ? null : node.id));
  };
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
        backgroundColor: colors.surface,
        borderRadius: 28,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ minWidth: graphWidth }}
        onLayout={(event) => {
          const visibleWidth = event.nativeEvent.layout.width;
          const centerX = Math.max(0, (graphWidth - visibleWidth) / 2);
          scrollRef.current?.scrollTo({ x: centerX, y: 0, animated: false });
        }}
      >
        <View style={{ width: graphWidth, height: graphHeight }}>
          <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
            {drawableEdges.map(({ edge, source, target }) => (
              <View key={edge.id} style={edgeStyle(source, target, colors.border)} />
            ))}
          </View>

          {positionedNodes.map((node) => (
            <GraphNodeMarker
              key={node.id}
              node={node}
              isSelected={node.id === selectedId}
              onToggle={handleToggle}
              onOpen={onNodePress}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
