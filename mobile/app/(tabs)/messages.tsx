import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { countUnreadForTenant } from '../../lib/unread'
import type { Message, Tenant, TenantWithLastMessage } from '../../types'

export default function MessagesScreen() {
  const [tenants, setTenants] = useState<TenantWithLastMessage[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [tenantsResult, messagesResult] = await Promise.all([
      supabase.from('tenants').select('id, name, phone, email, whatsapp, notes'),
      supabase.from('messages').select('*').order('created_at', { ascending: false }),
    ])

    if (!tenantsResult.data || !messagesResult.data) return

    const messages = messagesResult.data as Message[]
    const list = (tenantsResult.data as Tenant[]).map((tenant) => {
      const tenantMessages = messages.filter((m) => m.tenant_id === tenant.id)
      return {
        ...tenant,
        last_message: tenantMessages[0] ?? null,
        unread_count: countUnreadForTenant(messages, tenant.id),
      }
    })

    setTenants(list)
    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData])
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <FlatList
      data={tenants}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push(`/thread/${item.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Open thread with ${item.name}`}
        >
          <View style={styles.rowContent}>
            <Text style={styles.name}>{item.name}</Text>
            {item.last_message && (
              <Text style={styles.preview} numberOfLines={1}>
                {item.last_message.body}
              </Text>
            )}
          </View>
          {item.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread_count}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  rowContent: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  preview: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  badge: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
})
