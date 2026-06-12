import '../global.css';
import { Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { LoginScreen } from '@/screens/LoginScreen';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function RootLayout() {
  const { session, loading, authUnavailable } = useAuth();

  usePushNotifications(session?.user?.id ?? null);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" testID="auth-loading" />
      </View>
    );
  }

  if (authUnavailable) {
    return (
      <View className="flex-1 items-center justify-center px-6" testID="auth-unavailable">
        <Text className="text-base text-red-600 text-center">
          Unable to reach authentication service. Check your connection and restart the app.
        </Text>
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
    </Tabs>
  );
}
