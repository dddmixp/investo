import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '../lib/supabase';

type TenantWithUnread = {
  id: string; name: string; lastMessage?: string; lastDate?: string; unreadCount: number;
};

type Props = { onSelectTenant: (tenantId: string, tenantName: string) => void };

export function TenantList({ onSelectTenant }: Props) {
  const [tenants, setTenants] = useState<TenantWithUnread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTenants = useCallback(async () => {
    const { data: tenantData } = await supabase.from('tenants').select('id, name').order('name');
    if (!tenantData) { setTenants([]); return; }

    const withStats = await Promise.all(tenantData.map(async (t) => {
      const [{ data: lastMsg }, { count: unread }] = await Promise.all([
        supabase.from('messages').select('body, created_at').eq('tenant_id', t.id).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id).eq('is_read', false).eq('direction', 'inbound'),
      ]);
      return {
        id: t.id, name: t.name,
        lastMessage: (lastMsg as { body?: string } | null)?.body ?? undefined,
        lastDate: (lastMsg as { created_at?: string } | null)?.created_at?.split('T')[0] ?? undefined,
        unreadCount: unread ?? 0,
      };
    }));
    setTenants(withStats);
  }, []);

  useEffect(() => {
    fetchTenants().finally(() => setLoading(false));
  }, [fetchTenants]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTenants();
    setRefreshing(false);
  }, [fetchTenants]);

  if (loading) return <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>;

  return (
    <FlatList
      data={tenants}
      keyExtractor={t => t.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<View className="p-4"><Text className="text-sm text-gray-500">No tenants yet.</Text></View>}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onSelectTenant(item.id, item.name)}
          className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
          <View className="flex-1">
            <Text className="font-medium text-gray-900">{item.name}</Text>
            {item.lastMessage && <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>{item.lastMessage}</Text>}
          </View>
          <View className="items-end gap-1">
            {item.lastDate && <Text className="text-xs text-gray-400">{item.lastDate}</Text>}
            {item.unreadCount > 0 && (
              <View className="bg-blue-600 rounded-full min-w-5 h-5 items-center justify-center px-1">
                <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}
    />
  );
}
