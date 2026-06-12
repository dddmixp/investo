import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function DashboardScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Dashboard</Text>
        <Text className="text-sm text-gray-500">Portfolio overview coming soon.</Text>
      </View>
    </ScrollView>
  );
}
