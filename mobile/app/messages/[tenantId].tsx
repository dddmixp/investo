import { useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { ContactActionBar } from '../../components/ContactActionBar'
import { MessageBubble } from '../../components/MessageBubble'
import { supabase } from '../../lib/supabase'
import type { Message, Tenant } from '../../types'

export default function ThreadScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const listRef = useRef<FlatList<Message>>(null)

  useEffect(() => {
    fetchTenant()
    fetchMessages()
    markInboundRead()
  }, [tenantId])

  async function fetchTenant() {
    const { data } = await supabase.from('tenants').select('*').eq('id', tenantId).single()
    setTenant(data)
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
  }

  async function markInboundRead() {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('tenant_id', tenantId)
      .eq('direction', 'inbound')
      .eq('read', false)
  }

  async function sendMessage() {
    const trimmed = body.trim()
    if (!trimmed) return
    await supabase.from('messages').insert({
      tenant_id: tenantId,
      direction: 'outbound',
      channel: 'inapp',
      body: trimmed,
      read: true,
    })
    setBody('')
    fetchMessages()
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {tenant ? <ContactActionBar tenant={tenant} /> : null}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        contentContainerStyle={styles.listContent}
      />
      <View style={styles.compose}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendLabel}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContent: { paddingHorizontal: 12, paddingVertical: 8 },
  compose: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendLabel: { color: '#fff', fontWeight: '600', fontSize: 15 },
})
