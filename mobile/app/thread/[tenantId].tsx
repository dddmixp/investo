import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import ContactActionBar from '../../components/ContactActionBar'
import MessageBubble from '../../components/MessageBubble'
import type { Message, Tenant } from '../../types'

export default function ThreadScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const listRef = useRef<FlatList<Message>>(null)

  const markInboundRead = useCallback(async () => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('tenant_id', tenantId)
      .eq('direction', 'inbound')
      .eq('read', false)
  }, [tenantId])

  const loadData = useCallback(async () => {
    const [tenantResult, messagesResult] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', tenantId).single(),
      supabase
        .from('messages')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true }),
    ])
    if (tenantResult.data) setTenant(tenantResult.data as Tenant)
    if (messagesResult.data) setMessages(messagesResult.data as Message[])
    setLoading(false)
    await markInboundRead()
  }, [tenantId, markInboundRead])

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel(`thread-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
          markInboundRead()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadData, tenantId, markInboundRead])

  const handleSend = async () => {
    const trimmed = body.trim()
    if (!trimmed || sending) return

    setSending(true)
    const { error } = await supabase.from('messages').insert({
      tenant_id: tenantId,
      direction: 'outbound',
      channel: 'inapp',
      body: trimmed,
      read: true,
    })
    if (!error) {
      setBody('')
    }
    setSending(false)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: tenant?.name ?? 'Thread' }} />
      {tenant && <ContactActionBar tenant={tenant} />}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />
      <View style={styles.compose}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Type a message…"
          multiline
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!body.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!body.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  compose: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#93c5fd' },
  sendText: { color: '#fff', fontWeight: '600' },
})
