import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput } from 'react-native';
import { ModalSheet } from './ModalSheet';
import { useThemeColors } from '../../context/ThemeContext';

type EntityFormModalProps = {
  visible: boolean;
  onClose: () => void;
  eyebrow: string;
  titleValue: string;
  onTitleChange: (value: string) => void;
  titlePlaceholder: string;
  titleBottomClassName?: string;
  bodyValue?: string;
  onBodyChange?: (value: string) => void;
  bodyPlaceholder?: string;
  bodyMinHeight?: number;
  bodyMaxLength?: number;
  children?: ReactNode;
  error?: string | null;
  loading?: boolean;
  submitLabel: string;
  onSubmit: () => void;
  canSubmit: boolean;
};

export function EntityFormModal({
  visible,
  onClose,
  eyebrow,
  titleValue,
  onTitleChange,
  titlePlaceholder,
  titleBottomClassName = 'mb-3',
  bodyValue,
  onBodyChange,
  bodyPlaceholder,
  bodyMinHeight = 64,
  bodyMaxLength,
  children,
  error,
  loading = false,
  submitLabel,
  onSubmit,
  canSubmit,
}: EntityFormModalProps) {
  const colors = useThemeColors();
  const disabled = loading || !canSubmit;

  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <Text className="text-muted text-xs uppercase mb-4" style={{ letterSpacing: 2 }}>
        {eyebrow}
      </Text>

      <TextInput
        className={`bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-2xl font-rounded ${titleBottomClassName}`}
        style={{ minHeight: 52 }}
        placeholder={titlePlaceholder}
        placeholderTextColor={colors.muted}
        value={titleValue}
        onChangeText={onTitleChange}
        multiline
        maxLength={200}
        autoFocus
      />

      {bodyValue !== undefined && onBodyChange && bodyPlaceholder ? (
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-muted text-base mb-6"
          style={{ minHeight: bodyMinHeight, textAlignVertical: 'top' }}
          placeholder={bodyPlaceholder}
          placeholderTextColor={colors.muted}
          value={bodyValue}
          onChangeText={onBodyChange}
          multiline
          maxLength={bodyMaxLength}
        />
      ) : null}

      {children}

      {error ? <Text selectable className="text-destructive text-xs mb-3">{error}</Text> : null}

      <Pressable
        className={`rounded-xl py-4 items-center ${disabled ? 'bg-surface-2 border border-border' : 'bg-primary border border-primary'}`}
        onPress={onSubmit}
        disabled={disabled}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text className="text-foreground font-bold text-base">{submitLabel}</Text>
        )}
      </Pressable>
    </ModalSheet>
  );
}
