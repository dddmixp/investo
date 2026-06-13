'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export type TransactionFormData = {
  property_id: string;
  type: string;
  category: string;
  amount: string;
  date: string;
  description: string;
};
export type ActionResult = { error: string } | null;

export async function createTransaction(
  data: TransactionFormData
): Promise<ActionResult> {
  if (!data.property_id) return { error: 'Property is required' };
  if (!data.type) return { error: 'Type is required' };
  if (!['income', 'expense'].includes(data.type))
    return { error: 'Invalid transaction type' };
  if (!data.amount || isNaN(parseFloat(data.amount)))
    return { error: 'Amount is required' };
  if (parseFloat(data.amount) <= 0) return { error: 'Amount must be positive' };
  if (!data.date) return { error: 'Date is required' };
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { error } = await supabase.from('transactions').insert({
    owner_id: user.id,
    property_id: data.property_id,
    type: data.type,
    category: data.category || null,
    amount: Math.round(parseFloat(data.amount) * 100),
    date: data.date,
    description: data.description || null,
  });
  if (error) return { error: error.message };
  revalidatePath('/finance');
  redirect('/finance');
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/finance');
  return null;
}
