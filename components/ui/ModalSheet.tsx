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
  const [contentHeight, setContentHeight] = useState(0);
  const { colorScheme } = useTheme();
  const themeStyle = vars(colorScheme === 'dark' ? darkVars : lightVars);

  useEffect(() => {
    if (!visible) { setKbHeight(0); setContentHeight(0); return; }
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
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: PADDING,
          paddingTop: PADDING,
          paddingBottom: kbHeight + PADDING,
        }}
        onPress={onClose}
      >
        <Pressable className="w-full max-w-sheet" onPress={() => {}}>
          {/* Three prior attempts (flexShrink alone, maxHeight-on-ScrollView alone, and both
              together) relied on Yoga auto-computing the ScrollView's own bound from a
              maxHeight/flexShrink clamp, and none of them reliably made the ScrollView
              recognize it had overflow to scroll on device. Rather than try a fourth variant
              of the same "let Yoga figure out the bound" approach, this measures the actual
              rendered content height (onContentSizeChange) and gives the ScrollView a
              DEFINITE height -- min(measured content height, the screen-based cap) -- once
              known. A definite height is resolved identically by Yoga in every case, with no
              dependence on stretch/shrink propagation through the auto-sized Pressable/View
              wrappers above it. Before the first measurement (contentHeight === 0), it falls
              back to the cap so nothing is clipped on the very first frame. */}
          <View className="bg-background rounded-sheet border border-border overflow-hidden" style={themeStyle}>
            <ScrollView
              style={{ height: Math.min(contentHeight || maxCardHeight, maxCardHeight) }}
              onContentSizeChange={(_w, h) => setContentHeight(h)}
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}
