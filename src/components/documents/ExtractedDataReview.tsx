'use client';
import { useState } from 'react';

type Props = { data: Record<string, unknown>; onConfirm: (data: Record<string, unknown>) => void };

export function ExtractedDataReview({ data, onConfirm }: Props) {
  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? '')])),
  );

  return (
    <div className="border border-purple-200 rounded-xl p-4 bg-purple-50 space-y-3">
      <p className="text-sm font-medium text-purple-800">Review extracted data</p>
      <div className="space-y-2">
        {Object.keys(fields).map((key) => (
          <div key={key} className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-600 w-40 shrink-0">
              {key.replace(/_/g, ' ')}
            </label>
            <input
              value={fields[key]}
              onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => onConfirm(Object.fromEntries(Object.entries(fields)))}
        className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700"
      >
        Confirm &amp; Apply
      </button>
    </div>
  );
}
