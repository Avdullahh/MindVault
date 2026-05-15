import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/auth-context';
import { supabase } from '../../lib/supabase';

export default function Settings() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  const email = session?.user.email ?? '';
  const metadata = session?.user.user_metadata ?? {};
  const avatarUrl = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null;
  const initials = email ? email.slice(0, 2).toUpperCase() : '??';
  const card = 'bg-leather-800 border-leather-600';
  const title = 'text-leather-50';
  const muted = 'text-leather-300';
  const input = 'bg-leather-800 text-leather-50 border-leather-600';

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
    <View className="flex-1 bg-leather-900">
      <View className="flex-row items-center px-5 pt-14 pb-4">
        <Pressable
          className="w-11 h-11 items-center justify-center rounded-full mr-3 bg-leather-800"
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color="#d4a017" />
        </Pressable>
        <Text className={`text-2xl font-bold ${title}`} style={{ fontFamily: 'Georgia' }}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
        <View className={`${card} rounded-2xl border p-5 mb-5`}>
          <View className="flex-row items-center gap-4">
            <View className="bg-leather-700 w-14 h-14 rounded-full border border-gold-700 items-center justify-center">
              <Text className="text-gold-400 text-lg font-bold" style={{ fontFamily: 'Georgia' }}>{initials}</Text>
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
              className="w-24 h-24 rounded-full bg-leather-700 border border-gold-700 items-center justify-center overflow-hidden"
              onPress={pickAvatar}
              accessibilityRole="button"
              accessibilityLabel="Select profile photo"
            >
              {avatar ? (
                <Image source={{ uri: avatar }} className="w-24 h-24" />
              ) : (
                <Text className="text-gold-400 text-2xl font-bold" style={{ fontFamily: 'Georgia' }}>{initials}</Text>
              )}
            </Pressable>
            <Text className="text-gold-400 text-sm mt-2">Change profile photo</Text>
          </View>

          <Text className={`${muted} text-xs font-semibold mb-2`}>Display name</Text>
          <TextInput
            className={`${input} rounded-xl border px-4 py-3 mb-4`}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor="#7a6050"
          />

          <Text className={`${muted} text-xs font-semibold mb-2`}>Email address</Text>
          <TextInput
            className={`${input} rounded-xl border px-4 py-3 mb-4`}
            value={nextEmail}
            onChangeText={setNextEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#7a6050"
          />

          <Text className={`${muted} text-xs font-semibold mb-2`}>New password</Text>
          <TextInput
            className={`${input} rounded-xl border px-4 py-3 mb-4`}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Leave blank to keep current password"
            placeholderTextColor="#7a6050"
          />

          {profileMessage ? (
            <Text className={`text-sm mb-4 ${profileMessage.includes('saved') || profileMessage.includes('Saved') ? 'text-gold-400' : 'text-red-400'}`}>
              {profileMessage}
            </Text>
          ) : null}

          <Pressable
            className="bg-gold-500 rounded-xl py-3 items-center"
            onPress={savePersonalInfo}
            disabled={savingProfile}
            accessibilityRole="button"
          >
            <Text className="text-leather-50 font-semibold">{savingProfile ? 'Saving...' : 'Save personal information'}</Text>
          </Pressable>
        </View>

        <Pressable
          className={`${card} rounded-xl py-4 px-5 items-center flex-row justify-between border`}
          onPress={signOut}
          accessibilityRole="button"
        >
          <Text className="text-red-400 font-medium">Sign out</Text>
          <Ionicons name="log-out-outline" size={20} color="#f87171" />
        </Pressable>
      </ScrollView>
    </View>
  );
}
