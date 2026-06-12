import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { buildMailtoUrl, buildTelUrl, buildWhatsAppUrl } from '../lib/messages'
import type { Tenant } from '../types'

type Props = { tenant: Tenant }

export function ContactActionBar({ tenant }: Props) {
  const openUrl = (url: string) => Linking.openURL(url)

  return (
    <View style={styles.bar}>
      {tenant.phone ? (
        <TouchableOpacity style={styles.btn} onPress={() => openUrl(buildTelUrl(tenant.phone!))}>
          <Text style={styles.label}>Call</Text>
        </TouchableOpacity>
      ) : null}
      {tenant.email ? (
        <TouchableOpacity style={styles.btn} onPress={() => openUrl(buildMailtoUrl(tenant.email!))}>
          <Text style={styles.label}>Email</Text>
        </TouchableOpacity>
      ) : null}
      {tenant.whatsapp ? (
        <TouchableOpacity
          style={[styles.btn, styles.whatsappBtn]}
          onPress={() => openUrl(buildWhatsAppUrl(tenant.whatsapp!))}
        >
          <Text style={styles.label}>WhatsApp</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  whatsappBtn: { backgroundColor: '#25d366' },
  label: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
