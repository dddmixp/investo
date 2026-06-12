'use client';
import { useState } from 'react';

type Props = { documentId: string; onExtracted: (data: Record<string, unknown>) => void };

export function ExtractButton({ documentId, onExtracted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/documents/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId }),
    });
    const data = (await res.json()) as { error?: string; extractedData?: Record<string, unknown> };
    if (data.error) setError(data.error);
    else if (data.extractedData) onExtracted(data.extractedData);
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleExtract}
        disabled={loading}
        className="text-sm bg-purple-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? 'Extracting…' : '🤖 Extract'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
