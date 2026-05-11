import { Modal, Pressable, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function ModalSheet({ visible, onClose, title, children }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50" onPress={onClose} />
      <View className="bg-gray-900 rounded-t-3xl px-6 pt-4 pb-10" style={{ maxHeight: '85%' }}>
        <View className="w-10 h-1 bg-gray-600 rounded-full self-center mb-4" />
        {title && <Text className="text-xl font-bold text-white mb-4">{title}</Text>}
        {children}
      </View>
    </Modal>
  );
}
