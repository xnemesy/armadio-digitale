import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { isAppleSignInSupported } from '../lib/appleAuth';
import * as Haptics from 'expo-haptics';

const LoginScreen = ({ navigation }) => {
  const { signIn, signInWithGoogle, signInWithApple, loading } = useAuth();
  const { tokens } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);

  // Check Apple Sign-In availability on mount
  useEffect(() => {
    const checkAppleAvailability = async () => {
      const isAvailable = await isAppleSignInSupported();
      setAppleSignInAvailable(isAvailable);
    };
    checkAppleAvailability();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSignIn = async () => {
    // Validation
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email richiesta';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email non valida';
    }
    if (!password) {
      newErrors.password = 'Password richiesta';
    } else if (password.length < 6) {
      newErrors.password = 'Password troppo corta (minimo 6 caratteri)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setErrors({});
    
    const result = await signIn(email, password);
    
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigation handled by AuthContext
    } else {
      Alert.alert('Errore Login', result.error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await signInWithGoogle();
    
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Errore Google Sign-In', result.error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleAppleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await signInWithApple();
    
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Errore Apple Sign-In', result.error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleForgotPassword = () => {
    if (email && validateEmail(email)) {
      navigation.navigate('ForgotPassword', { email });
    } else {
      Alert.alert('Reset Password', 'Inserisci prima la tua email nel campo sopra');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>
              Bentornato
            </Text>
            <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>
              Accedi al tuo armadio digitale
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: tokens.colors.textPrimary }]}>Email</Text>
            <View style={[
              styles.inputWrapper,
              { backgroundColor: tokens.colors.surface, borderColor: errors.email ? tokens.colors.error : tokens.colors.border }
            ]}>
              <Mail size={20} color={tokens.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: tokens.colors.textPrimary }]}
                placeholder="La tua email"
                placeholderTextColor={tokens.colors.textMuted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            {errors.email && (
              <Text style={[styles.errorText, { color: tokens.colors.error }]}>
                {errors.email}
              </Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: tokens.colors.textPrimary }]}>Password</Text>
            <View style={[
              styles.inputWrapper,
              { backgroundColor: tokens.colors.surface, borderColor: errors.password ? tokens.colors.error : tokens.colors.border }
            ]}>
              <Lock size={20} color={tokens.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: tokens.colors.textPrimary }]}
                placeholder="La tua password"
                placeholderTextColor={tokens.colors.textMuted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff size={20} color={tokens.colors.textSecondary} />
                ) : (
                  <Eye size={20} color={tokens.colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={[styles.errorText, { color: tokens.colors.error }]}>
                {errors.password}
              </Text>
            )}
          </View>

          {/* Forgot Password */}
          <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
            <Text style={[styles.forgotPassword, { color: tokens.colors.accent }]}>
              Password dimenticata?
            </Text>
          </TouchableOpacity>

          {/* Email Sign In Button */}
          <TouchableOpacity
            style={[
              styles.signInButton,
              { backgroundColor: loading ? tokens.colors.border : tokens.colors.accent }
            ]}
            onPress={handleEmailSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <LogIn size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.signInButtonText}>Accedi</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: tokens.colors.border }]} />
            <Text style={[styles.dividerText, { color: tokens.colors.textSecondary }]}>
              oppure continua con
            </Text>
            <View style={[styles.divider, { backgroundColor: tokens.colors.border }]} />
          </View>

          {/* Social Sign In Buttons */}
          <View style={styles.socialButtonsContainer}>
            {/* Google Sign In */}
            <TouchableOpacity
              style={[
                styles.socialButton,
                { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }
              ]}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.googleIcon}>🔵</Text>
              <Text style={[styles.socialButtonText, { color: tokens.colors.textPrimary }]}>
                Google
              </Text>
            </TouchableOpacity>

            {/* Apple Sign In (iOS only) */}
            {appleSignInAvailable && (
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  { backgroundColor: '#000000', borderColor: '#000000' }
                ]}
                onPress={handleAppleSignIn}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.appleIcon}>🍎</Text>
                <Text style={[styles.socialButtonText, { color: '#FFFFFF' }]}>
                  Apple
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={[styles.signUpText, { color: tokens.colors.textSecondary }]}>
              Non hai un account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              disabled={loading}
            >
              <Text style={[styles.signUpLink, { color: tokens.colors.accent }]}>
                Registrati
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 24,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    marginBottom: 24,
  },
  buttonIcon: {
    marginRight: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  googleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  appleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
