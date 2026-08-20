import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView,
  Modal,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api'; 
import { useNavigation } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';

interface ScheduleType {
  type: 'ida_e_volta' | 'so_ida' | 'so_volta';
  time: string;
}

export function StudentHomeScreen() {
  const navigation = useNavigation<any>();
  
  const [userName, setUserName] = useState('Carregando...');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [morningSchedule, setMorningSchedule] = useState<ScheduleType | null>(null);
  const [nightSchedule, setNightSchedule] = useState<ScheduleType | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('@appvan_token');
      if (!token) throw new Error("Nenhum token encontrado");

      // BATENDO NA API EXATAMENTE COMO NO SWAGGER
      const response = await api.get('/users/me', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log("Dados do Banco:", response.data);

      let nomeReal = response.data.name;

      // TRAVA DE SEGURANÇA: Se o banco mandar o email no nome, a gente corta!
      if (nomeReal && nomeReal.includes('@')) {
        nomeReal = nomeReal.split('@')[0]; // "edu@gmail.com" vira "edu"
        nomeReal = nomeReal.charAt(0).toUpperCase() + nomeReal.slice(1); // "edu" vira "Edu"
      }

      setUserName(nomeReal || 'Aluno');
      setUserEmail(response.data.email);

    } catch (error: any) {
      console.error('ALERTA: A rota /users/me falhou. Motivo:', error.response?.data || error.message);
      
      // Fallback de segurança caso a API caia
      try {
        const token = await AsyncStorage.getItem('@appvan_token');
        if (token) {
          const decodedToken = jwtDecode<any>(token);
          let fallbackName = decodedToken.name || decodedToken.sub || 'Aluno';
          
          // Aplica o mesmo truque no fallback
          if (fallbackName.includes('@')) {
            fallbackName = fallbackName.split('@')[0];
            fallbackName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
          }
          
          setUserName(fallbackName);
          setUserEmail(decodedToken.email || '');
        }
      } catch (e) {
        setUserName('Erro na conexão');
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsProfileModalOpen(false);
    await AsyncStorage.removeItem('@appvan_token');
    navigation.replace('Login');
  };

  const handleEditProfile = () => {
    setIsProfileModalOpen(false);
    if (Platform.OS === 'web') window.alert('Tela de Editar Perfil em breve!');
  };

  const getScheduleLabel = (type: string) => {
    switch(type) {
      case 'ida_e_volta': return 'Ida e Volta';
      case 'so_ida': return 'Somente Ida';
      case 'so_volta': return 'Somente Volta';
      default: return 'Confirmado';
    }
  };

  const getScheduleIcon = (type: string) => {
    switch(type) {
      case 'ida_e_volta': return 'swap-vertical';
      case 'so_ida': return 'arrow-forward';
      case 'so_volta': return 'arrow-back';
      default: return 'checkmark';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  const hasAnySchedule = morningSchedule !== null || nightSchedule !== null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* HEADER DO ALUNO */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerSubtitle}>Bem-vindo(a),</Text>
              {/* O nome tratado aparece aqui! */}
              <Text style={styles.headerTitle}>{userName}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.avatarButton} 
              activeOpacity={0.7}
              onPress={() => setIsProfileModalOpen(true)}
            >
              <Ionicons name="person" size={24} color="#F59E0B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ÁREA DE AGENDAMENTOS */}
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sua van hoje</Text>
            <Text style={styles.sectionSubtitle}>Confira os horários programados</Text>
          </View>

          {!hasAnySchedule ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="calendar-clear-outline" size={64} color="#334155" />
              <Text style={styles.emptyStateTitle}>Nenhuma viagem hoje</Text>
              <Text style={styles.emptyStateText}>
                Seus agendamentos para o dia aparecerão aqui. Use a aba "Agendar" para programar suas viagens da semana.
              </Text>
            </View>
          ) : (
            <>
              {morningSchedule && (
                <View style={styles.scheduleCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconBoxDay}>
                      <Ionicons name="sunny" size={20} color="#F59E0B" />
                    </View>
                    <Text style={styles.cardTitle}>Turno da Manhã</Text>
                  </View>
                  
                  <View style={styles.scheduleDetails}>
                    <View style={styles.statusRow}>
                      <Ionicons name={getScheduleIcon(morningSchedule.type)} size={16} color="#34D399" />
                      <Text style={styles.statusTextActive}>Confirmado: {getScheduleLabel(morningSchedule.type)}</Text>
                    </View>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={16} color="#94A3B8" />
                      <Text style={styles.timeText}>Previsão: {morningSchedule.time}</Text>
                    </View>
                  </View>
                </View>
              )}

              {nightSchedule && (
                <View style={styles.scheduleCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconBoxNight}>
                      <Ionicons name="moon" size={20} color="#818CF8" />
                    </View>
                    <Text style={styles.cardTitle}>Turno da Noite</Text>
                  </View>
                  
                  <View style={styles.scheduleDetails}>
                    <View style={styles.statusRow}>
                      <Ionicons name={getScheduleIcon(nightSchedule.type)} size={16} color="#34D399" />
                      <Text style={styles.statusTextActive}>Confirmado: {getScheduleLabel(nightSchedule.type)}</Text>
                    </View>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={16} color="#94A3B8" />
                      <Text style={styles.timeText}>Previsão: {nightSchedule.time}</Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}

        </View>
      </ScrollView>

      {/* MODAL DE PERFIL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isProfileModalOpen}
        onRequestClose={() => setIsProfileModalOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsProfileModalOpen(false)}
        >
          <View style={styles.modalContent}>
            
            <View style={styles.modalUserInfo}>
              <View style={styles.avatarLarge}>
                <Ionicons name="person" size={32} color="#F59E0B" />
              </View>
              <Text style={styles.modalUserName}>{userName}</Text>
              {userEmail ? <Text style={styles.modalUserEmail}>{userEmail}</Text> : null}
            </View>

            <TouchableOpacity style={styles.modalOption} onPress={handleEditProfile}>
              <Ionicons name="settings-outline" size={20} color="#F8FAFC" />
              <Text style={styles.modalOptionText}>Editar Perfil</Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity style={styles.modalOptionDanger} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#F87171" />
              <Text style={styles.modalOptionTextDanger}>Sair da Conta</Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  loadingContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerSubtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC' },
  
  avatarButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(245, 158, 11, 0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  
  content: { padding: 24 },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#94A3B8' },

  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#1E293B', borderRadius: 16, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' },
  emptyStateTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC', marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: '#64748B', textAlign: 'center', paddingHorizontal: 32, lineHeight: 22 },

  scheduleCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBoxDay: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(245, 158, 11, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  iconBoxNight: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(129, 140, 248, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC' },
  
  scheduleDetails: { backgroundColor: '#0F172A', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusTextActive: { color: '#34D399', fontSize: 14, fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText: { color: '#94A3B8', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-start', alignItems: 'flex-end', padding: 24, paddingTop: 100 },
  modalContent: { width: 220, backgroundColor: '#1E293B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  
  modalUserInfo: { alignItems: 'center', marginBottom: 16 },
  avatarLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(245, 158, 11, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#F59E0B' },
  modalUserName: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC', textAlign: 'center', marginBottom: 4 },
  modalUserEmail: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
  
  modalDivider: { height: 1, backgroundColor: '#334155', marginVertical: 8 },
  
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  modalOptionText: { fontSize: 14, fontWeight: '600', color: '#F8FAFC' },
  
  modalOptionDanger: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  modalOptionTextDanger: { fontSize: 14, fontWeight: 'bold', color: '#F87171' }
});