import { describe, it, expect } from 'vitest';

function validateUpload(selectedProperty: string | null, filename: string): string | null {
  if (!selectedProperty) return 'Select a property first';
  if (!filename) return 'No file selected';
  return null;
}

describe('upload validation', () => {
  it('requires property', () => {
    expect(validateUpload(null, 'doc.pdf')).toBe('Select a property first');
  });
  it('passes with all fields', () => {
    expect(validateUpload('p1', 'doc.pdf')).toBeNull();
  });
});
