import Link from 'next/link';

export function QuickActions() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-base font-semibold text-gray-800">Quick Actions</h2>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/properties/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add Property
        </Link>
        <Link
          href="/transactions/new"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Record Payment
        </Link>
        <Link
          href="/documents"
          className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Upload Document
        </Link>
      </div>
    </div>
  );
}
