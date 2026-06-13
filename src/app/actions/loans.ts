'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export type LoanFormData = {
  property_id: string;
  lender: string;
  principal: string;
  interest_rate: string;
  rate_type: string;
  term_months: string;
  start_date: string;
  monthly_payment: string;
  outstanding: string;
};
export type ActionResult = { error: string } | null;

export async function createLoan(data: LoanFormData): Promise<ActionResult> {
  if (!data.property_id) return { error: 'Property is required' };
  if (!data.lender.trim()) return { error: 'Lender is required' };
  if (!data.principal || isNaN(parseFloat(data.principal))) return { error: 'Principal is required' };
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { error } = await supabase.from('loans').insert({
    owner_id: user.id,
    property_id: data.property_id,
    lender: data.lender.trim(),
    principal: Math.round(parseFloat(data.principal) * 100),
    interest_rate: data.interest_rate ? parseFloat(data.interest_rate) : null,
    rate_type: data.rate_type || null,
    term_months: data.term_months ? parseInt(data.term_months, 10) : null,
    start_date: data.start_date || null,
    monthly_payment: data.monthly_payment ? Math.round(parseFloat(data.monthly_payment) * 100) : null,
    outstanding: data.outstanding ? Math.round(parseFloat(data.outstanding) * 100) : null,
  });
  if (error) return { error: error.message };
  revalidatePath('/properties');
  revalidatePath(`/properties/${data.property_id}/loans`);
  redirect('/properties');
}

export async function updateLoan(id: string, data: LoanFormData): Promise<ActionResult> {
  if (!data.lender.trim()) return { error: 'Lender is required' };
  if (!data.principal || isNaN(parseFloat(data.principal))) return { error: 'Principal is required' };
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { error } = await supabase
    .from('loans')
    .update({
      lender: data.lender.trim(),
      principal: Math.round(parseFloat(data.principal) * 100),
      interest_rate: data.interest_rate ? parseFloat(data.interest_rate) : null,
      rate_type: data.rate_type || null,
      term_months: data.term_months ? parseInt(data.term_months, 10) : null,
      start_date: data.start_date || null,
      monthly_payment: data.monthly_payment ? Math.round(parseFloat(data.monthly_payment) * 100) : null,
      outstanding: data.outstanding ? Math.round(parseFloat(data.outstanding) * 100) : null,
    })
    .eq('id', id)
    .eq('owner_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/properties');
  revalidatePath(`/properties/${data.property_id}/loans`);
  redirect('/properties');
}

export async function deleteLoan(id: string): Promise<ActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  // Fetch property_id before delete for revalidation
  const { data: loan } = await supabase
    .from('loans')
    .select('property_id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();
  const { error } = await supabase.from('loans').delete().eq('id', id).eq('owner_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/properties');
  if (loan?.property_id) revalidatePath(`/properties/${loan.property_id}/loans`);
  return null;
}
