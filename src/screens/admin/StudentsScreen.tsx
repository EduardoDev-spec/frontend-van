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
        <Ionicons name="person" size={20} color="#F59E0B" />
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
        <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar aluno por nome ou email..."
          placeholderTextColor="#475569"
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
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : filteredStudents.length === 0 ? (
        <View style={styles.centerArea}>
          <Ionicons name="people-outline" size={64} color="#334155" />
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
                <Ionicons name="person" size={32} color="#F59E0B" />
              </View>
              <Text style={styles.modalTitle}>{selectedStudent?.name}</Text>
              <Text style={styles.modalSubtitle}>ID do Passageiro: #{selectedStudent?.id}</Text>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                <Text style={styles.infoLabel}>E-mail:</Text>
                <Text style={styles.infoValue}>{selectedStudent?.email || 'Não informado'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#94A3B8" />
                <Text style={styles.infoLabel}>Telefone:</Text>
                <Text style={styles.infoValue}>{selectedStudent?.phone || 'Não informado'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="shield-outline" size={20} color="#94A3B8" />
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={[styles.infoValue, { fontWeight: 'bold', color: selectedStudent?.status === 'active' ? '#34D399' : '#F87171' }]}>
                  {selectedStudent?.status?.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* 2. BOTÃO DE BLOQUEAR / REATIVAR ACESSO (DESTAQUE) */}
            {selectedStudent?.status !== 'pending' && (
              <TouchableOpacity 
                style={[styles.blockButton, { backgroundColor: selectedStudent?.status === 'active' ? '#B45309' : '#059669' }]}
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
                  Digite <Text style={{fontWeight: 'bold', color: '#F87171'}}>DELETAR</Text> para confirmar:
                </Text>
                <TextInput
                  style={styles.deleteInput}
                  placeholder="DELETAR"
                  placeholderTextColor="#7F1D1D"
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
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', marginHorizontal: 24, marginTop: 24, marginBottom: 12, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#334155' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#F8FAFC', outlineStyle: 'none' as any },

  filterRow: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 16, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  chipActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  chipTextActive: { color: '#0F172A' },
  
  listContainer: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245, 158, 11, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1, paddingRight: 8 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 2 },
  studentDetails: { fontSize: 13, color: '#94A3B8' },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeActive: { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
  badgePending: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badgeBlocked: { backgroundColor: 'rgba(248, 113, 113, 0.15)' },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  textActive: { color: '#34D399' },
  textPending: { color: '#FBBF24' },
  textBlocked: { color: '#F87171' },
  
  placeholderText: { textAlign: 'center', color: '#64748B', marginTop: 16, fontSize: 16, lineHeight: 24 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#1E293B', width: '100%', maxWidth: 400, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10, borderWidth: 1, borderColor: '#334155' },
  modalHeader: { alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 16, marginBottom: 16 },
  modalAvatarLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(245, 158, 11, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC', textAlign: 'center' },
  modalSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  modalBody: { gap: 12, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#94A3B8', width: 65 },
  infoValue: { fontSize: 14, color: '#F8FAFC', flex: 1 },

  // Botão de Bloquear / Reativar
  blockButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  blockButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  // Botão de Fechar Ficha
  closeButton: { backgroundColor: '#334155', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  closeButtonText: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold' },

  // Exclusão Discreta e Segura por Último
  discreteDeleteContainer: { alignItems: 'center', borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 16 },
  discreteDeleteText: { color: '#EF4444', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },

  deleteSection: { backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: 12, padding: 12, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 16, borderWidth: 1, borderColor: '#7F1D1D' },
  deleteInstruction: { fontSize: 12, color: '#FCA5A5', marginBottom: 8, textAlign: 'center' },
  deleteInput: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#EF4444', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, textAlign: 'center', marginBottom: 8, color: '#F87171', fontWeight: 'bold', outlineStyle: 'none' as any },
  deleteActionRow: { flexDirection: 'row', gap: 8 },
  cancelDeleteButton: { flex: 1, backgroundColor: '#334155', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  cancelDeleteText: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold' },
  deleteButton: { flex: 1, backgroundColor: '#DC2626', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#7F1D1D' },
  deleteButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' }
});