'use client';

import { useState } from 'react';
import type { Loan } from '@/types';
import type { ActionResult, LoanFormData } from '@/app/actions/loans';

type LoanFormProps = {
  action: (data: LoanFormData) => Promise<ActionResult>;
  propertyId?: string;
  loan?: Loan;
};

export function LoanForm({ action, propertyId, loan }: LoanFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const result = await action({
      property_id: (fd.get('property_id') as string) ?? '',
      lender: (fd.get('lender') as string) ?? '',
      principal: (fd.get('principal') as string) ?? '',
      interest_rate: (fd.get('interest_rate') as string) ?? '',
      rate_type: (fd.get('rate_type') as string) ?? '',
      term_months: (fd.get('term_months') as string) ?? '',
      start_date: (fd.get('start_date') as string) ?? '',
      monthly_payment: (fd.get('monthly_payment') as string) ?? '',
      outstanding: (fd.get('outstanding') as string) ?? '',
    });
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <input type="hidden" name="property_id" value={propertyId ?? loan?.property_id ?? ''} />

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label htmlFor="lender" className="mb-1 block text-sm font-medium text-gray-700">
          Lender <span className="text-red-500">*</span>
        </label>
        <input
          id="lender"
          name="lender"
          type="text"
          required
          defaultValue={loan?.lender ?? ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="e.g. UniCredit"
        />
      </div>

      <div>
        <label htmlFor="principal" className="mb-1 block text-sm font-medium text-gray-700">
          Principal (€) <span className="text-red-500">*</span>
        </label>
        <input
          id="principal"
          name="principal"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={loan ? (loan.principal / 100).toFixed(2) : ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="200000.00"
        />
      </div>

      <div>
        <label htmlFor="outstanding" className="mb-1 block text-sm font-medium text-gray-700">
          Outstanding Balance (€)
        </label>
        <input
          id="outstanding"
          name="outstanding"
          type="number"
          step="0.01"
          min="0"
          defaultValue={loan?.outstanding != null ? (loan.outstanding / 100).toFixed(2) : ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="150000.00"
        />
      </div>

      <div>
        <label htmlFor="monthly_payment" className="mb-1 block text-sm font-medium text-gray-700">
          Monthly Payment (€)
        </label>
        <input
          id="monthly_payment"
          name="monthly_payment"
          type="number"
          step="0.01"
          min="0"
          defaultValue={loan?.monthly_payment != null ? (loan.monthly_payment / 100).toFixed(2) : ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="800.00"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="interest_rate" className="mb-1 block text-sm font-medium text-gray-700">
            Interest Rate (%)
          </label>
          <input
            id="interest_rate"
            name="interest_rate"
            type="number"
            step="0.001"
            min="0"
            max="100"
            defaultValue={loan?.interest_rate ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="3.5"
          />
        </div>

        <div>
          <label htmlFor="rate_type" className="mb-1 block text-sm font-medium text-gray-700">
            Rate Type
          </label>
          <select
            id="rate_type"
            name="rate_type"
            defaultValue={loan?.rate_type ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">— select —</option>
            <option value="fixed">Fixed</option>
            <option value="variable">Variable</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="term_months" className="mb-1 block text-sm font-medium text-gray-700">
            Term (months)
          </label>
          <input
            id="term_months"
            name="term_months"
            type="number"
            min="1"
            defaultValue={loan?.term_months ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="240"
          />
        </div>

        <div>
          <label htmlFor="start_date" className="mb-1 block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={loan?.start_date ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? 'Saving…' : loan ? 'Update Loan' : 'Add Loan'}
        </button>
      </div>
    </form>
  );
}
