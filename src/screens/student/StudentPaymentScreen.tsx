import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function StudentPaymentScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pagamento</Text>
        <Text style={styles.headerSubtitle}>Mensalidades e cobranças</Text>
      </View>

      <View style={styles.contentArea}>
        <Ionicons name="qr-code-outline" size={80} color="#334155" />
        <Text style={styles.placeholderTitle}>Pagamento via PIX</Text>
        <Text style={styles.placeholderText}>
          A geração de QR Code de pagamento será liberada nas próximas atualizações.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  contentArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  placeholderTitle: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC', marginTop: 24, marginBottom: 8 },
  placeholderText: { textAlign: 'center', color: '#64748B', fontSize: 16, lineHeight: 24 }
});