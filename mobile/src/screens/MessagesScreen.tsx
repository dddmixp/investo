import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { TenantList } from './TenantListScreen';
import { TenantThreadScreen } from './TenantThreadScreen';
import type { Session } from '@supabase/supabase-js';

type Props = { session: Session };

export default function MessagesScreen({ session }: Props) {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  if (selected) {
    return (
      <TenantThreadScreen
        tenantId={selected.id}
        tenantName={selected.name}
        session={session}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-gray-900">Messages</Text>
      </View>
      <TenantList onSelectTenant={(id, name) => setSelected({ id, name })} />
    </View>
  );
}
