export type Tenant = {
  id: string
  name: string
  phone: string | null
  email: string | null
  whatsapp: string | null
  notes: string | null
}

export type Message = {
  id: string
  owner_id: string
  tenant_id: string
  direction: 'outbound' | 'inbound'
  channel: 'inapp' | 'email' | 'whatsapp' | 'phone'
  body: string
  read: boolean
  created_at: string
}

export type TenantWithLastMessage = Tenant & {
  last_message: Message | null
  unread_count: number
}
