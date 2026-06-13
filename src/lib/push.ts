const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export function isExpoPushToken(token: string): boolean {
  return (
    token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
  );
}

/**
 * Sends a single push message directly to the Expo push service.
 * Returns true when Expo accepted the request, false otherwise.
 */
export async function sendExpoPush(
  token: string,
  title: string,
  body: string,
): Promise<boolean> {
  if (!isExpoPushToken(token)) return false;

  const message = {
    to: token,
    sound: 'default' as const,
    title,
    body,
    data: {},
  };

  const res = await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(message),
  });

  return res.ok;
}
