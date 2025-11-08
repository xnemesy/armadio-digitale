import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, LogOut, Mail, ShieldCheck } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { APP_ID } from '../config/appConfig';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, signOut, resendEmailVerification, loading: authLoading } = useAuth();
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profilo</Text>
        </View>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <User size={40} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={styles.userName}>
              {user?.displayName || user?.email?.split('@')[0] || 'Utente'}
            </Text>
            <View style={styles.emailContainer}>
              <Mail size={14} color={COLORS.textSecondary} />
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
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

          <View style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Statistiche</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{loading ? '...' : itemsCount}</Text>
                <Text style={styles.statLabel}>Capi</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Outfit</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Look</Text>
              </View>
            </View>
          </View>

          <View style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>Impostazioni</Text>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingIcon}>🌙</Text>
              <Text style={styles.settingText}>Tema Scuro</Text>
              <Text style={styles.settingValue}>Attivo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingIcon}>🔔</Text>
              <Text style={styles.settingText}>Notifiche</Text>
              <Text style={styles.settingValue}>Abilitate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingIcon}>📱</Text>
              <Text style={styles.settingText}>Feedback Tattile</Text>
              <Text style={styles.settingValue}>Attivo</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.logoutButton} 
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
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  scrollContent: { flex: 1, paddingHorizontal: 20 },
  userCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: COLORS.border },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  userName: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emailContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userEmail: { fontSize: 14, color: COLORS.textSecondary },
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
  statsCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { width: 1, height: 40, backgroundColor: COLORS.border },
  settingsCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1, borderColor: COLORS.border },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingIcon: { fontSize: 20, marginRight: 12 },
  settingText: { flex: 1, fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  settingValue: { fontSize: 13, color: COLORS.textMuted },
  logoutButton: { 
    backgroundColor: COLORS.error, 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center', 
    marginTop: 24, 
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  logoutText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default ProfileScreen;
