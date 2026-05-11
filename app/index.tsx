import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      setStatus(
        error
          ? `error: ${error.message}`
          : `session: ${data.session ? 'yes' : 'none (expected)'}`,
      );
    })();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-gray-900 p-6">
      <Text className="text-2xl text-teal-400 mb-4">MindVault</Text>
      <Text className="text-white">{status}</Text>
    </View>
  );
}
