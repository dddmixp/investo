import { Tabs } from 'expo-router'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { countTotalUnread } from '../../lib/unread'
import type { Message } from '../../types'

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0)

  const loadUnread = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('id, tenant_id, direction, read, owner_id, channel, body, created_at')
      .eq('direction', 'inbound')
      .eq('read', false)
    if (data) {
      setUnreadCount(countTotalUnread(data as Message[]))
    }
  }, [])

  useEffect(() => {
    loadUnread()

    const channel = supabase
      .channel('tab-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadUnread)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadUnread])

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
    </Tabs>
  )
}
