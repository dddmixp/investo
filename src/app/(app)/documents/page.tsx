import { createServerClient } from '@/lib/supabase/server';
import type { Document } from '@/types';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentUpload } from '@/components/documents/DocumentUpload';

export default async function DocumentsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Documents</h1>
      <div className="mb-6">
        <DocumentUpload entityType="property" entityId={user?.id ?? ''} />
      </div>
      <DocumentList documents={(docs ?? []) as Document[]} />
    </div>
  );
}
