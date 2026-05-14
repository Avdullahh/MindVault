import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth-context';

export default function Settings() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  const email = session?.user.email ?? '';
  const initials = email ? email.slice(0, 2).toUpperCase() : '??';

  return (
    <View className="flex-1 bg-leather-900">
      <View className="flex-row items-center px-5 pt-14 pb-4">
        <Pressable
          className="w-11 h-11 items-center justify-center rounded-full bg-leather-800 mr-3"
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color="#d4a017" />
        </Pressable>
        <Text className="text-2xl font-bold text-leather-50" style={{ fontFamily: 'Georgia' }}>Settings</Text>
      </View>

      <View className="px-5">
        <View className="bg-leather-800 rounded-2xl border border-leather-600 p-5 mb-6">
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-full bg-leather-700 border border-gold-700 items-center justify-center">
              <Text className="text-gold-400 text-lg font-bold" style={{ fontFamily: 'Georgia' }}>{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-leather-300 text-xs uppercase tracking-widest mb-0.5" style={{ letterSpacing: 1.5 }}>Signed in as</Text>
              <Text className="text-leather-50 font-medium" numberOfLines={1}>{email}</Text>
            </View>
          </View>
        </View>

        <Pressable
          className="bg-leather-800 rounded-xl py-4 px-5 items-center flex-row justify-between border border-leather-600"
          onPress={signOut}
          accessibilityRole="button"
        >
          <Text className="text-red-400 font-medium">Sign out</Text>
          <Ionicons name="log-out-outline" size={20} color="#f87171" />
        </Pressable>
      </View>
    </View>
  );
}
