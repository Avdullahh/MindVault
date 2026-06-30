import type { Project } from '../types';
import { EntityCard } from './ui/EntityCard';

type Props = {
  project: Project;
  onPress: () => void;
};

export function ProjectCard({ project, onPress }: Props) {
  return (
    <EntityCard title={project.title} subtitle={project.main_goal} onPress={onPress} />
  );
}
