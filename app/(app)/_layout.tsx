import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../lib/storage';
import { useTheme } from '../../context/theme-context';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const VALID_TABS = ['index', 'ideas/index', 'goals/index', 'projects/index', 'calendar/index'];

function tabIcon(name: IoniconsName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function AppLayout() {
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const { resolvedTheme } = useTheme();
  const tabBarColors = resolvedTheme === 'light'
    ? { backgroundColor: '#fffaf0', borderTopColor: '#e8d5a8', active: '#9a6e08', inactive: '#7a6050' }
    : { backgroundColor: '#141009', borderTopColor: '#3d2b1a', active: '#d4a017', inactive: '#7a6050' };

  useEffect(() => {
    storage.getLastTab().then((saved) => {
      setInitialTab(saved && VALID_TABS.includes(saved) ? saved : 'index');
      setReady(true);
    });
  }, []);

  if (!ready) return <View className="flex-1 bg-leather-900" />;

  return (
    <Tabs
      initialRouteName={initialTab}
      screenListeners={{
        tabPress: (e) => {
          const routeName = e.target?.split('-')[0];
          if (routeName && VALID_TABS.includes(routeName)) {
            storage.setLastTab(routeName);
          }
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: tabBarColors.backgroundColor, borderTopColor: tabBarColors.borderTopColor },
        tabBarActiveTintColor: tabBarColors.active,
        tabBarInactiveTintColor: tabBarColors.inactive,
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
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
