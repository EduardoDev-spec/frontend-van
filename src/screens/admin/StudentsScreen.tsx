import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { useNavigation } from '@react-navigation/native';

export function StudentsScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'pending' | 'blocked'>('all');

  // Estados do Modal e do fluxo de exclusão/bloqueio
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 
  const [deleteConfirmText, setDeleteConfirmText] = useState(''); 

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('@appvan_token');
      const response = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Erro ao buscar a lista de alunos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Função para alternar o status (Bloquear ou Ativar)
  const changeUserStatus = async (userId: number, newStatus: string) => {
    try {
      const token = await AsyncStorage.getItem('@appvan_token');
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStudents(prev => prev.map(s => s.id === userId ? { ...s, status: newStatus } : s));
      setSelectedStudent((prev: any) => ({ ...prev, status: newStatus }));
      
      if (Platform.OS === 'web') {
        window.alert('Status atualizado com sucesso!');
      } else {
        Alert.alert('Sucesso', 'Status atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const countAll = students.length;
  const countActive = students.filter(s => s.status === 'active').length;
  const countPending = students.filter(s => s.status === 'pending').length;
  const countBlocked = students.filter(s => s.status === 'blocked').length;

  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && student.status === selectedFilter;
  });

  const handleCardPress = (student: any) => {
    if (student.status === 'pending') {
      navigation.navigate('Aprovações');
      return;
    }
    setSelectedStudent(student);
    setShowDeleteConfirm(false); // Reseta o estado de exclusão ao abrir
    setDeleteConfirmText('');
    setModalVisible(true);
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmText !== 'DELETAR') return;

    try {
      const token = await AsyncStorage.getItem('@appvan_token');
      
      await api.delete(`/admin/users/${selectedStudent.id}/deleted`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
      setModalVisible(false);

      if (Platform.OS === 'web') {
        window.alert('Sucesso! O usuário foi deletado.');
      } else {
        Alert.alert('Sucesso', 'O usuário foi deletado.');
      }

    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      const errorMessage = error.response?.data?.detail || 'Não foi possível deletar o usuário.';
      
      if (Platform.OS === 'web') {
        window.alert(`Erro: ${errorMessage}`);
      } else {
        Alert.alert('Erro', errorMessage);
      }
    }
  };

  const renderStudentCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7}
      onPress={() => handleCardPress(item)}
    >
      <View style={styles.avatarContainer}>
        <Ionicons name="person" size={20} color="#2563EB" />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentDetails}>{item.email} • {item.phone || 'Sem telefone'}</Text>
      </View>
      <View style={[
        styles.statusBadge, 
        item.status === 'active' && styles.badgeActive,
        item.status === 'pending' && styles.badgePending,
        item.status === 'blocked' && styles.badgeBlocked
      ]}>
        <Text style={[
          styles.statusText, 
          item.status === 'active' && styles.textActive,
          item.status === 'pending' && styles.textPending,
          item.status === 'blocked' && styles.textBlocked
        ]}>
          {item.status === 'active' ? 'Ativo' : item.status === 'pending' ? 'Pendente' : 'Bloqueado'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alunos</Text>
        <Text style={styles.headerSubtitle}>Gerencie todos os passageiros da van</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar aluno por nome ou email..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity 
          style={[styles.filterChip, selectedFilter === 'all' && styles.chipActive]} 
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.chipText, selectedFilter === 'all' && styles.chipTextActive]}>Todos ({countAll})</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterChip, selectedFilter === 'active' && styles.chipActive]} 
          onPress={() => setSelectedFilter('active')}
        >
          <Text style={[styles.chipText, selectedFilter === 'active' && styles.chipTextActive]}>Ativos ({countActive})</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterChip, selectedFilter === 'pending' && styles.chipActive]} 
          onPress={() => setSelectedFilter('pending')}
        >
          <Text style={[styles.chipText, selectedFilter === 'pending' && styles.chipTextActive]}>Pendentes ({countPending})</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterChip, selectedFilter === 'blocked' && styles.chipActive]} 
          onPress={() => setSelectedFilter('blocked')}
        >
          <Text style={[styles.chipText, selectedFilter === 'blocked' && styles.chipTextActive]}>Bloqueados ({countBlocked})</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerArea}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : filteredStudents.length === 0 ? (
        <View style={styles.centerArea}>
          <Ionicons name="people-outline" size={64} color="#D1D5DB" />
          <Text style={styles.placeholderText}>Nenhum aluno encontrado para este filtro.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderStudentCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* MODAL DE FICHA COMPLETA */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* 1. INFORMAÇÕES DO ALUNO (TOPO) */}
            <View style={styles.modalHeader}>
              <View style={styles.modalAvatarLarge}>
                <Ionicons name="person" size={32} color="#2563EB" />
              </View>
              <Text style={styles.modalTitle}>{selectedStudent?.name}</Text>
              <Text style={styles.modalSubtitle}>ID do Passageiro: #{selectedStudent?.id}</Text>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>E-mail:</Text>
                <Text style={styles.infoValue}>{selectedStudent?.email || 'Não informado'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>Telefone:</Text>
                <Text style={styles.infoValue}>{selectedStudent?.phone || 'Não informado'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="shield-outline" size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={[styles.infoValue, { fontWeight: 'bold', color: selectedStudent?.status === 'active' ? '#16A34A' : '#DC2626' }]}>
                  {selectedStudent?.status?.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* 2. BOTÃO DE BLOQUEAR / REATIVAR ACESSO (DESTAQUE) */}
            {selectedStudent?.status !== 'pending' && (
              <TouchableOpacity 
                style={[styles.blockButton, { backgroundColor: selectedStudent?.status === 'active' ? '#F59E0B' : '#16A34A' }]}
                activeOpacity={0.8}
                onPress={() => changeUserStatus(selectedStudent.id, selectedStudent?.status === 'active' ? 'blocked' : 'active')}
              >
                <Ionicons name={selectedStudent?.status === 'active' ? "pause-circle" : "play-circle"} size={20} color="#FFF" />
                <Text style={styles.blockButtonText}>
                  {selectedStudent?.status === 'active' ? 'Bloquear Acesso' : 'Reativar Acesso'}
                </Text>
              </TouchableOpacity>
            )}

            {/* 3. BOTÃO DE FECHAR FICHA */}
            <TouchableOpacity 
              style={styles.closeButton}
              activeOpacity={0.8}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fechar Ficha</Text>
            </TouchableOpacity>

            {/* 4. EXCLUIR FICHA (DISCRETO E POR ÚLTIMO) */}
            {!showDeleteConfirm ? (
              <View style={styles.discreteDeleteContainer}>
                <TouchableOpacity onPress={() => setShowDeleteConfirm(true)} activeOpacity={0.7}>
                  <Text style={styles.discreteDeleteText}>Excluir usuário permanentemente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.deleteSection}>
                <Text style={styles.deleteInstruction}>
                  Digite <Text style={{fontWeight: 'bold', color: '#DC2626'}}>DELETAR</Text> para confirmar:
                </Text>
                <TextInput
                  style={styles.deleteInput}
                  placeholder="DELETAR"
                  placeholderTextColor="#9CA3AF"
                  value={deleteConfirmText}
                  onChangeText={setDeleteConfirmText}
                  autoCapitalize="characters"
                />
                <View style={styles.deleteActionRow}>
                  <TouchableOpacity 
                    style={styles.cancelDeleteButton} 
                    onPress={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                  >
                    <Text style={styles.cancelDeleteText}>Voltar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.deleteButton, deleteConfirmText !== 'DELETAR' && styles.buttonDisabled]}
                    disabled={deleteConfirmText !== 'DELETAR'}
                    activeOpacity={0.8}
                    onPress={handleDeleteUser}
                  >
                    <Text style={styles.deleteButtonText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 24, marginTop: 24, marginBottom: 12, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#111827' },

  filterRow: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 16, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#2563EB' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  chipTextActive: { color: '#FFFFFF' },
  
  listContainer: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1, paddingRight: 8 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 },
  studentDetails: { fontSize: 13, color: '#6B7280' },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeActive: { backgroundColor: '#F0FDF4' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeBlocked: { backgroundColor: '#FEF2F2' },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  textActive: { color: '#16A34A' },
  textPending: { color: '#D97706' },
  textBlocked: { color: '#DC2626' },
  
  placeholderText: { textAlign: 'center', color: '#9CA3AF', marginTop: 16, fontSize: 16, lineHeight: 24 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 400, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  modalHeader: { alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 16, marginBottom: 16 },
  modalAvatarLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  modalSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  modalBody: { gap: 12, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#4B5563', width: 65 },
  infoValue: { fontSize: 14, color: '#1F2937', flex: 1 },

  // Botão de Bloquear / Reativar
  blockButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  blockButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  // Botão de Fechar Ficha
  closeButton: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  closeButtonText: { color: '#4B5563', fontSize: 14, fontWeight: 'bold' },

  // Exclusão Discreta e Segura por Último
  discreteDeleteContainer: { alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  discreteDeleteText: { color: '#DC2626', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },

  deleteSection: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16, borderWidth: 1, borderColor: '#FCA5A5' },
  deleteInstruction: { fontSize: 12, color: '#991B1B', marginBottom: 8, textAlign: 'center' },
  deleteInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F87171', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, textAlign: 'center', marginBottom: 8, color: '#991B1B', fontWeight: 'bold' },
  deleteActionRow: { flexDirection: 'row', gap: 8 },
  cancelDeleteButton: { flex: 1, backgroundColor: '#E5E7EB', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  cancelDeleteText: { color: '#4B5563', fontSize: 13, fontWeight: 'bold' },
  deleteButton: { flex: 1, backgroundColor: '#DC2626', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#FCA5A5' },
  deleteButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' }
});