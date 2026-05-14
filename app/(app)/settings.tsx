import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../../context/auth-context';

export default function Settings() {
  const { session, signOut } = useAuth();

  return (
    <View className="flex-1 bg-leather-900 px-6 pt-16">
      <Text className="text-2xl font-bold text-leather-50 mb-1">Account</Text>
      <Text className="text-leather-300 mb-10">{session?.user.email}</Text>
      <Pressable
        className="bg-leather-600 rounded-xl py-3 items-center"
        onPress={signOut}
      >
        <Text className="text-leather-50 font-medium">Sign out</Text>
      </Pressable>
    </View>
  );
}
