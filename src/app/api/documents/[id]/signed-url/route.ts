import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: doc } = await supabase
    .from('documents')
    .select('storage_path, owner_id')
    .eq('id', id)
    .single();
  if (!doc || doc.owner_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: signedData, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.storage_path, 3600);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: signedData.signedUrl });
}
