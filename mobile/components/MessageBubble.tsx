import { StyleSheet, Text, View } from 'react-native'
import type { Message } from '../types'

type Props = { message: Message }

export function MessageBubble({ message }: Props) {
  const isOutbound = message.direction === 'outbound'
  return (
    <View style={[styles.wrapper, isOutbound ? styles.outboundWrapper : styles.inboundWrapper]}>
      <View style={[styles.bubble, isOutbound ? styles.outboundBubble : styles.inboundBubble]}>
        <Text style={[styles.body, isOutbound ? styles.outboundText : styles.inboundText]}>
          {message.body}
        </Text>
        <Text style={styles.time}>
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 4 },
  outboundWrapper: { alignItems: 'flex-end' },
  inboundWrapper: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 10 },
  outboundBubble: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  inboundBubble: { backgroundColor: '#f0f0f0', borderBottomLeftRadius: 4 },
  body: { fontSize: 15 },
  outboundText: { color: '#fff' },
  inboundText: { color: '#111' },
  time: { fontSize: 11, color: '#aaa', marginTop: 2 },
})
