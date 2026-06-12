'use client';
import { useState, useRef } from 'react';
import { uploadDocument } from '@/app/actions/documents';

const DOC_TYPES = [
  'purchase_deed',
  'rental_contract',
  'loan_agreement',
  'invoice',
  'insurance',
  'utility_bill',
  'permit',
  'other',
];
const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.docx';

type Props = { entityType: string; entityId: string; onUploaded?: () => void };

export function DocumentUpload({ entityType, entityId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [docType, setDocType] = useState('other');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    const result = await uploadDocument({ entityType, entityId, docType, file });
    if (result?.error) setError(result.error);
    else onUploaded?.();
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Document Type</label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <p className="text-sm text-gray-500">{loading ? 'Uploading…' : 'Drop file here or click to browse'}</p>
        <p className="mt-1 text-xs text-gray-400">PDF, JPG, PNG, DOCX — max 50MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
