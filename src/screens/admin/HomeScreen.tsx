import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  
  const [morningPassengers, setMorningPassengers] = useState(0);
  const [nightPassengers, setNightPassengers] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar os dados reais do painel separando os turnos
  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('@appvan_token');
      
      const today = new Date();
      const todayString = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      // 1. Busca os passageiros da Manhã
      const responseMorning = await api.get('/admin/admin/attendances', {
        params: { data: todayString, shift: 'morning' },
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. Busca os passageiros da Noite
      const responseNight = await api.get('/admin/admin/attendances', {
        params: { data: todayString, shift: 'night' },
        headers: { Authorization: `Bearer ${token}` }
      });

      // 3. Busca os usuários pendentes para aprovação
      const responseUsers = await api.get('/admin/users', {
        params: { status: 'pending' },
        headers: { Authorization: `Bearer ${token}` }
      });

      setMorningPassengers(responseMorning.data.total_van || 0);
      setNightPassengers(responseNight.data.total_van || 0);
      setPendingCount(responseUsers.data.length || 0);

    } catch (error) {
      console.error('Erro ao carregar dados da Home:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cabeçalho Premium com Boas-vindas */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Olá, Admin! 👋</Text>
        <Text style={styles.headerSubtitle}>Aqui está o resumo da sua van hoje.</Text>
      </View>

      {/* Cartões de Resumo (Dashboard com Divisão de Turnos) */}
      <View style={styles.statsContainer}>
        
        {/* Card Dividido: Passageiros de Hoje (Manhã e Noite) */}
        <View style={styles.statCardWide}>
          <View style={styles.statCardHeader}>
            <View style={styles.iconWrapperAmber}>
              <Ionicons name="people" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statLabelMain}>Passageiros Hoje</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color="#F59E0B" style={{ marginVertical: 12 }} />
          ) : (
            <View style={styles.shiftsRow}>
              <View style={styles.shiftCol}>
                <Ionicons name="sunny" size={16} color="#F59E0B" />
                <Text style={styles.shiftValue}>{morningPassengers}</Text>
                <Text style={styles.shiftLabel}>Manhã</Text>
              </View>
              <View style={styles.shiftDivider} />
              <View style={styles.shiftCol}>
                {/* Usando um tom de azul claro/índigo que combina bem com o Dark Mode para a noite */}
                <Ionicons name="moon" size={16} color="#818CF8" />
                <Text style={styles.shiftValue}>{nightPassengers}</Text>
                <Text style={styles.shiftLabel}>Noite</Text>
              </View>
            </View>
          )}
        </View>

        {/* Card de Aprovações Pendentes */}
        <View style={styles.statCardSmall}>
          <View style={styles.iconWrapperAmber}>
            <Ionicons name="time" size={24} color="#F59E0B" />
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color="#F59E0B" style={{ marginVertical: 6 }} />
          ) : (
            <Text style={styles.statValue}>{pendingCount}</Text>
          )}
          <Text style={styles.statLabel}>Cadastros Pendentes</Text>
        </View>

      </View>

      {/* Ações Rápidas (Atalhos) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>

        <TouchableOpacity 
          style={styles.actionButton} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Van')}
        >
          <View style={styles.actionIconPrimary}>
            <Ionicons name="bus-outline" size={24} color="#0F172A" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Controle da Van</Text>
            <Text style={styles.actionDescription}>Ver lista de alunos do turno</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Aprovações')}
        >
          <View style={styles.actionIconSecondary}>
            <Ionicons name="lock-open-outline" size={24} color="#F59E0B" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Analisar Cadastros</Text>
            <Text style={styles.actionDescription}>Liberar acesso de novos alunos</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  
  statsContainer: { padding: 24, gap: 16 },
  
  // Cartão Principal Largo (Passageiros Divididos)
  statCardWide: { backgroundColor: '#1E293B', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  statCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  iconWrapperAmber: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(245, 158, 11, 0.15)', justifyContent: 'center', alignItems: 'center' },
  statLabelMain: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC' },
  
  shiftsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#334155' },
  shiftCol: { flex: 1, alignItems: 'center', gap: 2 },
  shiftDivider: { width: 1, height: 36, backgroundColor: '#334155' },
  shiftValue: { fontSize: 22, fontWeight: 'bold', color: '#F8FAFC' },
  shiftLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },

  // Cartão Menor (Aprovações)
  statCardSmall: { backgroundColor: '#1E293B', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 2 },
  statLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  
  section: { paddingHorizontal: 24, paddingBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 16 },
  
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  
  // Ícone Primário (Fundo Amarelo, Ícone Escuro)
  actionIconPrimary: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  
  // Ícone Secundário (Fundo Escuro, Ícone Amarelo)
  actionIconSecondary: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  
  actionTextContainer: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 2 },
  actionDescription: { fontSize: 13, color: '#94A3B8' }
});