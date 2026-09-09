import { useEffect, useState } from 'react';
import { Keyboard, Modal, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { vars } from 'nativewind';
import { useTheme } from '../../context/ThemeContext';
import { darkVars, lightVars } from '../../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function ModalSheet({ visible, onClose, title, children }: Props) {
  const { height } = useWindowDimensions();
  const [kbHeight, setKbHeight] = useState(0);
  const { colorScheme } = useTheme();
  const themeStyle = vars(colorScheme === 'dark' ? darkVars : lightVars);

  useEffect(() => {
    if (!visible) { setKbHeight(0); return; }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, [visible]);

  // Available vertical space: full height minus keyboard, then cap at 90% of that
  const PADDING = 20;
  const maxCardHeight = Math.max(160, (height - kbHeight - PADDING * 2) * 0.95);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: PADDING,
          paddingTop: PADDING,
          paddingBottom: kbHeight + PADDING,
        }}
      >
        {/* Four prior fixes on this file (flexShrink, maxHeight-on-ScrollView, both
            together, then a measured-content-height rework) all assumed the bug was
            about the ScrollView's height, and none fixed scrolling on device. The
            actual cause: the ScrollView used to be nested inside two layered
            Pressables (this backdrop + a no-op card wrapper), and a full-screen
            Pressable ancestor can win the touch-responder negotiation over a nested
            ScrollView's own pan gesture regardless of how correctly it's sized. The
            backdrop is now a non-interactive View with only an absolutely-positioned
            tap target behind the card, so the ScrollView below is the sole scroll
            gesture owner in this subtree. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close modal"
          onPress={onClose}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View className="w-full max-w-sheet">
          <View className="bg-background rounded-sheet border border-border overflow-hidden" style={themeStyle}>
            <ScrollView
              style={{ maxHeight: maxCardHeight }}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }}
            >
              {title && (
                <Text className="font-rounded text-xl font-bold text-foreground mb-4">
                  {title}
                </Text>
              )}
              {children}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}
