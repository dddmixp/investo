import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// NOTE: prompts request human-readable EUR; convert to cents when applying to entity records
const EXTRACTION_PROMPTS: Record<string, string> = {
  rental_contract: `Extract from this rental contract:
- tenant_name (string)
- property_address (string)
- start_date (YYYY-MM-DD)
- end_date (YYYY-MM-DD or null)
- monthly_rent (number, in EUR)
- deposit (number, in EUR or null)
Return JSON only, no markdown.`,

  loan_agreement: `Extract from this loan agreement:
- lender (string)
- principal (number, in EUR)
- interest_rate (number, percent)
- start_date (YYYY-MM-DD)
- monthly_payment (number, in EUR or null)
- term_months (number or null)
Return JSON only, no markdown.`,

  invoice: `Extract from this invoice:
- amount (number, in EUR)
- date (YYYY-MM-DD)
- description (string)
- vendor (string or null)
Return JSON only, no markdown.`,
};

const GENERIC_PROMPT = `Extract all key information from this document as structured JSON.
Return JSON only, no markdown. Include any amounts, dates, names, addresses found.`;

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { documentId } = (await req.json()) as { documentId: string };
  if (!documentId) return NextResponse.json({ error: 'documentId required' }, { status: 400 });

  const { data: doc } = await supabase
    .from('documents')
    .select('id, storage_path, doc_type, owner_id, filename')
    .eq('id', documentId)
    .single();

  if (!doc || doc.owner_id !== user.id)
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  // Get signed URL for the file
  const { data: signedData, error: signedError } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.storage_path, 300);
  if (signedError || !signedData)
    return NextResponse.json({ error: 'Failed to get file URL' }, { status: 500 });

  // Fetch the file content
  const fileRes = await fetch(signedData.signedUrl);
  if (!fileRes.ok)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });

  const contentType = fileRes.headers.get('content-type') ?? 'application/octet-stream';
  const isImage = contentType.startsWith('image/');
  const isPdf = contentType === 'application/pdf' || doc.filename?.endsWith('.pdf');

  if (isImage && !ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 });
  }

  const prompt = EXTRACTION_PROMPTS[doc.doc_type ?? ''] ?? GENERIC_PROMPT;

  let extractedData: Record<string, unknown>;

  if (isImage) {
    const buffer = await fileRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mediaType = contentType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });
    const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
    try {
      extractedData = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Failed to parse extraction result' }, { status: 422 });
    }
  } else if (isPdf) {
    // For PDFs, use document source type
    const buffer = await fileRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });
    const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
    try {
      extractedData = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Failed to parse extraction result' }, { status: 422 });
    }
  } else {
    return NextResponse.json({ error: 'Unsupported file type for extraction' }, { status: 400 });
  }

  // Store extracted data in DB
  const { error: updateError } = await supabase
    .from('documents')
    .update({ extracted_data: extractedData })
    .eq('id', documentId);
  if (updateError) {
    console.error('Failed to persist extracted data', updateError);
    return NextResponse.json({ error: 'Failed to save extraction result' }, { status: 500 });
  }

  return NextResponse.json({ extractedData });
}
