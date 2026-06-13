import { describe, it, expect } from 'vitest';
import { validateUpload, buildStoragePath } from '../lib/uploadValidation';

describe('validateUpload', () => {
  it('requires a selected property', () => {
    expect(validateUpload(null, 'doc.pdf')).toBe('Select a property first');
  });

  it('requires a filename', () => {
    expect(validateUpload('p1', '')).toBe('No file selected');
  });

  it('rejects a whitespace-only filename', () => {
    expect(validateUpload('p1', '   ')).toBe('No file selected');
  });

  it('passes with property and filename', () => {
    expect(validateUpload('p1', 'doc.pdf')).toBeNull();
  });
});

describe('buildStoragePath', () => {
  it('follows the {owner}/{type}/{id}/{uuid}.{ext} contract', () => {
    expect(buildStoragePath('owner1', 'property', 'prop1', 'uuid1', 'scan.pdf')).toBe(
      'owner1/property/prop1/uuid1.pdf'
    );
  });

  it('defaults the extension to jpg when filename has none', () => {
    expect(buildStoragePath('o', 'property', 'p', 'u', 'photo')).toBe('o/property/p/u.jpg');
  });

  it('uses the last segment as the extension for multi-dot names', () => {
    expect(buildStoragePath('o', 'property', 'p', 'u', 'my.scan.PNG')).toBe('o/property/p/u.PNG');
  });
});
