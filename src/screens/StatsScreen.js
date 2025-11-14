import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3 } from 'lucide-react-native';
import firestore, { collection, onSnapshot } from '@react-native-firebase/firestore';
import { useTheme } from '../contexts/ThemeContext';
import { APP_ID } from '../config/appConfig';
import { SkeletonBlock } from '../components';

const StatsScreen = ({ route }) => {
  const { user } = route.params || { user: { uid: 'test-user' } };
  const { tokens } = useTheme();
  const [stats, setStats] = useState({ totalItems: 0, byCategory: {}, byColor: {}, byBrand: {}, bySize: {} });
  const [loading, setLoading] = useState(true);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  useEffect(() => {
    if (!user?.uid) return;
    const path = `artifacts/${APP_ID}/users/${user.uid}/items`;
    const itemsCollection = collection(firestore(), path);
    const unsub = onSnapshot(itemsCollection, s => {
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
          <View style={styles.header}>
            <BarChart3 size={24} color={tokens.colors.accent} strokeWidth={2.5} />
            <Text style={styles.headerTitle}>Statistiche</Text>
          </View>
          <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            <View style={styles.totalCard}>
              <SkeletonBlock width="40%" height={16} />
              <SkeletonBlock width="70%" height={42} style={{ marginTop: 12 }} />
            </View>
            {[0, 1, 2].map(section => (
              <View key={`skeleton-section-${section}`} style={styles.section}>
                <SkeletonBlock width="50%" height={16} />
                {[0, 1, 2].map(row => (
                  <View key={`skeleton-row-${section}-${row}`} style={styles.statRow}>
                    <SkeletonBlock width="60%" height={14} />
                    <SkeletonBlock width={36} height={14} />
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}><BarChart3 size={24} color={tokens.colors.primary} strokeWidth={2.5} /><Text style={styles.headerTitle}>Statistiche</Text></View>
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

const createStyles = tokens => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.colors.background },
  container: { flex: 1, backgroundColor: tokens.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  headerTitle: { fontSize: 20, fontWeight: '700', color: tokens.colors.textPrimary },
  scrollContent: { flex: 1, paddingHorizontal: 20 },
  totalCard: { backgroundColor: tokens.colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: tokens.colors.border },
  totalLabel: { fontSize: 14, fontWeight: '600', color: tokens.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  totalValue: { fontSize: 48, fontWeight: '800', color: tokens.colors.primary },
  section: { backgroundColor: tokens.colors.surface, borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1, borderColor: tokens.colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: tokens.colors.textPrimary, marginBottom: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: tokens.colors.border, gap: 16 },
  statLabel: { fontSize: 15, color: tokens.colors.textSecondary, fontWeight: '500', flex: 1 },
  statValue: { fontSize: 16, fontWeight: '700', color: tokens.colors.primary, minWidth: 40, textAlign: 'right' },
});

export default StatsScreen;
