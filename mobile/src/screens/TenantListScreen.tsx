import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '../lib/supabase';
import { buildTenantsWithStats, type MessageRow, type TenantWithUnread } from '../lib/messaging';

type Props = { onSelectTenant: (tenantId: string, tenantName: string) => void };

export function TenantList({ onSelectTenant }: Props) {
  const [tenants, setTenants] = useState<TenantWithUnread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setError(null);
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants').select('id, name').order('name');
    if (tenantError) { setError(tenantError.message); return; }
    if (!tenantData || tenantData.length === 0) { setTenants([]); return; }

    // Single batched query for all messages of these tenants, ordered ascending
    // so per-tenant last-message + unread are derived in memory (no N+1).
    const ids = tenantData.map((t) => t.id);
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .select('tenant_id, body, direction, read, created_at')
      .in('tenant_id', ids)
      .order('created_at', { ascending: true });
    if (msgError) { setError(msgError.message); return; }

    setTenants(buildTenantsWithStats(tenantData, (msgData ?? []) as MessageRow[]));
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
    <>
    {error && (
      <View className="bg-red-50 border-b border-red-200 px-4 py-2">
        <Text className="text-red-700 text-sm">{error}</Text>
      </View>
    )}
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
    </>
  );
}
