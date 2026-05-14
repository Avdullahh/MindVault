import { Pressable, Text } from 'react-native';
import type { Project } from '../types';

type Props = {
  project: Project;
  onPress: () => void;
};

export function ProjectCard({ project, onPress }: Props) {
  return (
    <Pressable className="bg-leather-800 rounded-2xl p-4 mb-3" onPress={onPress}>
      <Text className="text-leather-50 font-semibold text-base mb-1" numberOfLines={2}>{project.title}</Text>
      {project.main_goal ? (
        <Text className="text-leather-300 text-sm" numberOfLines={2}>{project.main_goal}</Text>
      ) : null}
    </Pressable>
  );
}
