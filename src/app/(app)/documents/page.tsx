import { createServerClient } from "@/lib/supabase/server";
import type { AppDocument } from "@/types";
import { DocumentList } from "@/components/documents/DocumentList";

export default async function DocumentsPage() {
  const supabase = await createServerClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Documents</h1>
      <DocumentList documents={(docs ?? []) as AppDocument[]} />
    </div>
  );
}
