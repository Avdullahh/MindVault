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
  const maxCardHeight = (height - kbHeight - PADDING * 2) * 0.95;

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
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 480 }}>
          <View
            className="bg-background rounded-3xl border border-border overflow-hidden"
            style={[{ maxHeight: maxCardHeight }, themeStyle]}
          >
            <ScrollView
              // flexShrink: 1 is required so this ScrollView actually shrinks to the
              // maxHeight-capped card above instead of growing to its full content
              // height (RN's default flexShrink is 0). Without it, the ScrollView
              // never realizes it needs to scroll -- the card's overflow-hidden just
              // silently clips the bottom instead of making it reachable.
              style={{ flexShrink: 1 }}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
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
