import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { ChevronLeft, Database, HardDrive, Activity, Image as ImageIcon } from 'lucide-react-native';
import firestore, { getFirestore, collection, getDocs } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import FastImage from 'react-native-fast-image';
import { APP_ID } from '../config/appConfig';
import { useTheme } from '../contexts/ThemeContext';

const FirebaseMonitorScreen = ({ navigation, route }) => {
    const { user } = route.params;
    const { tokens } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalItems: 0,
        totalImages: 0,
        thumbnailsCount: 0,
        fullSizeCount: 0,
        estimatedSize: 0,
        cachedImages: 0
    });
    const [images, setImages] = useState([]);

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: tokens.colors.background },
        header: { 
            flexDirection: 'row', 
            alignItems: 'center', 
            paddingHorizontal: 20, 
            paddingTop: 50, 
            paddingBottom: 16, 
            borderBottomWidth: 1, 
            borderBottomColor: tokens.colors.border, 
            backgroundColor: tokens.colors.surface 
        },
        backButton: { paddingRight: 12, paddingVertical: 4 },
        title: { fontSize: 20, fontWeight: '700', color: tokens.colors.textPrimary },
        content: { flex: 1 },
        section: { marginTop: 20, marginHorizontal: 20 },
        sectionTitle: { fontSize: 16, fontWeight: '700', color: tokens.colors.textPrimary, marginBottom: 12 },
        card: { 
            backgroundColor: tokens.colors.surface, 
            borderRadius: 12, 
            padding: 16, 
            marginBottom: 12,
            borderWidth: 1,
            borderColor: tokens.colors.border
        },
        row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
        label: { fontSize: 14, color: tokens.colors.textMuted },
        value: { fontSize: 14, fontWeight: '600', color: tokens.colors.textPrimary },
        valueGood: { fontSize: 14, fontWeight: '600', color: tokens.colors.success },
        valueBad: { fontSize: 14, fontWeight: '600', color: tokens.colors.error },
        imageItem: {
            backgroundColor: tokens.colors.surfaceLight,
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
            flexDirection: 'row',
            alignItems: 'center'
        },
        imageInfo: { flex: 1, marginLeft: 12 },
        imageName: { fontSize: 13, fontWeight: '600', color: tokens.colors.textPrimary, marginBottom: 4 },
        imageDetail: { fontSize: 11, color: tokens.colors.textMuted },
        badge: { 
            paddingHorizontal: 8, 
            paddingVertical: 4, 
            borderRadius: 6, 
            backgroundColor: tokens.colors.accent + '20',
            alignSelf: 'flex-start',
            marginTop: 4
        },
        badgeText: { fontSize: 10, fontWeight: '600', color: tokens.colors.accent },
        clearCacheButton: {
            backgroundColor: tokens.colors.error,
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 12
        },
        clearCacheText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
        loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }
    }), [tokens]);

    const loadStats = async () => {
        try {
            const itemsPath = `artifacts/${APP_ID}/users/${user.uid}/items`;
            const db = getFirestore();
            const snapshot = await getDocs(collection(db, itemsPath));
            
            let thumbnailsCount = 0;
            let fullSizeCount = 0;
            let estimatedSize = 0;
            const imagesList = [];

            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                const itemImages = {
                    id: docSnap.id,
                    name: data.name || 'Senza nome',
                    thumbnail: data.thumbnailUrl,
                    fullSize: data.fullSizeUrl || data.thumbnailUrl,
                    hasOptimization: !!(data.thumbnailUrl && data.fullSizeUrl)
                };

                if (data.thumbnailUrl) {
                    thumbnailsCount++;
                    estimatedSize += 7; // ~7KB per thumbnail
                }
                if (data.fullSizeUrl) {
                    fullSizeCount++;
                    estimatedSize += 800; // ~800KB per full-size
                } else if (data.thumbnailUrl) {
                    // Old format: thumbnailUrl is actually full-size
                    estimatedSize += 800;
                }

                imagesList.push(itemImages);
            }

            setStats({
                totalItems: snapshot.size,
                totalImages: thumbnailsCount + fullSizeCount,
                thumbnailsCount,
                fullSizeCount,
                estimatedSize: (estimatedSize / 1024).toFixed(2), // Convert to MB
                cachedImages: await FastImage.getCacheSize()
            });

            setImages(imagesList);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    const clearCache = async () => {
        try {
            await FastImage.clearMemoryCache();
            await FastImage.clearDiskCache();
            await loadStats();
            alert('Cache pulita con successo!');
        } catch (error) {
            alert('Errore durante la pulizia cache');
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft size={24} color={tokens.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Monitor Firebase</Text>
                </View>
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={tokens.colors.accent} />
                </View>
            </View>
        );
    }

    const optimizationRate = stats.totalItems > 0 
        ? ((images.filter(i => i.hasOptimization).length / stats.totalItems) * 100).toFixed(0)
        : 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={tokens.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Monitor Firebase</Text>
            </View>

            <ScrollView 
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.accent} />
                }
            >
                {/* Storage Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Statistiche Storage</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Item totali</Text>
                            <Text style={styles.value}>{stats.totalItems}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Immagini totali</Text>
                            <Text style={styles.value}>{stats.totalImages}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Thumbnails</Text>
                            <Text style={styles.valueGood}>{stats.thumbnailsCount}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Full-size</Text>
                            <Text style={styles.value}>{stats.fullSizeCount}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Dimensione stimata</Text>
                            <Text style={styles.value}>{stats.estimatedSize} MB</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Ottimizzazione</Text>
                            <Text style={optimizationRate >= 80 ? styles.valueGood : styles.valueBad}>
                                {optimizationRate}%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Cache Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚡ Cache FastImage</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Immagini in cache</Text>
                            <Text style={styles.valueGood}>{stats.cachedImages}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Stato</Text>
                            <Text style={styles.valueGood}>Attiva</Text>
                        </View>
                        <TouchableOpacity style={styles.clearCacheButton} onPress={clearCache}>
                            <Text style={styles.clearCacheText}>Pulisci Cache</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Images List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🖼️ Dettaglio Immagini ({images.length})</Text>
                    {images.map((img) => (
                        <View key={img.id} style={styles.imageItem}>
                            <ImageIcon size={24} color={tokens.colors.accent} />
                            <View style={styles.imageInfo}>
                                <Text style={styles.imageName}>{img.name}</Text>
                                <Text style={styles.imageDetail}>
                                    {img.hasOptimization ? '✅ Ottimizzato (thumb + full)' : '⚠️ Solo full-size'}
                                </Text>
                                {img.hasOptimization && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>THUMBNAIL 150x200</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

export default FirebaseMonitorScreen;
