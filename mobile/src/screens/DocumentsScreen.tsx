import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export function DocumentsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-900 mb-4">Documents</Text>
        <Text className="text-sm text-gray-500">Documents list coming soon.</Text>
      </View>
    </ScrollView>
  );
}
