import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, LogOut, Mail, ShieldCheck, Sun, Moon, Smartphone } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { APP_ID } from '../config/appConfig';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const ProfileScreen = ({ navigation }) => {
  const { user, signOut, resendEmailVerification, deleteAccount, loading: authLoading } = useAuth();
  const { themeMode, setTheme, tokens } = useTheme();
  const [itemsCount, setItemsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const path = `artifacts/${APP_ID}/users/${user.uid}/items`;
    firestore().collection(path).get().then(s => {
      setItemsCount(s.size);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      'Conferma Logout',
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Alert.alert('Errore', result.error);
            }
          }
        }
      ]
    );
  };

  const handleResendVerification = async () => {
    const result = await resendEmailVerification();
    if (result.success) {
      Alert.alert('Successo', result.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Errore', result.error);
    }
  };

  const handleThemeChange = () => {
    const themes = ['dark', 'light', 'auto'];
    const currentIndex = themes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    setTheme(nextTheme);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light': return 'Chiaro';
      case 'dark': return 'Scuro';
      case 'auto': return 'Auto';
      default: return 'Scuro';
    }
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'auto': return Smartphone;
      default: return Moon;
    }
  };

  const ThemeIcon = getThemeIcon();

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Elimina Account',
      'Questa azione è IRREVERSIBILE. Verranno eliminati:\n\n• Tutti i tuoi capi\n• Tutte le foto\n• I dati del profilo\n• L\'account Firebase\n\nSei assolutamente sicuro?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina Definitivamente',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        }
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Conferma Finale',
      'Digita "ELIMINA" per confermare',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Conferma',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAccount();
            if (result.success) {
              Alert.alert('✓ Account Eliminato', result.message);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Alert.alert('Errore', result.error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.colors.background }]}>
      <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <View style={[styles.header, { backgroundColor: tokens.colors.surface, borderBottomColor: tokens.colors.border }]}>
          <Text style={[styles.headerTitle, { color: tokens.colors.textPrimary }]}>Profilo</Text>
        </View>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.userCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
            <View style={[styles.avatarContainer, { backgroundColor: tokens.colors.accent }]}>
              <User size={40} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={[styles.userName, { color: tokens.colors.textPrimary }]}>
              {user?.displayName || user?.email?.split('@')[0] || 'Utente'}
            </Text>
            <View style={styles.emailContainer}>
              <Mail size={14} color={tokens.colors.textSecondary} />
              <Text style={[styles.userEmail, { color: tokens.colors.textSecondary }]}>{user?.email || 'user@example.com'}</Text>
            </View>
            
            {user && !user.emailVerified && (
              <TouchableOpacity 
                style={styles.verificationBanner}
                onPress={handleResendVerification}
                disabled={authLoading}
              >
                <ShieldCheck size={16} color="#F59E0B" />
                <Text style={styles.verificationText}>
                  Email non verificata - Tap per inviare email
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.statsCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>Statistiche</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: tokens.colors.accent }]}>{loading ? '...' : itemsCount}</Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textSecondary }]}>Capi</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: tokens.colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: tokens.colors.accent }]}>0</Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textSecondary }]}>Outfit</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: tokens.colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: tokens.colors.accent }]}>0</Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textSecondary }]}>Look</Text>
              </View>
            </View>
          </View>

          <View style={[styles.settingsCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>Impostazioni</Text>
            
            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomColor: tokens.colors.border }]} 
              onPress={handleThemeChange}
            >
              <View style={styles.settingLeft}>
                <ThemeIcon size={20} color={tokens.colors.accent} strokeWidth={2} />
                <Text style={[styles.settingText, { color: tokens.colors.textPrimary }]}>Tema</Text>
              </View>
              <Text style={[styles.settingValue, { color: tokens.colors.textMuted }]}>{getThemeLabel()}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: tokens.colors.border }]}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>🔔</Text>
                <Text style={[styles.settingText, { color: tokens.colors.textPrimary }]}>Notifiche</Text>
              </View>
              <Text style={[styles.settingValue, { color: tokens.colors.textMuted }]}>Abilitate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>📱</Text>
                <Text style={[styles.settingText, { color: tokens.colors.textPrimary }]}>Feedback Tattile</Text>
              </View>
              <Text style={[styles.settingValue, { color: tokens.colors.textMuted }]}>Attivo</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: tokens.colors.error }]} 
            onPress={handleLogout}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <LogOut size={20} color="#FFF" />
                <Text style={styles.logoutText}>Esci dall'Account</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.deleteButton, { borderColor: tokens.colors.error }]} 
            onPress={handleDeleteAccount}
            disabled={authLoading}
          >
            <Text style={[styles.deleteButtonText, { color: tokens.colors.error }]}>
              Elimina Account (GDPR)
            </Text>
          </TouchableOpacity>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { flex: 1, paddingHorizontal: 20 },
  userCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 20, borderWidth: 1 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  userName: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emailContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userEmail: { fontSize: 14 },
  verificationBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#FEF3C7', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 8, 
    marginTop: 12 
  },
  verificationText: { fontSize: 12, color: '#92400E', fontWeight: '500' },
  statsCard: { borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { width: 1, height: 40 },
  settingsCard: { borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { fontSize: 20 },
  settingText: { fontSize: 15, fontWeight: '500' },
  settingValue: { fontSize: 13 },
  logoutButton: { 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center', 
    marginTop: 24, 
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  logoutText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  deleteButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProfileScreen;
