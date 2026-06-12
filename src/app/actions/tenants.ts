'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export type TenantFormData = {
  name: string;
  egn: string;
  phone: string;
  email: string;
  whatsapp: string;
  notes: string;
};
export type ActionResult = { error: string } | null;

export async function createTenant(data: TenantFormData): Promise<ActionResult> {
  if (!data.name.trim()) return { error: 'Name is required' };
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { error } = await supabase.from('tenants').insert({
    owner_id: user.id,
    name: data.name.trim(),
    egn: data.egn || null,
    phone: data.phone || null,
    email: data.email || null,
    whatsapp: data.whatsapp || null,
    notes: data.notes || null,
  });
  if (error) return { error: error.message };
  revalidatePath('/tenants');
  redirect('/tenants');
}

export async function updateTenant(
  id: string,
  data: TenantFormData,
): Promise<ActionResult> {
  if (!data.name.trim()) return { error: 'Name is required' };
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { error } = await supabase
    .from('tenants')
    .update({
      name: data.name.trim(),
      egn: data.egn || null,
      phone: data.phone || null,
      email: data.email || null,
      whatsapp: data.whatsapp || null,
      notes: data.notes || null,
    })
    .eq('id', id)
    .eq('owner_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/tenants');
  redirect('/tenants');
}

export async function deleteTenant(id: string): Promise<ActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  // Check for active tenancies
  const { count } = await supabase
    .from('tenancies')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', id)
    .eq('status', 'active');
  if ((count ?? 0) > 0) return { error: 'Tenant has active tenancies. End them first.' };
  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/tenants');
  return null;
}
