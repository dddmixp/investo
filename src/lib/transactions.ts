import type { Transaction } from '@/types';

export function calcTotals(transactions: Transaction[]) {
  let income = 0;
  let expenses = 0;
  for (const tx of transactions) {
    if (tx.type === 'income') income += tx.amount;
    else expenses += tx.amount;
  }
  return { income, expenses, net: income - expenses };
}

const INCOME_CATEGORIES = ['rent', 'deposit', 'sale', 'other'] as const;
const EXPENSE_CATEGORIES = [
  'mortgage',
  'maintenance',
  'renovation',
  'tax',
  'insurance',
  'utility',
  'agency',
  'other',
] as const;

export function getCategoriesForType(type: 'income' | 'expense') {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}
