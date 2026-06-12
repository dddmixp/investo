import { createTransaction } from '@/app/actions/transactions';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { createServerClient } from '@/lib/supabase/server';
import type { Property } from '@/types';

export default async function NewTransactionPage() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('properties')
    .select('id, address')
    .order('address');
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Add Transaction</h1>
      <TransactionForm
        properties={(data ?? []) as Property[]}
        action={createTransaction}
      />
    </div>
  );
}
