export type DocumentType = 'rental_contract' | 'loan_agreement' | 'invoice';

export interface Document {
  id: string;
  storage_path: string;
  doc_type: DocumentType | null;
  owner_id: string;
  filename: string;
  extracted_data?: Record<string, unknown> | null;
  created_at?: string;
}
