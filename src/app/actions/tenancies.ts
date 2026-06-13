'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export type TenancyFormData = {
  property_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: string;
  deposit: string;
  payment_day: string;
  status: string;
};
export type ActionResult = { error: string } | null;

function parseFormData(data: TenancyFormData): ActionResult {
  if (!data.property_id) return { error: 'Property is required' };
  if (!data.tenant_id) return { error: 'Tenant is required' };
  if (!data.start_date) return { error: 'Start date is required' };
  if (!data.monthly_rent || isNaN(parseFloat(data.monthly_rent)))
    return { error: 'Monthly rent is required' };
  if (data.status && !['active', 'expired', 'terminated'].includes(data.status))
    return { error: 'Invalid status' };
  return null;
}

export async function createTenancy(data: TenancyFormData): Promise<ActionResult> {
  const err = parseFormData(data);
  if (err) return err;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { error } = await supabase.from('tenancies').insert({
    owner_id: user.id,
    property_id: data.property_id,
    tenant_id: data.tenant_id,
    start_date: data.start_date,
    end_date: data.end_date || null,
    monthly_rent: Math.round(parseFloat(data.monthly_rent) * 100),
    deposit: data.deposit ? Math.round(parseFloat(data.deposit) * 100) : null,
    payment_day: parseInt(data.payment_day) || 1,
    status: data.status || 'active',
  });
  if (error) return { error: error.message };
  revalidatePath('/tenants');
  redirect('/tenants');
}

export async function updateTenancy(id: string, data: TenancyFormData): Promise<ActionResult> {
  const err = parseFormData(data);
  if (err) return err;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { error } = await supabase
    .from('tenancies')
    .update({
      property_id: data.property_id,
      tenant_id: data.tenant_id,
      start_date: data.start_date,
      end_date: data.end_date || null,
      monthly_rent: Math.round(parseFloat(data.monthly_rent) * 100),
      deposit: data.deposit ? Math.round(parseFloat(data.deposit) * 100) : null,
      payment_day: parseInt(data.payment_day) || 1,
      status: data.status || 'active',
    })
    .eq('id', id)
    .eq('owner_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/tenants');
  redirect('/tenants');
}

export async function deleteTenancy(id: string): Promise<ActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { error } = await supabase
    .from('tenancies')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/tenants');
  return null;
}
