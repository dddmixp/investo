/**
 * Validate the inputs required before uploading a document.
 * Returns an error message string, or null when the upload may proceed.
 */
export function validateUpload(
  selectedProperty: string | null,
  filename: string
): string | null {
  if (!selectedProperty) return 'Select a property first';
  if (!filename || !filename.trim()) return 'No file selected';
  return null;
}

/**
 * Build the Supabase Storage path for a document, following the ADR contract:
 * `{owner_id}/{entity_type}/{entity_id}/{uuid}.{ext}`.
 * The extension is derived from the filename, defaulting to `jpg`.
 */
export function buildStoragePath(
  ownerId: string,
  entityType: string,
  entityId: string,
  fileId: string,
  filename: string
): string {
  const ext = filename.includes('.') ? filename.split('.').pop() || 'jpg' : 'jpg';
  return `${ownerId}/${entityType}/${entityId}/${fileId}.${ext}`;
}
