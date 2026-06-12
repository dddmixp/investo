'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export type PropertyFormData = {
  address: string;
  type: string;
  status: string;
  purchase_date: string;
  purchase_price: string;
  current_value: string;
};

export type ActionResult = { error: string } | null;

export async function createProperty(data: PropertyFormData): Promise<ActionResult> {
  if (!data.address.trim()) return { error: 'Address is required' };

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('properties').insert({
    owner_id: user.id,
    address: data.address.trim(),
    type: data.type || null,
    status: data.status || null,
    purchase_date: data.purchase_date || null,
    purchase_price: data.purchase_price ? Math.round(parseFloat(data.purchase_price) * 100) : null,
    current_value: data.current_value ? Math.round(parseFloat(data.current_value) * 100) : null,
  });

  if (error) return { error: error.message };
  revalidatePath('/properties');
  redirect('/properties');
}

export async function updateProperty(id: string, data: PropertyFormData): Promise<ActionResult> {
  if (!data.address.trim()) return { error: 'Address is required' };

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('properties').update({
    address: data.address.trim(),
    type: data.type || null,
    status: data.status || null,
    purchase_date: data.purchase_date || null,
    purchase_price: data.purchase_price ? Math.round(parseFloat(data.purchase_price) * 100) : null,
    current_value: data.current_value ? Math.round(parseFloat(data.current_value) * 100) : null,
  }).eq('id', id).eq('owner_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/properties');
  redirect('/properties');
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('properties').delete()
    .eq('id', id).eq('owner_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/properties');
  return null;
}
