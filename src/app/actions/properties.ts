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

function parsePriceCents(raw: string): number | null | { error: string } {
  if (!raw) return null;
  const val = parseFloat(raw);
  if (!Number.isFinite(val)) return { error: 'Invalid price format' };
  return Math.round(val * 100);
}

export async function createProperty(data: PropertyFormData): Promise<ActionResult> {
  if (!data.address.trim()) return { error: 'Address is required' };

  const purchasePrice = parsePriceCents(data.purchase_price);
  if (purchasePrice !== null && typeof purchasePrice === 'object') return purchasePrice;
  const currentValue = parsePriceCents(data.current_value);
  if (currentValue !== null && typeof currentValue === 'object') return currentValue;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('properties').insert({
    owner_id: user.id,
    address: data.address.trim(),
    type: data.type || null,
    status: data.status || null,
    purchase_date: data.purchase_date || null,
    purchase_price: purchasePrice,
    current_value: currentValue,
  });

  if (error) return { error: error.message };
  revalidatePath('/properties');
  redirect('/properties');
}

export async function updateProperty(id: string, data: PropertyFormData): Promise<ActionResult> {
  if (!data.address.trim()) return { error: 'Address is required' };

  const purchasePrice = parsePriceCents(data.purchase_price);
  if (purchasePrice !== null && typeof purchasePrice === 'object') return purchasePrice;
  const currentValue = parsePriceCents(data.current_value);
  if (currentValue !== null && typeof currentValue === 'object') return currentValue;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('properties').update({
    address: data.address.trim(),
    type: data.type || null,
    status: data.status || null,
    purchase_date: data.purchase_date || null,
    purchase_price: purchasePrice,
    current_value: currentValue,
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
