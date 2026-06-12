import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../../lib/supabase'
import { getUnreadCount } from '../../lib/messages'
import type { Message, Tenant } from '../../types'

type TenantRow = {
  tenant: Tenant
  lastMessage: Message | undefined
  unreadCount: number
}

export default function MessagesScreen() {
  const router = useRouter()
  const [rows, setRows] = useState<TenantRow[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [{ data: tenants }, { data: messages }] = await Promise.all([
      supabase.from('tenants').select('*').order('name'),
      supabase.from('messages').select('*').order('created_at', { ascending: false }),
    ])
    const msgs: Message[] = messages ?? []
    const result: TenantRow[] = (tenants ?? []).map((tenant: Tenant) => {
      const tenantMsgs = msgs.filter((m) => m.tenant_id === tenant.id)
      return {
        tenant,
        lastMessage: tenantMsgs[0],
        unreadCount: getUnreadCount(tenantMsgs),
      }
    })
    setRows(result)
  }

  function renderRow({ item }: { item: TenantRow }) {
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/messages/${item.tenant.id}`)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.tenant.name[0].toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.tenant.name}</Text>
          {item.lastMessage ? (
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastMessage.direction === 'outbound' ? 'You: ' : ''}
              {item.lastMessage.body}
            </Text>
          ) : null}
        </View>
        {item.unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    )
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.tenant.id}
      renderItem={renderRow}
      style={styles.list}
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#fff' },
  row: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#111' },
  preview: { fontSize: 14, color: '#666', marginTop: 2 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
})
