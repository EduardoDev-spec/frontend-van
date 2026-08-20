import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Easing
} from 'react-native';
import { api } from '../services/api'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';
import { Ionicons } from '@expo/vector-icons';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const navigation = useNavigation<any>();

  // --- LÓGICA DA ANIMAÇÃO 2D ---
  const vanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const driveCycle = Animated.sequence([
      // 1. Reset: Van fora da tela à esquerda
      Animated.timing(vanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      // 2. Movimento: Dirige até a Casa
      Animated.timing(vanAnim, { toValue: 30, duration: 1200, easing: Easing.linear, useNativeDriver: true }),
      // 3. Pausa: Aguarda o embarque
      Animated.delay(1000),
      // 4. Movimento: Dirige até a Escola
      Animated.timing(vanAnim, { toValue: 70, duration: 1800, easing: Easing.linear, useNativeDriver: true }),
      // 5. Pausa: Desembarque
      Animated.delay(1000),
      // 6. Movimento: Sai de fininho pela direita
      Animated.timing(vanAnim, { toValue: 100, duration: 1200, easing: Easing.linear, useNativeDriver: true }),
      // 7. Respiro antes de recomeçar
      Animated.delay(500)
    ]);

    // Inicia o loop infinito
    Animated.loop(driveCycle).start();
  }, [vanAnim]);

  // Interpolação para mapear a porcentagem da animação (0 a 100) para coordenadas reais de translação (X)
  const vanTranslateX = vanAnim.interpolate({
    inputRange: [0, 30, 70, 100],
    outputRange: [-50, 60, 200, 330] // Posições X exatas na pista
  });
  // -----------------------------

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha email e senha!');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/token', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const token = response.data.access_token;
      await AsyncStorage.setItem('@appvan_token', token);
      
      const decodedToken = jwtDecode<any>(token);
      
      if (decodedToken.role === 'admin') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('StudentDashboard');
      }

    } catch (error) {
      Alert.alert('Falha no Login', 'Email ou senha incorretos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* BACKGROUND COM MARCA D'ÁGUA DE VAN */}
      <View style={styles.watermarkContainer}>
        <Ionicons name="bus" size={400} color="#F59E0B" />
      </View>

      <View style={styles.content}>
        
        {/* LOGO E TÍTULO */}
        <View style={styles.logoContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name="bus" size={48} color="#0F172A" />
          </View>
          <Text style={styles.title}>
            App<Text style={styles.titleHighlight}>Van</Text>
          </Text>
          <Text style={styles.subtitle}>Gestão inteligente de passageiros</Text>
        </View>

        {/* CENA DA ANIMAÇÃO 2D (A Pista) */}
        <View style={styles.animationTrack}>
          {/* A Linha da Estrada */}
          <View style={styles.roadLine} />
          
          {/* Waypoint 1: Casa */}
          <View style={[styles.stopPoint, { left: 60 }]}>
            <Ionicons name="home" size={20} color="#475569" />
          </View>
          
          {/* Waypoint 2: Escola */}
          <View style={[styles.stopPoint, { left: 200 }]}>
            <Ionicons name="school" size={22} color="#475569" />
          </View>

          {/* O Ator: EMOJI DA VAN ANIMADA (com scaleX: -1 para inverter a direção) */}
          <Animated.View style={[styles.vanWrapper, { transform: [{ translateX: vanTranslateX }, { scaleX: -1 }] }]}>
            <Text style={styles.vanEmoji}>🚐</Text>
          </Animated.View>
        </View>

        {/* FORMULÁRIO COM INPUTS MODERNOS */}
        <View style={styles.formContainer}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <View style={[styles.inputWrapper, isEmailFocused && styles.inputWrapperFocused]}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={isEmailFocused ? "#F59E0B" : "#64748B"} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={[styles.inputWrapper, isPasswordFocused && styles.inputWrapperFocused]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={isPasswordFocused ? "#F59E0B" : "#64748B"} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="Sua senha secreta"
                placeholderTextColor="#475569"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={isPasswordFocused ? "#F59E0B" : "#64748B"} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F172A" size="small" />
            ) : (
              <Text style={styles.buttonText}>Entrar no sistema</Text>
            )}
          </TouchableOpacity>
          
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0F172A'
  },
  watermarkContainer: { 
    position: 'absolute', 
    top: -40, 
    right: -120, 
    opacity: 0.04, 
    transform: [{ rotate: '-15deg' }] 
  },
  content: { 
    flex: 1, 
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'web' ? 80 : 100,
    paddingHorizontal: 32, 
    zIndex: 1 
  },
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 32 
  },
  iconBackground: { 
    width: 88, 
    height: 88, 
    borderRadius: 28, 
    backgroundColor: '#F59E0B', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16, 
    transform: [{ rotate: '-5deg' }], 
    shadowColor: '#F59E0B', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 16, 
    elevation: 10 
  },
  title: { 
    fontSize: 36, 
    fontWeight: '900', 
    color: '#F8FAFC', 
    letterSpacing: -1 
  },
  titleHighlight: { 
    color: '#F59E0B' 
  },
  subtitle: { 
    fontSize: 15, 
    color: '#94A3B8', 
    marginTop: 4, 
    fontWeight: '500' 
  },

  // ESTILOS DA CENA ANIMADA
  animationTrack: {
    width: 280,
    height: 40,
    alignSelf: 'center',
    marginBottom: 40, 
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  roadLine: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 2,
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  stopPoint: {
    position: 'absolute',
    bottom: 4, 
  },
  vanWrapper: {
    position: 'absolute',
    bottom: 1,
  },
  vanEmoji: {
    fontSize: 26, 
  },

  formContainer: { 
    width: '100%' 
  },
  inputGroup: { 
    marginBottom: 18 
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#CBD5E1', 
    marginBottom: 8, 
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1E293B', 
    borderWidth: 1.5, 
    borderColor: '#334155', 
    borderRadius: 16, 
    height: 58, 
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  inputWrapperFocused: {
    borderColor: '#F59E0B', 
    backgroundColor: '#172033', 
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  inputIcon: { 
    marginRight: 12 
  },
  input: { 
    flex: 1, 
    color: '#F8FAFC', 
    fontSize: 16, 
    height: '100%',
    outlineStyle: 'none' as any
  },
  eyeIcon: { 
    padding: 8 
  },
  button: { 
    backgroundColor: '#F59E0B', 
    height: 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 12, 
    shadowColor: '#F59E0B', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 4 
  },
  buttonDisabled: { 
    backgroundColor: '#B45309' 
  },
  buttonText: { 
    color: '#0F172A', 
    fontSize: 16, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
});