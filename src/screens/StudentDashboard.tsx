import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function StudentDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Área do Aluno 🎒</Text>
      <Text style={styles.subtitle}>Aqui você confirma se vai na van hoje!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 8 }
});