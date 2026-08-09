import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from './EmptyState';

type IconName = ComponentProps<typeof Ionicons>['name'];

type EntityListScreenProps<T extends { id: string }> = {
  title: string;
  data: T[];
  loading: boolean;
  refetch: () => Promise<void>;
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder: string;
  emptyIcon: IconName;
  emptyTitle: string;
  emptySubtitle: string;
  emptyActionLabel: string;
  searchEmptyTitle: string;
  searchEmptySubtitle: string;
  createAccessibilityLabel: string;
  onCreatePress: () => void;
  renderItem: (item: T) => ReactElement | null;
  children?: ReactNode;
};

export function EntityListScreen<T extends { id: string }>({
  title,
  data,
  loading,
  refetch,
  query,
  onQueryChange,
  searchPlaceholder,
  emptyIcon,
  emptyTitle,
  emptySubtitle,
  emptyActionLabel,
  searchEmptyTitle,
  searchEmptySubtitle,
  createAccessibilityLabel,
  onCreatePress,
  renderItem,
  children,
}: EntityListScreenProps<T>) {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const hasQuery = Boolean(query.trim());

  return (
    <View className="flex-1 bg-background">
      <View className="bg-background px-5 pt-14 pb-4">
        <View className="flex-row justify-end mb-3">
          <Pressable
            className="w-9 h-9 rounded-full bg-surface items-center justify-center border border-border"
            onPress={() => router.push('/(app)/settings')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={16} color={colors.muted} />
          </Pressable>
        </View>
        <Text className="text-2xl font-bold text-foreground font-rounded">{title}</Text>
      </View>

      <FlatList<T>
        data={data}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
        }}
        ListHeaderComponent={
          <View className="mb-3">
            <View className="justify-center">
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.muted}
                style={{ position: 'absolute', left: 14, zIndex: 1 }}
              />
              <TextInput
                className="bg-surface text-foreground rounded-control pl-11 pr-4 py-3 border border-border"
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={onQueryChange}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon={emptyIcon}
              {...(hasQuery
                ? { title: searchEmptyTitle, subtitle: searchEmptySubtitle }
                : {
                    title: emptyTitle,
                    subtitle: emptySubtitle,
                    actionLabel: emptyActionLabel,
                    onAction: onCreatePress,
                  })}
            />
          ) : null
        }
        renderItem={({ item }) => renderItem(item)}
      />

      <Pressable
        className={`absolute bottom-24 right-6 bg-primary rounded-pill w-14 h-14 items-center justify-center border ${
          colorScheme === 'dark' ? 'border-surface-2' : 'shadow-e3 border-primary/40'
        }`}
        onPress={onCreatePress}
        accessibilityRole="button"
        accessibilityLabel={createAccessibilityLabel}
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </Pressable>

      {children}
    </View>
  );
}
