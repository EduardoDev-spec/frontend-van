import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api'; 

const generateNextDays = () => {
  const days = [];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push({
      fullDate: date.toISOString().split('T')[0],
      dayName: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : dayNames[date.getDay()],
      dayNumber: date.getDate().toString().padStart(2, '0')
    });
  }
  return days;
};

const TRIP_OPTIONS = [
  { id: 'ida_e_volta', label: 'Ida e Volta', icon: 'swap-vertical', color: '#8B5CF6' },
  { id: 'so_ida', label: 'Só Ida', icon: 'arrow-forward', color: '#3B82F6' },
  { id: 'so_volta', label: 'Só Volta', icon: 'arrow-back', color: '#F59E0B' },
] as const;

type TripType = 'ida_e_volta' | 'so_ida' | 'so_volta' | null;

interface SavedSchedule {
  shift: 'morning' | 'night';
  tripType: TripType;
}

export function StudentScheduleScreen() {
  const [availableDays, setAvailableDays] = useState(generateNextDays());
  const [selectedDate, setSelectedDate] = useState(availableDays[0].fullDate);
  
  const [shift, setShift] = useState<'morning' | 'night'>('morning');
  const [schedulesMap, setSchedulesMap] = useState<Record<string, SavedSchedule>>({});
  
  const [tripType, setTripType] = useState<TripType>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // BUSCA OS AGENDAMENTOS DO BANCO ASSIM QUE A TELA É ABERTA
  useEffect(() => {
    const loadSavedAttendances = async () => {
      try {
        const token = await AsyncStorage.getItem('@appvan_token');
        if (!token) return;

        const response = await api.get('/users/attendances', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const map: Record<string, SavedSchedule> = {};
        response.data.forEach((item: any) => {
          // Normaliza o formato da data caso venha com horário (ex: "2026-08-20T00:00:00")
          const dateString = item.date ? item.date.split('T')[0] : item.data;
          if (dateString) {
            map[dateString] = { 
              shift: item.shift, 
              tripType: item.transport_mode 
            };
          }
        });
        
        setSchedulesMap(map);
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
      }
    };

    loadSavedAttendances();
  }, []);

  // SINCRONIZA O DIA SELECIONADO COM O MAPA DE AGENDAMENTOS
  useEffect(() => {
    const saved = schedulesMap[selectedDate];
    if (saved) {
      setShift(saved.shift);
      setTripType(saved.tripType);
    } else {
      setTripType(null);
    }
    setIsDropdownOpen(false);
  }, [selectedDate, schedulesMap]);

  const handleSaveSchedule = async (isUpdate = false) => {
    if (!tripType) {
      if (Platform.OS === 'web') window.alert('Selecione uma opção de viagem primeiro!');
      else Alert.alert('Atenção', 'Selecione uma opção de viagem primeiro!');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('@appvan_token');
      if (!token) throw new Error("Token não encontrado");

      await api.post('/users/attendances', {
        data: selectedDate,
        shift: shift,
        is_confirmed: true, 
        transport_mode: tripType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsSubmitting(false);

      setSchedulesMap(prev => ({
        ...prev,
        [selectedDate]: { shift, tripType }
      }));

      setIsDropdownOpen(false);
      
      const msg = isUpdate ? 'Agendamento modificado com sucesso!' : 'Agendamento salvo com sucesso!';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Sucesso', msg);
      }

    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error.response?.data || error.message);
      setIsSubmitting(false);
      
      if (Platform.OS === 'web') {
        window.alert('Erro ao processar agendamento. Tente novamente.');
      } else {
        Alert.alert('Erro', 'Não foi possível processar o agendamento.');
      }
    }
  };

  const executeCancel = async () => {
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('@appvan_token');
      if (!token) throw new Error("Token não encontrado");

      await api.delete(`/users/attendances/${selectedDate}/deleted`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsSubmitting(false);

      setSchedulesMap(prev => {
        const copy = { ...prev };
        delete copy[selectedDate];
        return copy;
      });

      setTripType(null);
      
      if (Platform.OS === 'web') {
        window.alert('Agendamento cancelado com sucesso.');
      } else {
        Alert.alert('Cancelado', 'Seu agendamento foi removido da van.');
      }

    } catch (error: any) {
      setIsSubmitting(false);
      console.error('Erro ao deletar:', error.response?.data || error.message);
      
      if (Platform.OS === 'web') {
        window.alert('Erro ao cancelar agendamento.');
      } else {
        Alert.alert('Erro', 'Não foi possível cancelar o agendamento.');
      }
    }
  };

  const handleCancel = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Deseja mesmo cancelar este agendamento? Sua vaga será liberada.');
      if (confirm) executeCancel();
    } else {
      Alert.alert(
        'Cancelar Viagem',
        'Deseja mesmo cancelar este agendamento? Sua vaga será liberada.',
        [
          { text: 'Não', style: 'cancel' },
          { text: 'Sim, cancelar', style: 'destructive', onPress: executeCancel }
        ]
      );
    }
  };

  const currentSchedule = schedulesMap[selectedDate];
  const hasExistingBooking = !!currentSchedule;

  const selectedOption = TRIP_OPTIONS.find(opt => opt.id === tripType);

  const isMorningLocked = hasExistingBooking && currentSchedule.shift === 'night';
  const isNightLocked = hasExistingBooking && currentSchedule.shift === 'morning';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agendar Van</Text>
        <Text style={styles.headerSubtitle}>Programe suas viagens da semana</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. SELETOR DE DATA */}
        <Text style={styles.sectionLabel}>Escolha o dia</Text>
        <View style={styles.dateSelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
            {availableDays.map((day) => {
              const isActive = selectedDate === day.fullDate;
              const hasBooking = !!schedulesMap[day.fullDate];
              
              return (
                <TouchableOpacity 
                  key={day.fullDate}
                  style={[styles.dateCard, isActive && styles.dateCardActive]}
                  onPress={() => setSelectedDate(day.fullDate)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dateName, isActive && styles.dateTextActive]}>{day.dayName}</Text>
                  <Text style={[styles.dateNumber, isActive && styles.dateTextActive]}>{day.dayNumber}</Text>
                  
                  <View style={styles.indicatorsRow}>
                    {hasBooking && <View style={styles.bookedDot} />}
                    {isActive && <View style={styles.activeDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. SELETOR DE TURNO */}
        <Text style={styles.sectionLabel}>Qual o turno?</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              shift === 'morning' && styles.toggleActiveDay,
              isMorningLocked && styles.toggleLocked
            ]}
            onPress={() => {
              if (!hasExistingBooking) {
                setShift('morning');
                setIsDropdownOpen(false);
              }
            }}
            activeOpacity={0.8}
            disabled={isMorningLocked || hasExistingBooking}
          >
            <Ionicons name="sunny" size={20} color={shift === 'morning' ? '#F59E0B' : isMorningLocked ? '#334155' : '#64748B'} />
            <Text style={[styles.toggleText, shift === 'morning' && styles.textActiveDay, isMorningLocked && styles.textLocked]}>
              Manhã
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              shift === 'night' && styles.toggleActiveNight,
              isNightLocked && styles.toggleLocked
            ]}
            onPress={() => {
              if (!hasExistingBooking) {
                setShift('night');
                setIsDropdownOpen(false);
              }
            }}
            activeOpacity={0.8}
            disabled={isNightLocked || hasExistingBooking}
          >
            <Ionicons name="moon" size={20} color={shift === 'night' ? '#818CF8' : isNightLocked ? '#334155' : '#64748B'} />
            <Text style={[styles.toggleText, shift === 'night' && styles.textActiveNight, isNightLocked && styles.textLocked]}>
              Noite
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. SELETOR DE OPÇÕES DE VIAGEM */}
        <Text style={styles.sectionLabel}>Opção de viagem</Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity 
            style={[styles.dropdownHeader, isDropdownOpen && styles.dropdownHeaderOpen]}
            activeOpacity={0.8}
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedOption ? (
              <View style={styles.dropdownHeaderContent}>
                <Ionicons name={selectedOption.icon as any} size={20} color={selectedOption.color} style={{ marginRight: 10 }} />
                <Text style={styles.dropdownSelectedText}>{selectedOption.label}</Text>
              </View>
            ) : (
              <Text style={styles.dropdownPlaceholder}>Selecione uma opção...</Text>
            )}
            <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={styles.dropdownList}>
              {TRIP_OPTIONS.map((option, index) => {
                const isSelected = tripType === option.id;
                const isLastItem = index === TRIP_OPTIONS.length - 1;
                
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.dropdownItem, !isLastItem && styles.dropdownItemBorder]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setTripType(option.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Ionicons name={option.icon as any} size={20} color={option.color} style={{ marginRight: 12 }} />
                    <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#34D399" style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 4. BOTÕES DE AÇÃO */}
        <TouchableOpacity 
          style={[styles.saveButton, !tripType && styles.saveButtonDisabled]} 
          onPress={() => handleSaveSchedule(hasExistingBooking)}
          disabled={!tripType || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0F172A" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={tripType ? "#0F172A" : "#64748B"} style={{ marginRight: 8 }} />
              <Text style={[styles.saveButtonText, !tripType && styles.saveButtonTextDisabled]}>
                {hasExistingBooking ? 'Modificar Viagem' : 'Confirmar Agendamento'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* BOTÃO DE CANCELAR */}
        {hasExistingBooking && (
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancel}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.cancelButtonText}>Cancelar Viagem</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  
  scrollContent: { padding: 24, paddingBottom: 40 },
  sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 12, marginTop: 8 },

  dateSelectorContainer: { marginBottom: 24 },
  dateScroll: { gap: 12, paddingRight: 24 },
  dateCard: { width: 64, height: 80, backgroundColor: '#1E293B', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  dateCardActive: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' },
  dateName: { fontSize: 12, color: '#94A3B8', marginBottom: 4, fontWeight: '600' },
  dateNumber: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC' },
  dateTextActive: { color: '#F59E0B' },
  
  indicatorsRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  activeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#F59E0B' },
  bookedDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#34D399' },

  toggleContainer: { flexDirection: 'row', backgroundColor: '#1E293B', marginBottom: 32, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#334155' },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8, borderWidth: 1, borderColor: 'transparent' },
  toggleActiveDay: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' },
  toggleActiveNight: { backgroundColor: 'rgba(129, 140, 248, 0.15)', borderColor: '#818CF8' },
  
  toggleLocked: { backgroundColor: 'transparent', borderColor: 'transparent', opacity: 0.5 },
  textLocked: { color: '#334155', textDecorationLine: 'line-through' },
  
  toggleText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
  textActiveDay: { color: '#F59E0B' },
  textActiveNight: { color: '#818CF8' },

  dropdownContainer: { marginBottom: 32, zIndex: 10 },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 18, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  dropdownHeaderOpen: { borderColor: '#F59E0B', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  dropdownHeaderContent: { flexDirection: 'row', alignItems: 'center' },
  dropdownSelectedText: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC' },
  dropdownPlaceholder: { fontSize: 16, color: '#94A3B8' },
  
  dropdownList: { backgroundColor: '#1E293B', borderWidth: 1, borderTopWidth: 0, borderColor: '#F59E0B', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  dropdownItemBorder: { borderBottomWidth: 1, borderBottomColor: '#334155' },
  dropdownItemText: { fontSize: 16, color: '#64748B', fontWeight: '500' },
  dropdownItemTextSelected: { color: '#F8FAFC', fontWeight: 'bold' },

  saveButton: { flexDirection: 'row', backgroundColor: '#F59E0B', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonDisabled: { backgroundColor: '#1E293B', shadowOpacity: 0, borderWidth: 1, borderColor: '#334155' },
  saveButtonText: { color: '#0F172A', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  saveButtonTextDisabled: { color: '#64748B' },

  cancelButton: { flexDirection: 'row', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  cancelButtonText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
});