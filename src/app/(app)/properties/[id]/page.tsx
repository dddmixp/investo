import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { formatEUR } from '@/lib/format';
import { calcAppreciation } from '@/lib/properties';
import type { Property, Tenancy, Transaction, Loan, Document, Booking } from '@/types';

type Tab = 'overview' | 'tenancies' | 'finance' | 'bookings' | 'documents' | 'loans';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tenancies', label: 'Tenancies' },
  { id: 'finance', label: 'Finance' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'documents', label: 'Documents' },
  { id: 'loans', label: 'Loans' },
];

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;
  const activeTab = (TABS.some((t) => t.id === tab) ? tab : 'overview') as Tab;

  const supabase = await createServerClient();
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();
  if (!property) notFound();

  const [
    { data: tenancies },
    { data: transactions },
    { data: loans },
    { data: documents },
    { data: bookings },
  ] = await Promise.all([
    supabase
      .from('tenancies')
      .select('*, tenants(name, phone, email)')
      .eq('property_id', id),
    supabase
      .from('transactions')
      .select('*')
      .eq('property_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('loans').select('*').eq('property_id', id),
    supabase
      .from('documents')
      .select('*')
      .eq('entity_type', 'property')
      .eq('entity_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('bookings')
      .select('*')
      .eq('property_id', id)
      .order('check_in', { ascending: false }),
  ]);

  const prop = property as Property;
  const tenancyRows = (tenancies ?? []) as (Tenancy & {
    tenants: { name: string; phone: string | null; email: string | null } | null;
  })[];
  const transactionRows = (transactions ?? []) as Transaction[];
  const loanRows = (loans ?? []) as Loan[];
  const documentRows = (documents ?? []) as Document[];
  const bookingRows = (bookings ?? []) as Booking[];

  const activeTenancy = tenancyRows.find((t) => t.is_active);
  const totalIncome = transactionRows
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactionRows
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const appreciation = calcAppreciation(
    prop.purchase_price,
    prop.current_value,
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/properties" className="hover:text-gray-900">
            Properties
          </Link>
          <span>/</span>
          <span className="text-gray-900">{prop.address}</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{prop.address}</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/properties/${id}?tab=${t.id}`}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <InfoCard label="Status" value={prop.status ?? '—'} />
            <InfoCard
              label="Purchase Price"
              value={prop.purchase_price ? formatEUR(prop.purchase_price) : '—'}
            />
            <InfoCard
              label="Current Value"
              value={prop.current_value ? formatEUR(prop.current_value) : '—'}
            />
            <InfoCard
              label="Appreciation"
              value={appreciation ? `${appreciation}%` : '—'}
            />
            <InfoCard
              label="Active Tenant"
              value={activeTenancy?.tenants?.name ?? 'Vacant'}
            />
            <InfoCard
              label="Monthly Rent"
              value={
                activeTenancy ? formatEUR(activeTenancy.monthly_rent) : '—'
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InfoCard label="Total Income" value={formatEUR(totalIncome)} />
            <InfoCard label="Total Expenses" value={formatEUR(totalExpenses)} />
          </div>
        </div>
      )}

      {activeTab === 'tenancies' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Link
              href={`/properties/${id}/tenancies/new`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Tenancy
            </Link>
          </div>
          {tenancyRows.length === 0 ? (
            <p className="text-sm text-gray-500">No tenancies.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Monthly Rent
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tenancyRows.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {t.tenants?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatEUR(t.monthly_rent)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {t.start_date} → {t.end_date ?? 'open'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            t.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {t.is_active ? 'Active' : 'Ended'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'finance' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Link
              href={`/transactions/new?property_id=${id}`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Transaction
            </Link>
          </div>
          {transactionRows.length === 0 ? (
            <p className="text-sm text-gray-500">No transactions.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactionRows.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{t.date}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {t.category ?? '—'}
                      </td>
                      <td
                        className={`px-4 py-3 font-medium ${
                          t.type === 'income'
                            ? 'text-green-700'
                            : 'text-red-700'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatEUR(t.amount)}
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">
                        {t.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Link
              href={`/bookings/new?property_id=${id}`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Booking
            </Link>
          </div>
          {bookingRows.length === 0 ? (
            <p className="text-sm text-gray-500">No bookings.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Guest
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Check-in
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Check-out
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookingRows.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {b.guest_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{b.check_in}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {b.check_out}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatEUR(b.total_amount)}
                      </td>
                      <td className="px-4 py-3">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div>
          {documentRows.length === 0 ? (
            <p className="text-sm text-gray-500">
              No documents. Upload from the Documents page.
            </p>
          ) : (
            <div className="space-y-2">
              {documentRows.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">{doc.filename}</p>
                    <p className="text-xs text-gray-500">
                      {doc.doc_type?.replace(/_/g, ' ') ?? 'other'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'loans' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Link
              href={`/properties/${id}/loans/new`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Loan
            </Link>
          </div>
          {loanRows.length === 0 ? (
            <p className="text-sm text-gray-500">No loans.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Lender
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Principal
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Outstanding
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Monthly
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loanRows.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {l.lender}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatEUR(l.principal)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {l.outstanding != null
                          ? formatEUR(l.outstanding)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {l.monthly_payment != null
                          ? formatEUR(l.monthly_payment)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {l.interest_rate != null
                          ? `${l.interest_rate}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
