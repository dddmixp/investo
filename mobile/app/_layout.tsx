import { Tabs } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
    </Tabs>
  );
}
