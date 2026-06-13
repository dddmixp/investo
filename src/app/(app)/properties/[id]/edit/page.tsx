import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import type { Property } from '@/types';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { updateProperty } from '@/app/actions/properties';

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data } = await supabase.from('properties').select('*').eq('id', id).single();
  if (!data) notFound();
  const property = data as Property;

  const action = async (formData: Parameters<typeof updateProperty>[1]) =>
    updateProperty(id, formData);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Property</h1>
      <PropertyForm property={property} action={action} />
    </div>
  );
}
