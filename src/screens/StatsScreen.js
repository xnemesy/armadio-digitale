import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3 } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import { APP_ID } from '../config/appConfig';

const StatsScreen = ({ route }) => {
  const { user } = route.params || { user: { uid: 'test-user' } };
  const [stats, setStats] = useState({ totalItems: 0, byCategory: {}, byColor: {}, byBrand: {}, bySize: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
  const path = `artifacts/${APP_ID}/users/${user.uid}/items`;
    const unsub = firestore().collection(path).onSnapshot(s => {
      const items = s.docs.map(d => d.data());
      const byCategory = {}, byColor = {}, byBrand = {}, bySize = {};
      items.forEach(it => {
        byCategory[it.category] = (byCategory[it.category] || 0) + 1;
        byColor[it.mainColor] = (byColor[it.mainColor] || 0) + 1;
        if (it.brand) byBrand[it.brand] = (byBrand[it.brand] || 0) + 1;
        if (it.size) bySize[it.size] = (bySize[it.size] || 0) + 1;
      });
      setStats({ totalItems: items.length, byCategory, byColor, byBrand, bySize });
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  const renderSection = (title, data) => {
    const top = Object.entries(data).sort((a,b) => b[1]-a[1]).slice(0,5);
    if (top.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {top.map(([k,v], idx) => (
          <View key={k} style={styles.statRow}>
            <Text style={styles.statLabel}>{idx+1}. {k}</Text>
            <Text style={styles.statValue}>{v}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}><BarChart3 size={24} color={COLORS.primary} strokeWidth={2.5} /><Text style={styles.headerTitle}>Statistiche</Text></View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}><BarChart3 size={24} color={COLORS.primary} strokeWidth={2.5} /><Text style={styles.headerTitle}>Statistiche</Text></View>
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <View style={styles.totalCard}><Text style={styles.totalLabel}>Totale Capi</Text><Text style={styles.totalValue}>{stats.totalItems}</Text></View>
          {renderSection('Per Categoria', stats.byCategory)}
          {renderSection('Per Colore', stats.byColor)}
          {renderSection('Brand Più Usati', stats.byBrand)}
          {renderSection('Taglie', stats.bySize)}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  scrollContent: { flex: 1, paddingHorizontal: 20 },
  totalCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: COLORS.border },
  totalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  totalValue: { fontSize: 48, fontWeight: '800', color: COLORS.primary },
  section: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statLabel: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500', flex: 1 },
  statValue: { fontSize: 16, fontWeight: '700', color: COLORS.primary, minWidth: 40, textAlign: 'right' },
});

export default StatsScreen;
