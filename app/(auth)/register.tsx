import { useEffect } from 'react';
import { router } from 'expo-router';

// There's no separate sign-up screen anymore — the welcome screen's
// Apple/Google/email buttons create an account the same way they sign one
// in. This route is kept only so old links/deep-links to /register don't 404.
export default function Register() {
  useEffect(() => {
    router.replace('/(auth)/welcome');
  }, []);

  return null;
}
