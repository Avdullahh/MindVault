import { ActivityIndicator, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  loading: boolean;
  onPress: () => void;
  icon?: IoniconsName;
  glyph?: string;
  flex?: boolean;
};

export function AIButton({ label, loading, onPress, icon, glyph, flex = false }: Props) {
  return (
    <Pressable
      className={`${flex ? 'flex-1 ' : ''}flex-row items-center justify-center gap-2 py-2.5 rounded-xl border ${loading ? 'border-gray-700 bg-gray-800 opacity-50' : 'border-teal-700 bg-teal-900/40'}`}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#2dd4bf" />
      ) : icon ? (
        <Ionicons name={icon} size={14} color="#2dd4bf" />
      ) : (
        <Text className="text-lg">{glyph}</Text>
      )}
      <Text className="text-teal-400 text-sm font-medium">{label}</Text>
    </Pressable>
  );
}
