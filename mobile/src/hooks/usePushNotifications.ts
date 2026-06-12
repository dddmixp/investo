import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export function usePushNotifications(userId: string | null) {
  useEffect(() => {
    if (!userId) return;
    registerForPushNotifications(userId);
  }, [userId]);
}

async function registerForPushNotifications(userId: string) {
  if (!Device.isDevice) return; // simulator — skip

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  await supabase.from('push_tokens').upsert(
    { owner_id: userId, token, platform },
    { onConflict: 'owner_id,token' },
  );
}
