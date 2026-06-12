import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-xl font-bold text-gray-900 mb-6">Profile</Text>
      <TouchableOpacity
        onPress={handleLogout}
        className="bg-red-50 border border-red-200 rounded-xl p-4"
        testID="logout-button"
      >
        <Text className="text-red-700 font-medium text-center">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
