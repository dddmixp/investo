# Product Requirements Document — Investo

## Summary

Investo is a personal real estate investment tracking system for a solo owner managing a
portfolio of 5–20 properties in Bulgaria, denominated in EUR. It covers the full investment
lifecycle: acquisition, financing, renovation, renting (long-term and short-term), selling,
accounting, and document management. A companion mobile app (iOS + Android) enables
on-the-go tenant communication (in-app, email, WhatsApp), push notifications, and document
capture. An AI layer (Claude API) reads uploaded documents and auto-populates structured data.

**Target user:** Single owner (solo, personal use). Future: possibly add property manager
or accountant as a second user.

---

## Phase 1 — MVP (Web + Mobile foundation)

### 1. Dashboard
- Portfolio summary: total properties, total rental income (monthly/annual), occupancy rate,
  upcoming lease expirations, overdue payments, pending maintenance items
- Quick-action links to add property, record payment, upload document

### 2. Properties
- CRUD: address, type (apartment/house/commercial), purchase date, purchase price (EUR),
  current estimated value, status (owned / for sale / sold)
- Per-property tabs: Overview, Tenancies, Finance, Documents, Maintenance, Inventory
- Support for both long-term rental and short-term (Airbnb-style) booking modes per property

### 3. Tenants
- Profile: name, EGN (Bulgarian ID), phone, email, WhatsApp number, emergency contact
- Linked tenancies history
- Communication log (emails, WhatsApp, in-app messages sent)

### 4. Tenancies (Long-term)
- Contract: tenant, property, start date, end date, monthly rent (EUR), deposit amount,
  payment due day, rent review clause
- Status: active / expired / terminated
- Automatic overdue detection (payment not recorded by due date)
- Handover protocol: condition checklist + photos on move-in and move-out

### 5. Bookings (Short-term)
- Booking: guest name/contact, property, check-in, check-out, nightly rate, total amount,
  cleaning fee, deposit, source (direct / Airbnb / Booking.com)
- Status: confirmed / checked-in / checked-out / cancelled
- Occupancy calendar per property

### 6. Finance
- Transaction ledger: income (rent, deposit, booking) and expenses (mortgage, maintenance,
  renovation, tax, insurance, utilities, agency fees)
- Categorised by type and property
- Monthly and annual P&L per property and portfolio-wide
- Loan/mortgage tracker: lender, principal, interest rate (fixed/variable), term, monthly
  instalment, outstanding balance, next payment date
- Export to CSV/Excel

### 7. Documents
- Upload any file (PDF, image, Word) against a property, tenancy, or booking
- Document types: purchase deed, rental contract, loan agreement, invoice, insurance policy,
  utility bill, permit, other
- AI extraction (Claude API): reads uploaded document and pre-fills relevant structured fields
  (dates, amounts, parties, property address) for owner confirmation
- Document preview in browser

### 8. Mobile App (Expo / React Native — iOS + Android)
- Push notifications: overdue payment alerts, lease expiry warnings, maintenance updates,
  new messages
- Tenant communication:
  - In-app message thread per tenant
  - Tap-to-call / tap-to-email
  - WhatsApp deep-link (opens WhatsApp chat with tenant's number)
- Document capture: camera → upload to document vault with property/tenancy tag
- Read-only dashboard view (portfolio summary, upcoming events)

---

## Phase 2 — Core Operations

### 9. Maintenance
- Request: property, description, category (plumbing/electrical/appliance/other), reported by
  (owner/tenant), reported date, priority (low/medium/high/urgent)
- Status workflow: open → assigned → in-progress → resolved
- Link to vendor (from Contacts), attach invoices, record cost
- Notifications to owner on status changes

### 10. Furnishings Inventory
- Per-property item list: name, category, quantity, condition, purchase date, purchase cost
- Generate inventory report (PDF) for handover protocol

### 11. Calendar
- Unified calendar: lease start/end, booking check-in/check-out, payment due dates,
  maintenance appointments, contract review dates
- iCal export

### 12. Contacts (Vendors)
- Vendor/service provider profiles: name, type (plumber/electrician/cleaner/agent/lawyer),
  phone, email, notes, linked maintenance jobs

### 13. Tasks
- Simple to-do list linked to a property or free-form
- Due date, priority, done/not-done

### 14. Candidates (Tenant Applications)
- Prospect profile: name, contact, desired property, desired move-in date, income, notes
- Status: enquiry → viewing → application → approved / rejected
- Convert approved candidate to Tenant + Tenancy

---

## Phase 3 — Advanced Finance & Accounting

### 15. Invoicing
- Generate PDF rent invoices/receipts for tenants
- Invoice number sequence, issue date, due date, line items, EUR amounts
- Send via email directly from the app

### 16. Bank Import
- Import bank statement (CSV/OFX) and auto-match transactions to existing income/expense records
- Flag unmatched transactions for manual categorisation

### 17. Annual Report
- Yearly income and expense summary per property and total portfolio
- Suitable for Bulgarian tax return preparation
- Export to PDF

### 18. VAT / Tax Tracking
- Mark transactions as VAT-applicable (for commercial properties)
- Track deductible expenses

---

## Out of Scope (for now)
- Full double-entry bookkeeping / accounting software replacement
- Direct Airbnb/Booking.com API sync
- Automated WhatsApp sending (use deep-links only — WhatsApp Business API requires approval)
- Multi-user / team access (Phase 1 is solo only)
- Web scraping property valuations

---

## Non-Functional Requirements
- **Currency:** EUR throughout; store amounts as integers (cents) in DB
- **Language:** UI in English (owner preference); document content may be in Bulgarian
- **Data residency:** Supabase EU region (Frankfurt)
- **Auth:** Supabase Auth, email+password, single user
- **Mobile:** Expo managed workflow, targets iOS 16+ and Android 13+
- **Performance:** dashboard loads < 2s on 4G mobile
- **Backup:** Supabase daily backups + Storage for documents

---

## Open Questions (for Architect)
1. Schema design for polymorphic document attachments (property / tenancy / booking / transaction)
2. WhatsApp deep-link vs WhatsApp Business API — confirm deep-link approach for MVP
3. Expo push notification service (Expo Push vs FCM/APNs direct)
4. AI extraction flow: sync (block upload) or async (upload then poll)?
5. Short-term booking calendar — build custom or embed a library (react-big-calendar)?
6. EUR cent storage confirmed — any need for BGN (Bulgarian lev) display?
