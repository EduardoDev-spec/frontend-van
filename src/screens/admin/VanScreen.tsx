import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

export function VanScreen() {
  const [shift, setShift] = useState<'morning' | 'night'>('morning');
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');
  const [isLoading, setIsLoading] = useState(false);
  const [vanData, setVanData] = useState({
    total_van: 0,
    grupos: {
      ida_e_volta: [],
      so_ida: [],
      so_volta: []
    }
  });

  const fetchAttendances = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('@appvan_token');
      
      const targetDate = new Date();
      if (selectedDate === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1); 
      }
      
      const targetDateString = new Date(targetDate.getTime() - (targetDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      // O console.log fofoqueiro para vermos a data exata no terminal!
      console.log(`Buscando alunos para: Data=${targetDateString} | Turno=${shift}`);

      // MUDANÇA CRUCIAL AQUI: Rota corrigida para /admin/admin/attendances
      const response = await api.get('/admin/admin/attendances', {
        params: {
          data: targetDateString,
          shift: shift
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Resposta do banco:', response.data);
      setVanData(response.data);

    } catch (error) {
      console.error('Erro ao buscar a lista da van:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [shift, selectedDate]);

  const renderGroup = (title: string, students: any[], icon: any, color: string) => {
    if (students.length === 0) return null;

    return (
      <View style={styles.groupContainer}>
        <View style={styles.groupHeader}>
          <Ionicons name={icon} size={20} color={color} />
          <Text style={[styles.groupTitle, { color }]}>{title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{students.length}</Text>
          </View>
        </View>

        {students.map((student) => (
          <View key={student.id_presenca} style={styles.studentCard}>
            <View>
              <Text style={styles.studentName}>{student.aluno_nome}</Text>
              <Text style={styles.studentPhone}>📞 {student.aluno_telefone || 'Sem número'}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Controle da Van</Text>
          {!isLoading && (
             <View style={styles.totalBadge}>
               <Text style={styles.totalBadgeText}>{vanData.total_van} Pessoas</Text>
             </View>
          )}
        </View>
        <Text style={styles.headerSubtitle}>Selecione a data e o turno para carregar a lista</Text>
        
        <View style={styles.dateSelectorContainer}>
          <TouchableOpacity 
            style={[styles.dateButton, selectedDate === 'today' && styles.dateButtonActive]}
            onPress={() => setSelectedDate('today')}
            activeOpacity={0.7}
          >
            <Text style={[styles.dateText, selectedDate === 'today' && styles.dateTextActive]}>Hoje</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dateButton, selectedDate === 'tomorrow' && styles.dateButtonActive]}
            onPress={() => setSelectedDate('tomorrow')}
            activeOpacity={0.7}
          >
            <Text style={[styles.dateText, selectedDate === 'tomorrow' && styles.dateTextActive]}>Amanhã</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, shift === 'morning' && styles.toggleActiveDay]}
          onPress={() => setShift('morning')}
          activeOpacity={0.8}
        >
          <Ionicons name="sunny" size={20} color={shift === 'morning' ? '#FFF' : '#6B7280'} />
          <Text style={[styles.toggleText, shift === 'morning' && styles.textActive]}>Dia</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.toggleButton, shift === 'night' && styles.toggleActiveNight]}
          onPress={() => setShift('night')}
          activeOpacity={0.8}
        >
          <Ionicons name="moon" size={20} color={shift === 'night' ? '#FFF' : '#6B7280'} />
          <Text style={[styles.toggleText, shift === 'night' && styles.textActive]}>Noite</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : vanData.total_van === 0 ? (
        <View style={styles.contentArea}>
          <Ionicons name="bus-outline" size={64} color="#D1D5DB" />
          <Text style={styles.placeholderText}>
            Nenhum passageiro confirmado para a {shift === 'morning' ? 'manhã' : 'noite'} de {selectedDate === 'today' ? 'hoje' : 'amanhã'}.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderGroup('Ida e Volta', vanData.grupos.ida_e_volta, 'swap-vertical', '#8B5CF6')}
          {renderGroup('Somente Ida', vanData.grupos.so_ida, 'arrow-forward', '#3B82F6')}
          {renderGroup('Somente Volta', vanData.grupos.so_volta, 'arrow-back', '#F59E0B')}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  totalBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  totalBadgeText: { color: '#2563EB', fontWeight: 'bold', fontSize: 14 },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 16 },
  dateSelectorContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 },
  dateButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  dateButtonActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  dateText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  dateTextActive: { color: '#111827' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', marginHorizontal: 24, marginTop: 16, marginBottom: 8, borderRadius: 12, padding: 4 },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
  toggleActiveDay: { backgroundColor: '#F59E0B', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  toggleActiveNight: { backgroundColor: '#312E81', shadowColor: '#312E81', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  toggleText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  textActive: { color: '#FFFFFF' },
  loadingArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  placeholderText: { textAlign: 'center', color: '#9CA3AF', marginTop: 16, fontSize: 16, lineHeight: 24 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 },
  groupContainer: { marginBottom: 24 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  groupTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  badge: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#4B5563' },
  studentCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  studentPhone: { fontSize: 14, color: '#6B7280' }
});