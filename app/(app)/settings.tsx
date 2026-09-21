import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/auth-context';
import { useTheme, useThemeColors, type ThemeMode } from '../../context/ThemeContext';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { useIdeas } from '../../hooks/use-ideas';
import { useProjects } from '../../hooks/use-projects';
import { useGoals } from '../../hooks/use-goals';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
];

// A hook's `[]` is indistinguishable from a real empty result while it's still
// loading or after it errored -- rendering that as "0" reads as data loss on
// the account screen. Show a spinner or an explicit "unavailable" mark instead.
function StatValue({
  loading, error, value, textClass, colors,
}: {
  loading: boolean;
  error: string | null;
  value: number;
  textClass: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  if (loading) {
    return <ActivityIndicator size="small" color={colors.muted} />;
  }
  if (error) {
    return (
      <Text
        className="text-destructive text-lg font-bold font-rounded"
        accessibilityLabel="Failed to load"
      >
        —
      </Text>
    );
  }
  return <Text className={`${textClass} text-lg font-bold font-rounded`}>{value}</Text>;
}

export default function Settings() {
  const { session, signOut, updateAccount, deleteAccount } = useAuth();
  const { mode, setMode } = useTheme();
  const colors = useThemeColors();
  const router = useRouter();
  const { ideas, loading: ideasLoading, error: ideasError } = useIdeas();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { goals, loading: goalsLoading, error: goalsError } = useGoals();

  const email = session?.user.email ?? '';
  const metadata = session?.user.user_metadata ?? {};
  const avatarUrl = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null;
  const initials = email ? email.slice(0, 2).toUpperCase() : '??';
  const card = 'bg-surface border-border';
  const title = 'text-foreground';
  const muted = 'text-muted';
  const input = 'bg-surface text-foreground border-border';
  const displayNameFromMetadata = typeof metadata.display_name === 'string' ? metadata.display_name : '';
  const profileName = displayNameFromMetadata || email;
  const memberSince = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const [displayName, setDisplayName] = useState('');
  const [nextEmail, setNextEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileMessageType, setProfileMessageType] = useState<'success' | 'error'>('success');

  const normalizedDisplayName = displayName.trim();
  const normalizedEmail = nextEmail.trim();
  const accountChanged =
    normalizedDisplayName !== (typeof metadata.display_name === 'string' ? metadata.display_name : '') ||
    normalizedEmail !== email ||
    Boolean(password) ||
    avatar !== avatarUrl;
  const canSaveProfile = accountChanged && !savingProfile;

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
    if (!accountChanged) return;
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setProfileMessageType('error');
      setProfileMessage('Enter a valid email address.');
      return;
    }
    if (password && password.length < 8) {
      setProfileMessageType('error');
      setProfileMessage('Use at least 8 characters for your new password.');
      return;
    }

    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const emailChanged = normalizedEmail && normalizedEmail !== email;
      const result = await updateAccount({
        displayName: normalizedDisplayName || null,
        avatarUrl: avatar,
        ...(emailChanged ? { email: normalizedEmail } : {}),
        ...(password ? { password } : {}),
      });
      if (result.error) {
        setProfileMessageType('error');
        setProfileMessage(result.error);
        return;
      }
      setPassword('');
      setProfileMessageType('success');
      setProfileMessage(
        result.emailChangePending
          ? 'Saved. Check your new email address to verify the change.'
          : 'Personal information saved.',
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    const error = await deleteAccount();
    if (error) {
      setDeleting(false);
      setDeleteError(error);
      return;
    }
    setDeleteModalVisible(false);
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
        <Text className={`text-2xl font-bold font-rounded ${title}`}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
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
                <Text className="text-primary text-2xl font-bold font-rounded">{initials}</Text>
              )}
            </Pressable>
            <Text className={`${title} text-lg font-bold font-rounded mt-3`} numberOfLines={1}>{profileName}</Text>
            {displayNameFromMetadata ? (
              <Text className={`${muted} text-sm mt-0.5`} numberOfLines={1}>{email}</Text>
            ) : null}
            {memberSince ? (
              <Text className={`${muted} text-xs mt-0.5`}>Member since {memberSince}</Text>
            ) : null}
          </View>

          <View className="flex-row mb-5">
            <View className="flex-1 items-center">
              <StatValue loading={ideasLoading} error={ideasError} value={ideas.length} textClass={title} colors={colors} />
              <Text className={`${muted} text-xs mt-0.5`}>Ideas</Text>
            </View>
            <View className="flex-1 items-center border-x border-border">
              <StatValue loading={projectsLoading} error={projectsError} value={projects.length} textClass={title} colors={colors} />
              <Text className={`${muted} text-xs mt-0.5`}>Projects</Text>
            </View>
            <View className="flex-1 items-center">
              <StatValue loading={goalsLoading} error={goalsError} value={goals.length} textClass={title} colors={colors} />
              <Text className={`${muted} text-xs mt-0.5`}>Goals</Text>
            </View>
          </View>

          <Text className={`${muted} text-xs font-semibold mb-2`}>Display name</Text>
          <TextInput
            className={`${input} rounded-xl border px-4 py-3 mb-4`}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            autoComplete="name"
            textContentType="name"
          />

          <Text className={`${muted} text-xs font-semibold mb-2`}>Email address</Text>
          <TextInput
            className={`${input} rounded-xl border px-4 py-3 mb-4`}
            value={nextEmail}
            onChangeText={setNextEmail}
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
          />

          <Text className={`${muted} text-xs font-semibold mb-2`}>New password</Text>
          <TextInput
            className={`${input} rounded-xl border px-4 py-3 mb-4`}
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
            placeholder="Leave blank to keep current password"
            placeholderTextColor={colors.muted}
          />

          {profileMessage ? (
            <Text
              selectable
              className={`text-sm mb-4 ${profileMessageType === 'success' ? 'text-primary' : 'text-destructive'}`}
            >
              {profileMessage}
            </Text>
          ) : null}

          <Pressable
            className={`rounded-xl py-3 items-center ${canSaveProfile ? 'bg-primary' : 'bg-surface-2 border border-border'}`}
            onPress={savePersonalInfo}
            disabled={!canSaveProfile}
            accessibilityRole="button"
          >
            {savingProfile ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text className={`font-semibold ${canSaveProfile ? 'text-primary-foreground' : 'text-muted'}`}>
                Save personal information
              </Text>
            )}
          </Pressable>
        </View>

        <Text className={`${muted} text-xs font-semibold uppercase mb-3`} style={{ letterSpacing: 1.5 }}>Appearance</Text>
        <View className={`${card} rounded-2xl border p-1 mb-3 flex-row`}>
          {THEME_OPTIONS.map((option) => {
            const active = mode === option.mode;
            return (
              <Pressable
                key={option.mode}
                className={`flex-1 items-center justify-center py-3 rounded-control ${active ? 'bg-primary' : ''}`}
                onPress={() => setMode(option.mode)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${option.label} theme`}
              >
                <Text className={`font-medium ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className={`${muted} text-xs leading-4 mb-6`}>
          System follows your device. Depth in dark mode comes from lighter surfaces and hairlines, not shadows.
        </Text>

        <Pressable
          className="bg-destructive/20 rounded-xl py-4 px-5 items-center flex-row justify-between border border-destructive/30"
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityRole="button"
        >
          <Text className="text-destructive font-medium">{signingOut ? 'Signing out...' : 'Sign out'}</Text>
          {signingOut ? (
            <ActivityIndicator color={colors.destructive} />
          ) : (
            <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          )}
        </Pressable>

        <Pressable
          className="mt-3 py-4 px-5 items-center flex-row justify-center"
          onPress={() => { setDeleteError(null); setDeleteModalVisible(true); }}
          accessibilityRole="button"
        >
          <Text className="text-destructive/70 font-medium text-sm">Delete account</Text>
        </Pressable>
      </ScrollView>

      <ModalSheet
        visible={deleteModalVisible}
        onClose={() => { if (!deleting) setDeleteModalVisible(false); }}
        title="Delete account?"
      >
        <Text className={`${muted} mb-5`}>
          This permanently deletes your ideas, goals, projects, and tasks. This can't be undone.
        </Text>

        {deleteError ? (
          <Text selectable className="text-sm mb-4 text-destructive">{deleteError}</Text>
        ) : null}

        <View className="flex-row gap-3">
          <Pressable
            className={`${card} flex-1 rounded-xl py-3 items-center border`}
            onPress={() => setDeleteModalVisible(false)}
            disabled={deleting}
            accessibilityRole="button"
          >
            <Text className="text-foreground font-semibold">Cancel</Text>
          </Pressable>
          <Pressable
            className="flex-1 rounded-xl py-3 items-center bg-destructive"
            onPress={handleDeleteAccount}
            disabled={deleting}
            accessibilityRole="button"
          >
            {deleting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text className="text-primary-foreground font-semibold">Delete</Text>
            )}
          </Pressable>
        </View>
      </ModalSheet>
    </View>
  );
}
