import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

export function ApprovalsScreen() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('@appvan_token');
      const response = await api.get('/admin/users', {
        params: { status: 'pending' },
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar aprovações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // 1. Função Genérica para alterar o status no banco de dados (Compatível com Web e Mobile)
  const changeUserStatus = async (userId: number, newStatus: string) => {
    try {
      const token = await AsyncStorage.getItem('@appvan_token');
      
      await api.patch(
        `/admin/users/${userId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove o aluno da lista instantaneamente
      setPendingUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      
      if (Platform.OS === 'web') {
        window.alert('Sucesso! Status do cadastro atualizado.');
      } else {
        Alert.alert('Sucesso!', 'Status do cadastro atualizado.');
      }

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      if (Platform.OS === 'web') {
        window.alert('Erro: Não foi possível alterar o status do aluno.');
      } else {
        Alert.alert('Erro', 'Não foi possível alterar o status do aluno.');
      }
    }
  };

  // 2. Botão Aprovar
  const handleApprove = (userId: number, userName: string) => {
    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm(`Deseja liberar o acesso de ${userName}?`);
      if (isConfirmed) changeUserStatus(userId, 'active');
    } else {
      Alert.alert(
        'Aprovar Cadastro',
        `Deseja liberar o acesso de ${userName}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Aprovar', onPress: () => changeUserStatus(userId, 'active') }
        ]
      );
    }
  };

  // 3. Botão Recusar
  const handleReject = (userId: number, userName: string) => {
    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm(`Deseja reprovar o acesso de ${userName}?`);
      if (isConfirmed) changeUserStatus(userId, 'blocked');
    } else {
      Alert.alert(
        'Recusar Cadastro',
        `Deseja reprovar o acesso de ${userName}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Recusar', onPress: () => changeUserStatus(userId, 'blocked'), style: 'destructive' }
        ]
      );
    }
  };

  const renderStudentCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentDetails}>{item.email} • {item.phone || 'Sem telefone'}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.btnReject]} 
          activeOpacity={0.7}
          onPress={() => handleReject(item.id, item.name)}
        >
          <Ionicons name="close" size={20} color="#DC2626" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.btnApprove]} 
          activeOpacity={0.7}
          onPress={() => handleApprove(item.id, item.name)}
        >
          <Ionicons name="checkmark" size={20} color="#16A34A" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aprovações</Text>
        <Text style={styles.headerSubtitle}>Cadastros aguardando liberação de acesso</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerArea}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : pendingUsers.length === 0 ? (
        <View style={styles.centerArea}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.placeholderText}>Nenhum cadastro pendente no momento.</Text>
        </View>
      ) : (
        <FlatList
          data={pendingUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderStudentCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  listContainer: { padding: 24, gap: 16 },
  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardInfo: { flex: 1, paddingRight: 12 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  studentDetails: { fontSize: 13, color: '#6B7280' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  btnApprove: { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  btnReject: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  placeholderText: { textAlign: 'center', color: '#9CA3AF', marginTop: 16, fontSize: 16 }
});