import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../../context/auth-context';

export default function Dashboard() {
  const { signOut, session } = useAuth();

  return (
    <View className="flex-1 bg-gray-900 justify-center items-center px-6">
      <Text className="text-2xl text-teal-400 font-bold mb-2">MindVault</Text>
      <Text className="text-gray-400 mb-10">{session?.user.email}</Text>
      <Pressable
        className="bg-gray-700 rounded-xl px-6 py-3"
        onPress={signOut}
      >
        <Text className="text-white">Sign out</Text>
      </Pressable>
    </View>
  );
}
