import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import type { Loan } from '@/types';
import { LoanForm } from '@/components/loans/LoanForm';
import { updateLoan } from '@/app/actions/loans';

export default async function EditLoanPage({
  params,
}: {
  params: Promise<{ id: string; loanId: string }>;
}) {
  const { id, loanId } = await params;
  const supabase = await createServerClient();
  const { data: loan } = await supabase.from('loans').select('*').eq('id', loanId).single();
  if (!loan) notFound();

  const typedLoan = loan as Loan;

  async function handleUpdate(data: Parameters<typeof updateLoan>[1]) {
    'use server';
    return updateLoan(id, data);
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Edit Loan — {typedLoan.lender}</h1>
      <LoanForm action={handleUpdate} loan={typedLoan} />
    </div>
  );
}
