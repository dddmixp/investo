export type Property = {
  id: string
  address: string
  type: 'apartment' | 'house' | 'commercial' | 'land'
  status: 'owned' | 'for_sale' | 'sold'
  purchase_date: string | null
  purchase_price: number | null
  current_value: number | null
}

export type Tenant = {
  id: string
  name: string
  egn: string | null
  phone: string | null
  email: string | null
  whatsapp: string | null
  notes: string | null
}

export type Tenancy = {
  id: string
  property_id: string
  tenant_id: string
  start_date: string
  end_date: string | null
  monthly_rent: number
  deposit: number | null
  payment_day: number
  status: 'active' | 'expired' | 'terminated'
}

export type Transaction = {
  id: string
  property_id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  date: string
  description: string | null
}

export type Document = {
  id: string
  entity_type: string
  entity_id: string
  doc_type: string
  filename: string
  storage_path: string
  extracted_data: Record<string, unknown> | null
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

export const formatEUR = (cents: number) =>
  new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(cents / 100)
