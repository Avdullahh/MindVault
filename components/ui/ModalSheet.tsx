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
          {/* Both the wrapping View's maxHeight AND the ScrollView's own maxHeight+flexShrink
              are set deliberately, not redundantly: RN's default flexShrink is 0, so a
              ScrollView with no bound of its own grows to full content height regardless of
              an ancestor's maxHeight, and silently fails to detect it has anything to scroll
              (see git history on this file for two prior single-constraint attempts that
              didn't reliably reproduce as fixed). Constraining both the ancestor AND the
              ScrollView itself removes any dependence on Yoga stretch/shrink propagation
              working a particular way across RN versions. */}
          <View className="bg-background rounded-sheet border border-border overflow-hidden" style={[{ maxHeight: maxCardHeight }, themeStyle]}>
            <ScrollView
              style={{ maxHeight: maxCardHeight, flexGrow: 0, flexShrink: 1 }}
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
