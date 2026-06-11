# ADR-0001: System Architecture

## Status
Accepted

## Context
Investo is a personal real estate investment tracker for a solo Bulgarian owner managing
5–20 properties in EUR. Needs web app, iOS/Android mobile app, document storage, and AI
document parsing. Solo user, personal (non-commercial) licence. Full spec in `docs/specs/PRD.md`.

## Decision

### Web
Next.js 16 App Router (TypeScript, Tailwind CSS v4). Server components by default;
`'use client'` only for interactive islands. API routes in `src/app/api/` for server-side
logic (AI calls, Supabase service-role operations).

### Database
Supabase Postgres (EU Frankfurt region). Row Level Security on every table with a single
policy: `auth.uid() = owner_id` (solo owner). Migrations managed with Supabase CLI in
`supabase/migrations/`.

### Auth
Supabase Auth, email + password. Single user. Session handled via `@supabase/ssr` cookies.
No OAuth needed for Phase 1.

### File Storage
Supabase Storage, bucket `documents`. Private bucket — all access via signed URLs.
Files keyed as `{entity_type}/{entity_id}/{uuid}.{ext}`.

### Mobile
Expo managed workflow (React Native). Shared Supabase client (`@supabase/supabase-js`).
Expo Push Notifications (managed service — handles FCM + APNs routing).
WhatsApp: deep-links only (`https://wa.me/{phone}`) — no Business API.

### AI Document Extraction
Async flow: owner uploads file → stored in Supabase Storage → API route triggers Claude API
(claude-sonnet-4-6, vision) → extracted fields returned as JSON → owner reviews pre-filled
form → confirms/edits → saved to DB. No blocking the upload on AI latency.

### Money
All monetary amounts stored as integers (EUR cents) in Postgres. Display layer divides by 100
and formats with `Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' })`.

### Polymorphic Document Attachments
Single `documents` table with `entity_type` (enum: property/tenancy/booking/transaction/loan)
and `entity_id` (uuid). No join tables per entity type.

---

## Interface Contract

### Core DB Schema (Postgres / Supabase)

```sql
-- All tables have: id uuid DEFAULT gen_random_uuid(), owner_id uuid REFERENCES auth.users, created_at timestamptz DEFAULT now()

properties (
  id, owner_id, created_at,
  address        text NOT NULL,
  type           text CHECK (type IN ('apartment','house','commercial','land')),
  status         text CHECK (status IN ('owned','for_sale','sold')),
  purchase_date  date,
  purchase_price integer,  -- EUR cents
  current_value  integer   -- EUR cents
)

tenants (
  id, owner_id, created_at,
  name           text NOT NULL,
  egn            text,           -- Bulgarian national ID
  phone          text,
  email          text,
  whatsapp       text,
  notes          text
)

tenancies (
  id, owner_id, created_at,
  property_id    uuid REFERENCES properties,
  tenant_id      uuid REFERENCES tenants,
  start_date     date NOT NULL,
  end_date       date,
  monthly_rent   integer NOT NULL,  -- EUR cents
  deposit        integer,           -- EUR cents
  payment_day    smallint DEFAULT 1,
  status         text CHECK (status IN ('active','expired','terminated'))
)

bookings (
  id, owner_id, created_at,
  property_id    uuid REFERENCES properties,
  guest_name     text NOT NULL,
  guest_phone    text,
  guest_email    text,
  check_in       date NOT NULL,
  check_out      date NOT NULL,
  nightly_rate   integer,   -- EUR cents
  total_amount   integer,   -- EUR cents
  cleaning_fee   integer,   -- EUR cents
  deposit        integer,   -- EUR cents
  source         text CHECK (source IN ('direct','airbnb','booking_com','other')),
  status         text CHECK (status IN ('confirmed','checked_in','checked_out','cancelled'))
)

transactions (
  id, owner_id, created_at,
  property_id    uuid REFERENCES properties,
  type           text CHECK (type IN ('income','expense')),
  category       text,  -- rent/deposit/mortgage/maintenance/renovation/tax/insurance/utility/agency/other
  amount         integer NOT NULL,  -- EUR cents
  date           date NOT NULL,
  description    text,
  tenancy_id     uuid REFERENCES tenancies,
  booking_id     uuid REFERENCES bookings
)

loans (
  id, owner_id, created_at,
  property_id    uuid REFERENCES properties,
  lender         text NOT NULL,
  principal      integer NOT NULL,   -- EUR cents
  interest_rate  numeric(5,2),       -- percent
  rate_type      text CHECK (rate_type IN ('fixed','variable')),
  term_months    integer,
  start_date     date,
  monthly_payment integer,           -- EUR cents
  outstanding    integer             -- EUR cents, updated manually or via transactions
)

documents (
  id, owner_id, created_at,
  entity_type    text CHECK (entity_type IN ('property','tenancy','booking','transaction','loan')),
  entity_id      uuid NOT NULL,
  doc_type       text,  -- purchase_deed/rental_contract/loan_agreement/invoice/insurance/utility_bill/permit/other
  filename       text NOT NULL,
  storage_path   text NOT NULL,
  extracted_data jsonb,   -- raw AI extraction result
  notes          text
)

messages (
  id, owner_id, created_at,
  tenant_id      uuid REFERENCES tenants,
  direction      text CHECK (direction IN ('outbound','inbound')),
  channel        text CHECK (channel IN ('inapp','email','whatsapp','phone')),
  body           text,
  read           boolean DEFAULT false
)
```

### API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/documents/extract` | Trigger AI extraction for uploaded document |
| GET | `/api/documents/[id]/signed-url` | Get signed download URL |
| POST | `/api/push/register` | Register Expo push token |
| POST | `/api/push/send` | Send push notification to owner |

### Component Props (key shared types)

```typescript
// src/types/index.ts

export type Property = {
  id: string; address: string; type: 'apartment'|'house'|'commercial'|'land';
  status: 'owned'|'for_sale'|'sold'; purchase_date: string|null;
  purchase_price: number|null; current_value: number|null;
}

export type Tenant = {
  id: string; name: string; egn: string|null; phone: string|null;
  email: string|null; whatsapp: string|null; notes: string|null;
}

export type Tenancy = {
  id: string; property_id: string; tenant_id: string;
  start_date: string; end_date: string|null; monthly_rent: number;
  deposit: number|null; payment_day: number; status: 'active'|'expired'|'terminated';
}

export type Transaction = {
  id: string; property_id: string; type: 'income'|'expense';
  category: string; amount: number; date: string; description: string|null;
}

export type Document = {
  id: string; entity_type: string; entity_id: string; doc_type: string;
  filename: string; storage_path: string; extracted_data: Record<string,unknown>|null;
}

// Money utility
export const formatEUR = (cents: number) =>
  new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(cents / 100)
```

---

## Consequences
- Supabase free tier: 500MB DB, 1GB Storage, 50MB file uploads — sufficient for ≤20 properties
- Async AI extraction adds ~5–10s latency after upload; owner sees spinner then pre-filled form
- WhatsApp deep-links open WhatsApp app on mobile — no in-app send; acceptable for personal use
- EUR cents avoids float arithmetic errors; BGN display not needed (owner works in EUR)
- Single `documents` table with entity_type is simpler than per-entity join tables; query by
  entity is indexed via `(entity_type, entity_id)`
