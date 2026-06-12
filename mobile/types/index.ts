export type Tenant = {
  id: string
  name: string
  egn: string | null
  phone: string | null
  email: string | null
  whatsapp: string | null
  notes: string | null
}

export type Message = {
  id: string
  owner_id: string
  created_at: string
  tenant_id: string
  direction: 'outbound' | 'inbound'
  channel: 'inapp' | 'email' | 'whatsapp' | 'phone'
  body: string
  read: boolean
}
