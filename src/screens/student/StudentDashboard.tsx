import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Importando as telas do aluno
import { StudentHomeScreen } from './StudentHomeScreen';
import { StudentScheduleScreen } from './StudentScheduleScreen'; // Tela de Agendamento
import { StudentPaymentScreen } from './StudentPaymentScreen'; // Tela de Pagamento

const Tab = createBottomTabNavigator();

export function StudentDashboard() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, 
        
        // --- CORES DO TEMA DARK PREMIUM ---
        tabBarActiveTintColor: '#F59E0B', // Amarelo Âmbar para a aba selecionada
        tabBarInactiveTintColor: '#64748B', // Cinza Slate para inativas
        
        tabBarStyle: {
          backgroundColor: '#0F172A', // Fundo Dark Slate
          borderTopWidth: 1,
          borderTopColor: '#1E293B',
          height: Platform.OS === 'ios' ? 80 : 65,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
        },
        
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },

        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Agendar') {
            iconName = focused ? 'calendar' : 'calendar-outline'; // Ícone de agenda
          } else if (route.name === 'Pagamento') {
            iconName = focused ? 'qr-code' : 'qr-code-outline'; // Ícone do QR Code
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={StudentHomeScreen} />
      <Tab.Screen name="Agendar" component={StudentScheduleScreen} />
      <Tab.Screen name="Pagamento" component={StudentPaymentScreen} />
    </Tab.Navigator>
  );
}