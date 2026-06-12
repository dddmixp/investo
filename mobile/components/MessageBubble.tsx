import { StyleSheet, Text, View } from 'react-native'
import type { Message } from '../types'

type Props = {
  message: Message
}

export default function MessageBubble({ message }: Props) {
  const isOutbound = message.direction === 'outbound'
  return (
    <View style={[styles.wrapper, isOutbound ? styles.wrapperOut : styles.wrapperIn]}>
      <View style={[styles.bubble, isOutbound ? styles.bubbleOut : styles.bubbleIn]}>
        <Text style={[styles.body, isOutbound ? styles.bodyOut : styles.bodyIn]}>
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
  wrapperOut: { alignItems: 'flex-end' },
  wrapperIn: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 12, padding: 10 },
  bubbleOut: { backgroundColor: '#2563eb' },
  bubbleIn: { backgroundColor: '#f3f4f6' },
  body: { fontSize: 15 },
  bodyOut: { color: '#fff' },
  bodyIn: { color: '#111827' },
  time: { fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'right' },
})
