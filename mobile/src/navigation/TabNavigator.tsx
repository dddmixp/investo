import React, { useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import DashboardScreen from '../screens/DashboardScreen';
import PropertiesScreen from '../screens/PropertiesScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, string> = {
  Dashboard: '🏠',
  Properties: '🏢',
  Documents: '📄',
  Messages: '💬',
  Profile: '👤',
};

type Props = { session: Session };

export function TabNavigator({ session }: Props) {
  // Stable render functions so the session-dependent tabs are not remounted on
  // every TabNavigator re-render (a new inline arrow each render forces a remount).
  const renderDocuments = useCallback(
    () => <DocumentsScreen session={session} />,
    [session]
  );
  const renderMessages = useCallback(
    () => <MessagesScreen session={session} />,
    [session]
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => (
          <Text
            style={{ fontSize: 20 }}
            accessibilityLabel={`${route.name} tab`}
          >
            {ICONS[route.name] ?? '•'}
          </Text>
        ),
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Properties" component={PropertiesScreen} />
      <Tab.Screen name="Documents">{renderDocuments}</Tab.Screen>
      <Tab.Screen name="Messages">{renderMessages}</Tab.Screen>
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
