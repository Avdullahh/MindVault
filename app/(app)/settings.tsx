import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/auth-context';
import { useTheme, useThemeColors, type ThemeMode } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function Settings() {
  const { session, signOut } = useAuth();
  const { mode, setMode } = useTheme();
  const colors = useThemeColors();
  const router = useRouter();

  const email = session?.user.email ?? '';
  const metadata = session?.user.user_metadata ?? {};
  const avatarUrl = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null;
  const initials = email ? email.slice(0, 2).toUpperCase() : '??';
  const card = 'bg-surface border-border';
  const title = 'text-foreground';
  const muted = 'text-muted';
  const input = 'bg-surface text-foreground border-border';

  const [displayName, setDisplayName] = useState('');
  const [nextEmail, setNextEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(typeof metadata.display_name === 'string' ? metadata.display_name : '');
    setNextEmail(email);
    setAvatar(avatarUrl);
  }, [email, avatarUrl, metadata.display_name]);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatar(result.assets[0]?.uri ?? null);
  };

  const savePersonalInfo = async () => {
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const metadataUpdate = {
        display_name: displayName.trim() || null,
        avatar_url: avatar,
      };
      const emailChanged = nextEmail.trim() && nextEmail.trim() !== email;
      const { error } = await supabase.auth.updateUser({
        data: metadataUpdate,
        ...(emailChanged ? { email: nextEmail.trim() } : {}),
        ...(password ? { password } : {}),
      });
      if (error) {
        setProfileMessage(error.message);
        return;
      }
      setPassword('');
      setProfileMessage(emailChanged ? 'Saved. Check your new email address to verify the change.' : 'Personal information saved.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-5 pt-14 pb-4">
        <Pressable
          className="w-11 h-11 items-center justify-center rounded-full mr-3 bg-surface"
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className={`text-2xl font-bold ${title}`} style={{ fontFamily: 'Georgia' }}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
        <View className={`${card} rounded-2xl border p-5 mb-5`}>
          <View className="flex-row items-center gap-4">
            <View className="bg-surface-2 w-14 h-14 rounded-full border border-primary items-center justify-center">
              <Text className="text-primary text-lg font-bold" style={{ fontFamily: 'Georgia' }}>{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className={`${muted} text-xs uppercase tracking-widest mb-0.5`} style={{ letterSpacing: 1.5 }}>Signed in as</Text>
              <Text className={`${title} font-medium`} numberOfLines={1}>{email}</Text>
            </View>
          </View>
        </View>

        <Text className={`${muted} text-xs font-semibold uppercase mb-3`} style={{ letterSpacing: 1.5 }}>Personal Information</Text>
        <View className={`${card} rounded-2xl border p-5 mb-6`}>
          <View className="items-center mb-5">
            <Pressable
              className="w-24 h-24 rounded-full bg-surface-2 border border-primary items-center justify-center overflow-hidden"
              onPress={pickAvatar}
              accessibilityRole="button"
              accessibilityLabel="Select profile photo"
            >
              {avatar ? (
                <Image source={{ uri: avatar }} className="w-24 h-24" />
              ) : (
                <Text className="text-primary text-2xl font-bold" style={{ fontFamily: 'Georgia' }}>{initials}</Text>
              )}
            </Pressable>
            <Text className="text-primary text-sm mt-2">Change profile photo</Text>
          </View>

          <Text className={`${muted} text-xs font-semibold mb-2`}>Display name</Text>
          <TextInput
            className={`${input} rounded-xl border px-4 py-3 mb-4`}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
          />

          <Text className={`${muted} text-xs font-semibold mb-2`}>Email address</Text>
          <TextInput
            className={`${input} rounded-xl border px-4 py-3 mb-4`}
            value={nextEmail}
            onChangeText={setNextEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
          />

          <Text className={`${muted} text-xs font-semibold mb-2`}>New password</Text>
          <TextInput
            className={`${input} rounded-xl border px-4 py-3 mb-4`}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Leave blank to keep current password"
            placeholderTextColor={colors.muted}
          />

          {profileMessage ? (
            <Text className={`text-sm mb-4 ${profileMessage.includes('saved') || profileMessage.includes('Saved') ? 'text-primary' : 'text-destructive'}`}>
              {profileMessage}
            </Text>
          ) : null}

          <Pressable
            className="bg-primary rounded-xl py-3 items-center"
            onPress={savePersonalInfo}
            disabled={savingProfile}
            accessibilityRole="button"
          >
            <Text className="text-foreground font-semibold">{savingProfile ? 'Saving...' : 'Save personal information'}</Text>
          </Pressable>
        </View>

        <Text className={`${muted} text-xs font-semibold uppercase mb-3`} style={{ letterSpacing: 1.5 }}>Appearance</Text>
        <View className={`${card} rounded-2xl border p-2 mb-6`}>
          {THEME_OPTIONS.map((option, index) => {
            const active = mode === option.mode;
            return (
              <Pressable
                key={option.mode}
                className={`flex-row items-center px-3 py-3 rounded-xl ${active ? 'bg-primary' : ''} ${index > 0 ? 'mt-1' : ''}`}
                onPress={() => setMode(option.mode)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${option.label} theme`}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={active ? colors.primaryForeground : colors.muted}
                />
                <Text className={`flex-1 ml-3 font-medium ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {option.label}
                </Text>
                {active ? (
                  <Ionicons name="checkmark" size={20} color={colors.primaryForeground} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          className={`${card} rounded-xl py-4 px-5 items-center flex-row justify-between border`}
          onPress={signOut}
          accessibilityRole="button"
        >
          <Text className="text-destructive font-medium">Sign out</Text>
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
        </Pressable>
      </ScrollView>
    </View>
  );
}
