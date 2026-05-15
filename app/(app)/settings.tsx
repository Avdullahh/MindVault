import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth-context';
import { useTheme, type ThemePreference } from '../../context/theme-context';

const OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Off-white surfaces, dark-brown text, and gold accents.' },
  { value: 'dark', label: 'Dark', description: 'The current leather and gold MindVault palette.' },
  { value: 'system', label: 'System', description: 'Copy your phone appearance automatically.' },
];

export default function Settings() {
  const { session, signOut } = useAuth();
  const { preference, resolvedTheme, setPreference } = useTheme();
  const router = useRouter();

  const light = resolvedTheme === 'light';
  const email = session?.user.email ?? '';
  const initials = email ? email.slice(0, 2).toUpperCase() : '??';
  const screen = light ? 'bg-[#fffaf0]' : 'bg-leather-900';
  const card = light ? 'bg-white border-[#e8d5a8]' : 'bg-leather-800 border-leather-600';
  const title = light ? 'text-[#2a170c]' : 'text-leather-50';
  const muted = light ? 'text-[#7a6050]' : 'text-leather-300';

  return (
    <View className={`flex-1 ${screen}`}>
      <View className="flex-row items-center px-5 pt-14 pb-4">
        <Pressable
          className={`w-11 h-11 items-center justify-center rounded-full mr-3 ${light ? 'bg-white' : 'bg-leather-800'}`}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color="#d4a017" />
        </Pressable>
        <Text className={`text-2xl font-bold ${title}`} style={{ fontFamily: 'Georgia' }}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
        <View className={`${card} rounded-2xl border p-5 mb-5`}>
          <View className="flex-row items-center gap-4">
            <View className={`${light ? 'bg-[#f5e6c8]' : 'bg-leather-700'} w-14 h-14 rounded-full border border-gold-700 items-center justify-center`}>
              <Text className="text-gold-400 text-lg font-bold" style={{ fontFamily: 'Georgia' }}>{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className={`${muted} text-xs uppercase tracking-widest mb-0.5`} style={{ letterSpacing: 1.5 }}>Signed in as</Text>
              <Text className={`${title} font-medium`} numberOfLines={1}>{email}</Text>
            </View>
          </View>
        </View>

        <Text className={`${muted} text-xs font-semibold uppercase mb-3`} style={{ letterSpacing: 1.5 }}>Theme</Text>
        <View className={`${card} rounded-2xl border overflow-hidden mb-6`}>
          {OPTIONS.map((option, index) => {
            const selected = preference === option.value;
            return (
              <Pressable
                key={option.value}
                className={`flex-row items-center gap-3 px-4 py-4 ${index > 0 ? light ? 'border-t border-[#efe1c3]' : 'border-t border-leather-600' : ''}`}
                onPress={() => setPreference(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
              >
                <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? '#d4a017' : '#7a6050'} />
                <View className="flex-1">
                  <Text className={`${title} font-semibold`}>{option.label}</Text>
                  <Text className={`${muted} text-xs mt-1`}>{option.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          className={`${card} rounded-xl py-4 px-5 items-center flex-row justify-between border`}
          onPress={signOut}
          accessibilityRole="button"
        >
          <Text className="text-red-400 font-medium">Sign out</Text>
          <Ionicons name="log-out-outline" size={20} color="#f87171" />
        </Pressable>
      </ScrollView>
    </View>
  );
}
