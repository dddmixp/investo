import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Linking, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

type Message = { id: string; body: string; direction: 'inbound' | 'outbound'; created_at: string };
type Tenant = { id: string; name: string; phone: string | null; email: string | null; whatsapp: string | null };

type Props = { tenantId: string; tenantName: string; session: Session; onBack: () => void };

function formatWhatsAppUrl(number: string): string {
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export function TenantThreadScreen({ tenantId, tenantName, session, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchData = useCallback(async () => {
    const [{ data: msgs }, { data: t }] = await Promise.all([
      supabase.from('messages').select('id, body, direction, created_at').eq('tenant_id', tenantId).order('created_at'),
      supabase.from('tenants').select('id, name, phone, email, whatsapp').eq('id', tenantId).single(),
    ]);
    setMessages((msgs ?? []) as Message[]);
    setTenant(t as Tenant | null);
    // Mark inbound as read
    await supabase.from('messages').update({ is_read: true }).eq('tenant_id', tenantId).eq('direction', 'inbound').eq('is_read', false);
  }, [tenantId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function sendMessage() {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setText('');
    const { error } = await supabase.from('messages').insert({
      owner_id: session.user.id,
      tenant_id: tenantId,
      direction: 'outbound',
      channel: 'inapp',
      body,
      is_read: true,
    });
    if (error) Alert.alert('Error', error.message);
    else await fetchData();
    setSending(false);
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={onBack} className="mr-3">
          <Text className="text-blue-600 text-base">{'<'} Back</Text>
        </TouchableOpacity>
        <Text className="font-bold text-gray-900 flex-1">{tenantName}</Text>
      </View>

      {/* Contact actions */}
      {tenant && (
        <View className="flex-row gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
          {tenant.phone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${tenant.phone}`)}
              className="flex-row items-center gap-1 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <Text className="text-green-700 text-xs font-medium">Call</Text>
            </TouchableOpacity>
          )}
          {tenant.email && (
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${tenant.email}`)}
              className="flex-row items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
              <Text className="text-blue-700 text-xs font-medium">Email</Text>
            </TouchableOpacity>
          )}
          {tenant.whatsapp && (
            <TouchableOpacity onPress={() => Linking.openURL(formatWhatsAppUrl(tenant.whatsapp!))}
              className="flex-row items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
              <Text className="text-emerald-700 text-xs font-medium">WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={m => m.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item: msg }) => (
          <View className={`flex-row my-1 px-4 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
            <View className={`max-w-xs rounded-2xl px-3 py-2 ${msg.direction === 'outbound' ? 'bg-blue-600' : 'bg-gray-100'}`}>
              <Text className={msg.direction === 'outbound' ? 'text-white text-sm' : 'text-gray-900 text-sm'}>{msg.body}</Text>
              <Text className={`text-xs mt-0.5 ${msg.direction === 'outbound' ? 'text-blue-200' : 'text-gray-400'}`}>
                {msg.created_at.split('T')[0]}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Compose */}
      <View className="flex-row items-end gap-2 px-4 py-3 border-t border-gray-200">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          multiline
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 text-sm max-h-24"
        />
        <TouchableOpacity onPress={sendMessage} disabled={sending || !text.trim()}
          className={`rounded-full w-10 h-10 items-center justify-center ${text.trim() ? 'bg-blue-600' : 'bg-gray-200'}`}>
          <Text className="text-white font-bold">{'>'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
