import type { Transaction } from '@/types';
import { formatEUR } from '@/lib/format';

export function RecentTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-2 text-base font-semibold text-gray-800">Recent Transactions</h2>
      {transactions.length === 0 ? (
        <p className="text-sm text-gray-500">No transactions yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {transactions.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-700 capitalize">{tx.category}</p>
                <p className="text-xs text-gray-400">
                  {new Date(tx.created_at).toLocaleDateString('en-IE')}
                </p>
              </div>
              <span
                className={`text-sm font-semibold ${
                  tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}
                {formatEUR(tx.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
