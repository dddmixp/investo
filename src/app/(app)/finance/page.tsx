import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import type { Transaction, Property } from '@/types';
import { formatEUR } from '@/lib/format';
import { calcTotals } from '@/lib/transactions';
import { DeleteTransactionButton } from '@/components/transactions/DeleteTransactionButton';

type SearchParams = {
  property?: string;
  type?: string;
  from?: string;
  to?: string;
};

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await searchParams;
  const supabase = await createServerClient();

  let query = supabase
    .from('transactions')
    .select('id, type, category, amount, date, description, property_id, created_at')
    .order('date', { ascending: false });
  if (filters.property) query = query.eq('property_id', filters.property);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.from) query = query.gte('date', filters.from);
  if (filters.to) query = query.lte('date', filters.to);

  const [
    { data: txs, error: txError },
    { data: properties, error: propError },
  ] = await Promise.all([
    query,
    supabase.from('properties').select('id, address').order('address'),
  ]);

  if (txError) {
    return (
      <div className="text-sm text-red-600">
        Failed to load transactions: {txError.message}
      </div>
    );
  }
  if (propError) {
    return (
      <div className="text-sm text-red-600">
        Failed to load properties: {propError.message}
      </div>
    );
  }

  const transactions = (txs ?? []) as Transaction[];
  const props = (properties ?? []) as Property[];
  const totals = calcTotals(transactions);
  const propMap = new Map(props.map((p) => [p.id, p.address]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Finance</h1>
        <Link
          href="/finance/new"
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Add Transaction
        </Link>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(
          [
            ['Income', totals.income, 'text-emerald-700 bg-emerald-50'],
            ['Expenses', totals.expenses, 'text-red-700 bg-red-50'],
            [
              'Net',
              totals.net,
              totals.net >= 0
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-red-700 bg-red-50',
            ],
          ] as [string, number, string][]
        ).map(([label, val, cls]) => (
          <div key={label} className={`rounded-xl p-4 ${cls}`}>
            <p className="text-xs font-medium mb-1">{label}</p>
            <p className="text-lg font-bold">{formatEUR(val)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 mb-4 text-sm">
        <select
          name="property"
          defaultValue={filters.property ?? ''}
          className="border border-gray-300 rounded-lg px-3 py-1.5"
        >
          <option value="">All properties</option>
          {props.map((p) => (
            <option key={p.id} value={p.id}>
              {p.address}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={filters.type ?? ''}
          className="border border-gray-300 rounded-lg px-3 py-1.5"
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input
          name="from"
          type="date"
          defaultValue={filters.from ?? ''}
          className="border border-gray-300 rounded-lg px-3 py-1.5"
        />
        <input
          name="to"
          type="date"
          defaultValue={filters.to ?? ''}
          className="border border-gray-300 rounded-lg px-3 py-1.5"
        />
        <button
          type="submit"
          className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-200"
        >
          Filter
        </button>
      </form>

      {transactions.length === 0 ? (
        <p className="text-sm text-gray-500">No transactions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                {['Date', 'Property', 'Category', 'Type', 'Amount', 'Description', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-medium text-gray-600"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{tx.date}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {propMap.get(tx.property_id) ?? '—'}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">
                    {tx.category ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        tx.type === 'income'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 font-medium ${
                      tx.type === 'income'
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatEUR(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {tx.description ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteTransactionButton id={tx.id} />
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
