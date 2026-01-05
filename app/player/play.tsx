import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Play functionality is now integrated into the Home screen
// This file just redirects for backwards compatibility
export default function PlayScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home where play functionality now lives
    router.replace('/player');
  }, []);

  return null;
}
