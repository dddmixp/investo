import { describe, it, expect } from 'vitest';
import { isExpoPushToken } from '@/lib/push';

describe('isExpoPushToken', () => {
  it('validates Expo push token format', () => {
    expect(isExpoPushToken('ExponentPushToken[abc123]')).toBe(true);
    expect(isExpoPushToken('ExpoPushToken[abc123]')).toBe(true);
    expect(isExpoPushToken('invalid-token')).toBe(false);
  });
});
