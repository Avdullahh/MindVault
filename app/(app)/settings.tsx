import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../../context/auth-context';

export default function Settings() {
  const { session, signOut } = useAuth();

  return (
    <View className="flex-1 bg-gray-900 px-6 pt-16">
      <Text className="text-2xl font-bold text-white mb-1">Account</Text>
      <Text className="text-gray-400 mb-10">{session?.user.email}</Text>
      <Pressable
        className="bg-gray-700 rounded-xl py-3 items-center"
        onPress={signOut}
      >
        <Text className="text-white font-medium">Sign out</Text>
      </Pressable>
    </View>
  );
}
