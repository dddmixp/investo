import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import type { Loan, Property } from '@/types';
import { formatEUR } from '@/lib/format';
import { nextPaymentDate } from '@/lib/loans';
import { DeleteLoanButton } from '@/components/loans/DeleteLoanButton';

export default async function PropertyLoansPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const [{ data: property }, { data: loans }] = await Promise.all([
    supabase.from('properties').select('id, address').eq('id', id).single(),
    supabase.from('loans').select('*').eq('property_id', id).order('created_at'),
  ]);
  if (!property) notFound();
  const loanRows = (loans ?? []) as Loan[];
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Loans — {(property as Property & { address: string }).address}
        </h1>
        <Link
          href={`/properties/${id}/loans/new`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Loan
        </Link>
      </div>
      {loanRows.length === 0 ? (
        <p className="text-sm text-gray-500">No loans yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                {['Lender', 'Outstanding', 'Principal', 'Monthly', 'Rate', 'Next Payment', ''].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 font-medium text-gray-600">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loanRows.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{loan.lender}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {loan.outstanding != null ? formatEUR(loan.outstanding) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatEUR(loan.principal)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {loan.monthly_payment != null ? formatEUR(loan.monthly_payment) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {loan.interest_rate != null
                      ? `${loan.interest_rate}% ${loan.rate_type ?? ''}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {loan.start_date
                      ? (nextPaymentDate(loan.start_date, loan.term_months) ?? 'Paid off')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/properties/${id}/loans/${loan.id}/edit`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteLoanButton id={loan.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
