import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="thread/[tenantId]" options={{ headerBackTitle: 'Messages' }} />
    </Stack>
  )
}
