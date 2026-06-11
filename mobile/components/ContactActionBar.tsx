import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { buildCallUrl, buildEmailUrl, buildWhatsAppUrl } from '../lib/deepLinks'
import type { Tenant } from '../types'

type Props = {
  tenant: Tenant
}

export default function ContactActionBar({ tenant }: Props) {
  return (
    <View style={styles.bar}>
      {tenant.phone && (
        <TouchableOpacity
          style={styles.btn}
          onPress={() => Linking.openURL(buildCallUrl(tenant.phone!))}
          accessibilityRole="button"
          accessibilityLabel={`Call ${tenant.name}`}
        >
          <Text style={styles.label}>Call</Text>
        </TouchableOpacity>
      )}
      {tenant.email && (
        <TouchableOpacity
          style={styles.btn}
          onPress={() => Linking.openURL(buildEmailUrl(tenant.email!))}
          accessibilityRole="button"
          accessibilityLabel={`Email ${tenant.name}`}
        >
          <Text style={styles.label}>Email</Text>
        </TouchableOpacity>
      )}
      {tenant.whatsapp && (
        <TouchableOpacity
          style={styles.btn}
          onPress={() => Linking.openURL(buildWhatsAppUrl(tenant.whatsapp!))}
          accessibilityRole="button"
          accessibilityLabel={`WhatsApp ${tenant.name}`}
        >
          <Text style={styles.label}>WhatsApp</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  btn: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  label: { color: '#fff', fontWeight: '600', fontSize: 14 },
})
