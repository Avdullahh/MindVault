import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useProjects } from '../../../hooks/use-projects';
import { ProjectCard } from '../../../components/ProjectCard';
import { CreateProjectModal } from '../../../components/CreateProjectModal';
import { EntityListScreen } from '../../../components/ui/EntityListScreen';

export default function ProjectsScreen() {
  const router = useRouter();
  const { projects, loading, create, refetch } = useProjects();
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q
    ? projects.filter((project) =>
        project.title.toLowerCase().includes(q) ||
        (project.main_goal ?? '').toLowerCase().includes(q),
      )
    : projects;

  return (
    <EntityListScreen
      title="Projects"
      data={filtered}
      loading={loading}
      refetch={refetch}
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Search projects..."
      emptyIcon="folder-outline"
      emptyTitle="No projects yet"
      emptySubtitle="Group related ideas, goals, and tasks when a theme becomes bigger than a single note."
      emptyActionLabel="Start project"
      searchEmptyTitle="No matching projects"
      searchEmptySubtitle="Try a different search or start a new project."
      createAccessibilityLabel="Start project"
      onCreatePress={() => setModalVisible(true)}
      renderItem={(item) => (
        <ProjectCard project={item} onPress={() => router.push(`/(app)/projects/${item.id}`)} />
      )}
    >
      <CreateProjectModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={create}
      />
    </EntityListScreen>
  );
}
