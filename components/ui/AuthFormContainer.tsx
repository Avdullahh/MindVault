import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { ReactNode } from 'react';

export function AuthFormContainer({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-leather-900"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
