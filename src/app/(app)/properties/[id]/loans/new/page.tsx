import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { LoanForm } from '@/components/loans/LoanForm';
import { createLoan } from '@/app/actions/loans';

export default async function NewLoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: property } = await supabase
    .from('properties')
    .select('id, address')
    .eq('id', id)
    .single();
  if (!property) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">
        Add Loan — {(property as { address: string }).address}
      </h1>
      <LoanForm action={createLoan} propertyId={id} />
    </div>
  );
}
