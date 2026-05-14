import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function ModalSheet({ visible, onClose, title, children }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="bg-leather-900 rounded-t-3xl px-6 pt-4 pb-10 border-t border-gold-800" style={{ maxHeight: '85%' }}>
          <View className="w-12 h-1 bg-leather-400 rounded-full self-center mb-4" />
          {title && (
            <Text className="text-xl font-bold text-leather-50 mb-4" style={{ fontFamily: 'Georgia' }}>
              {title}
            </Text>
          )}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
