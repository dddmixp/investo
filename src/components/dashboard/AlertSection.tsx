import type { OverdueAlert, ExpiryAlert, LoanPaymentAlert } from '@/lib/dashboard';

type AlertType = 'overdue' | 'expiry' | 'loan';

type AlertItem = OverdueAlert | ExpiryAlert | LoanPaymentAlert;

function alertBadgeClass(type: AlertType): string {
  switch (type) {
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'expiry':
      return 'bg-yellow-100 text-yellow-800';
    case 'loan':
      return 'bg-blue-100 text-blue-800';
  }
}

function renderItem(item: AlertItem, type: AlertType) {
  if (type === 'overdue') {
    const a = item as OverdueAlert;
    return (
      <li key={a.tenancy_id} className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-700">
          <span className="font-medium">{a.tenant_name}</span> — payment day {a.payment_day}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${alertBadgeClass(type)}`}>
          {a.daysOverdue}d overdue
        </span>
      </li>
    );
  }
  if (type === 'expiry') {
    const a = item as ExpiryAlert;
    return (
      <li key={a.tenancy_id} className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-700">
          <span className="font-medium">{a.tenant_name}</span> — ends {a.end_date}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${alertBadgeClass(type)}`}>
          {a.daysLeft}d left
        </span>
      </li>
    );
  }
  // loan
  const a = item as LoanPaymentAlert;
  return (
    <li key={a.loan_id} className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">
        <span className="font-medium">{a.lender}</span> — due {a.next_payment}
      </span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${alertBadgeClass(type)}`}>
        {a.daysLeft}d left
      </span>
    </li>
  );
}

export function AlertSection({
  title,
  items,
  type,
}: {
  title: string;
  items: AlertItem[];
  type: AlertType;
}) {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-2 text-base font-semibold text-gray-800">{title}</h2>
      <ul className="divide-y divide-gray-100">
        {items.map((item) => renderItem(item, type))}
      </ul>
    </div>
  );
}
