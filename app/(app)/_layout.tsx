import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconsName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#374151' },
        tabBarActiveTintColor: '#2dd4bf',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home-outline') }}
      />
      <Tabs.Screen
        name="ideas/index"
        options={{ title: 'Ideas', tabBarIcon: tabIcon('bulb-outline') }}
      />
      <Tabs.Screen
        name="goals/index"
        options={{ title: 'Goals', tabBarIcon: tabIcon('flag-outline') }}
      />
      <Tabs.Screen
        name="projects/index"
        options={{ title: 'Projects', tabBarIcon: tabIcon('folder-outline') }}
      />
      <Tabs.Screen
        name="calendar/index"
        options={{ title: 'Calendar', tabBarIcon: tabIcon('calendar-outline') }}
      />
      <Tabs.Screen
        name="tasks/index"
        options={{ title: 'Tasks', tabBarIcon: tabIcon('checkmark-circle-outline') }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
