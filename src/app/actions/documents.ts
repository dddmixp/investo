'use server';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export type UploadDocumentInput = {
  entityType: string;
  entityId: string;
  docType: string;
  file: File;
};
export type ActionResult = { error: string } | null;

export async function uploadDocument(input: UploadDocumentInput): Promise<ActionResult> {
  const { entityType, entityId, docType, file } = input;
  if (!file || file.size === 0) return { error: 'No file provided' };
  if (file.size > 50 * 1024 * 1024) return { error: 'File too large (max 50MB)' };

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const ext = file.name.split('.').pop() ?? 'bin';
  const storagePath = `${user.id}/${entityType}/${entityId}/${uuidv4()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file);
  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await supabase.from('documents').insert({
    owner_id: user.id,
    entity_type: entityType,
    entity_id: entityId,
    doc_type: docType || null,
    filename: file.name,
    storage_path: storagePath,
  });
  if (dbError) {
    await supabase.storage.from('documents').remove([storagePath]);
    return { error: dbError.message };
  }

  revalidatePath('/documents');
  return null;
}

export async function deleteDocument(id: string, storagePath: string): Promise<ActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  await supabase.storage.from('documents').remove([storagePath]);
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/documents');
  return null;
}
