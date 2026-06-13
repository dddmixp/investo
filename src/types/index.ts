export type AppDocument = {
  id: string;
  owner_id: string;
  created_at: string;
  entity_type: 'property' | 'tenancy' | 'booking' | 'transaction' | 'loan';
  entity_id: string;
  doc_type:
    | 'purchase_deed'
    | 'rental_contract'
    | 'loan_agreement'
    | 'invoice'
    | 'insurance'
    | 'utility_bill'
    | 'permit'
    | 'other'
    | null;
  filename: string;
  storage_path: string;
  extracted_data: Record<string, unknown> | null;
  notes: string | null;
};
