import React from 'react';
import { View, Text } from 'react-native';

type Props = {
  label: string;
  value: string | number;
  testID?: string;
};

export function StatsCard({ label, value, testID }: Props) {
  return (
    <View className="flex-1 bg-white rounded-xl p-4 m-1 items-center shadow-sm" testID={testID}>
      <Text
        className="text-2xl font-bold text-gray-900 mb-1"
        testID={testID ? `${testID}-value` : undefined}
      >
        {String(value)}
      </Text>
      <Text className="text-xs text-gray-500 text-center">{label}</Text>
    </View>
  );
}
