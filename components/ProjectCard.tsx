import { Pressable, Text } from 'react-native';
import type { Project } from '../types';

type Props = {
  project: Project;
  onPress: () => void;
};

export function ProjectCard({ project, onPress }: Props) {
  return (
    <Pressable className="bg-surface rounded-2xl p-4 mb-3 border border-border" onPress={onPress}>
      <Text className="text-foreground font-normal font-rounded text-base mb-1" numberOfLines={2}>{project.title}</Text>
      {project.main_goal ? (
        <Text className="text-muted text-sm font-rounded italic" numberOfLines={2}>{project.main_goal}</Text>
      ) : null}
    </Pressable>
  );
}
