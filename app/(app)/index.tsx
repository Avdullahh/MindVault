import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAI } from '../../hooks/use-ai';

export default function DashboardScreen() {
  const { morningBrief, briefState } = useAI();
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View className="flex-1 bg-gray-900">
      <View className="px-5 pt-14 pb-4">
        <Text className="text-2xl font-bold text-white">Good morning</Text>
        <Text className="text-gray-500 text-sm mt-1">{dateLabel}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {briefState.status === 'idle' && (
          <Pressable
            className="flex-row items-center justify-center gap-3 bg-teal-900/40 border border-teal-700 rounded-2xl py-4 mb-4"
            onPress={() => morningBrief()}
          >
            <Ionicons name="sparkles-outline" size={20} color="#2dd4bf" />
            <Text className="text-teal-400 font-semibold">Generate morning brief</Text>
          </Pressable>
        )}

        {briefState.status === 'loading' && (
          <View className="items-center py-10">
            <ActivityIndicator color="#2dd4bf" size="large" />
            <Text className="text-gray-400 mt-3 text-sm">Preparing your brief…</Text>
          </View>
        )}

        {briefState.status === 'error' && (
          <View className="bg-gray-800 rounded-2xl p-4 mb-4">
            <Text className="text-red-400 text-sm mb-3">{briefState.error}</Text>
            <Pressable
              className="flex-row items-center gap-2"
              onPress={() => morningBrief()}
            >
              <Ionicons name="refresh-outline" size={16} color="#2dd4bf" />
              <Text className="text-teal-400 text-sm">Try again</Text>
            </Pressable>
          </View>
        )}

        {briefState.status === 'success' && briefState.data && (
          <>
            <View className="bg-gray-800 rounded-2xl p-4 mb-4">
              <Text className="text-white text-base leading-relaxed">{briefState.data.greeting}</Text>
            </View>

            {briefState.data.events.length > 0 && (
              <View className="bg-gray-800 rounded-2xl p-4 mb-4">
                <Text className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-3">Today</Text>
                {briefState.data.events.map((event, i) => (
                  <View key={i} className="flex-row gap-2 mb-2">
                    <Text className="text-teal-500 text-sm">·</Text>
                    <Text className="text-gray-200 text-sm flex-1">{event}</Text>
                  </View>
                ))}
              </View>
            )}

            {briefState.data.resurface && (
              <View className="bg-gray-800 rounded-2xl p-4 mb-4">
                <Text className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">Revisit this idea</Text>
                <Text className="text-white font-semibold mb-1">{briefState.data.resurface.title}</Text>
                <Text className="text-gray-400 text-sm">{briefState.data.resurface.description}</Text>
              </View>
            )}

            <Pressable
              className="flex-row items-center justify-center gap-2 py-3"
              onPress={() => morningBrief()}
            >
              <Ionicons name="refresh-outline" size={16} color="#6b7280" />
              <Text className="text-gray-500 text-sm">Regenerate</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}
