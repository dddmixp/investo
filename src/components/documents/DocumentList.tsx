'use client';
import { useState } from 'react';
import type { Document } from '@/types';
import { deleteDocument } from '@/app/actions/documents';

type Props = { documents: Document[] };

export function DocumentList({ documents }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function getSignedUrl(docId: string) {
    setLoadingId(docId);
    const res = await fetch(`/api/documents/${docId}/signed-url`);
    const { url } = (await res.json()) as { url: string };
    setLoadingId(null);
    return url;
  }

  if (documents.length === 0) return <p className="text-sm text-gray-500">No documents yet.</p>;

  return (
    <>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📄</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                <p className="text-xs text-gray-500">
                  {doc.doc_type?.replace(/_/g, ' ') ?? 'other'} · {doc.created_at.split('T')[0]}
                </p>
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={async () => {
                  const url = await getSignedUrl(doc.id);
                  window.open(url, '_blank');
                }}
                disabled={loadingId === doc.id}
                className="text-blue-600 hover:underline disabled:opacity-50"
              >
                {loadingId === doc.id ? '…' : 'Download'}
              </button>
              {doc.filename.toLowerCase().endsWith('.pdf') && (
                <button
                  onClick={async () => {
                    const url = await getSignedUrl(doc.id);
                    setPreviewUrl(url);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Preview
                </button>
              )}
              <button
                onClick={() => deleteDocument(doc.id, doc.storage_path)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="flex h-[80vh] w-full max-w-3xl flex-col rounded-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end border-b p-2">
              <button
                onClick={() => setPreviewUrl(null)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            <iframe src={previewUrl} className="w-full flex-1" title="PDF Preview" />
          </div>
        </div>
      )}
    </>
  );
}
