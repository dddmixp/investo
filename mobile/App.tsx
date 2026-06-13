import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from './src/hooks/useAuth';
import LoginScreen from './src/screens/LoginScreen';
import { TabNavigator } from './src/navigation/TabNavigator';
import './global.css';

export default function App() {
  const { session, loading, authUnavailable } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (authUnavailable) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
          Service Unavailable
        </Text>
        <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
          Unable to connect to authentication service. Please check your connection and try again.
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!session ? <LoginScreen /> : <TabNavigator />}
    </NavigationContainer>
  );
}
