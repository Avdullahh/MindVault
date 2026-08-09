import { useEffect, useState } from 'react';
import { View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../lib/storage';
import { useThemeColors } from '../../context/ThemeContext';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const VALID_TABS = ['index', 'ideas/index', 'goals/index', 'projects/index', 'mind-map'];

function tabIcon(name: IoniconsName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function AppLayout() {
  const colors = useThemeColors();
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = storage.getLastTab();
    setInitialTab(saved && VALID_TABS.includes(saved) ? saved : 'index');
    setReady(true);
  }, []);

  if (!ready) return <View className="flex-1 bg-background" />;

  return (
    <Tabs
      initialRouteName={initialTab}
      screenListeners={{
        tabPress: (e) => {
          const routeName = VALID_TABS.find((tab) => e.target === tab || e.target?.startsWith(`${tab}-`));
          if (routeName && VALID_TABS.includes(routeName)) {
            storage.setLastTab(routeName);
          }
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
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
        name="mind-map"
        options={{ title: 'Map', tabBarIcon: tabIcon('git-network-outline') }}
      />
      <Tabs.Screen name="ideas/[id]" options={{ href: null }} />
      <Tabs.Screen name="goals/[id]" options={{ href: null }} />
      <Tabs.Screen name="projects/[id]" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      {/* DEV-ONLY design token reference — remove with app/(app)/tokens.tsx in cleanup. */}
      <Tabs.Screen name="tokens" options={{ href: null }} />
    </Tabs>
  );
}
