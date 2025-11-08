import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput, Modal, Animated } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import debounce from 'lodash.debounce';
import { Picker } from '@react-native-picker/picker';
import { Search, X } from 'lucide-react-native';
import { ItemCard } from '../components';
import { PressableScale } from '../components';
import { COLORS } from '../theme/colors';
import { APP_ID } from '../config/appConfig';

const FILTER_STORAGE_KEY = '@armadio_filters';
const SORT_STORAGE_KEY = '@armadio_sort';

// Enhanced HomeScreen with filters, debounced search, sorting, and persistence
const HomeScreen = ({ navigation, route }) => {
    const { user } = route.params || { user: { uid: 'test-user' } };
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [filter, setFilter] = useState({ text: '', category: '', color: '', brand: '' });
    const [debouncedText, setDebouncedText] = useState('');
    const [sortBy, setSortBy] = useState('date'); // 'date' | 'name' | 'brand'
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [brands, setBrands] = useState([]);
    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
    const textInputRef = useRef(null);
    const modalAnimation = useRef(new Animated.Value(0)).current;

    // Debounced text search (300ms delay)
    const debouncedSetText = useCallback(
        debounce((text) => {
            setDebouncedText(text);
        }, 300),
        []
    );

    const handleTextChange = (text) => {
        setFilter(prev => ({ ...prev, text }));
        debouncedSetText(text);
    };

    // Load persisted filters and sort on mount
    useEffect(() => {
        const loadPersistedState = async () => {
            try {
                const [savedFilters, savedSort] = await Promise.all([
                    AsyncStorage.getItem(FILTER_STORAGE_KEY),
                    AsyncStorage.getItem(SORT_STORAGE_KEY),
                ]);
                if (savedFilters) {
                    const parsed = JSON.parse(savedFilters);
                    setFilter(parsed);
                    setDebouncedText(parsed.text || '');
                }
                if (savedSort) {
                    setSortBy(savedSort);
                }
            } catch (error) {
                console.warn('Error loading persisted state:', error);
            }
        };
        loadPersistedState();
    }, []);

    // Persist filters whenever they change
    useEffect(() => {
        const saveFilters = async () => {
            try {
                await AsyncStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filter));
            } catch (error) {
                console.warn('Error saving filters:', error);
            }
        };
        saveFilters();
    }, [filter]);

    // Persist sort whenever it changes
    useEffect(() => {
        const saveSort = async () => {
            try {
                await AsyncStorage.setItem(SORT_STORAGE_KEY, sortBy);
            } catch (error) {
                console.warn('Error saving sort:', error);
            }
        };
        saveSort();
    }, [sortBy]);

        useEffect(() => {
        if (!user || !user.uid) return;
        setLoadingItems(true);
            const path = `artifacts/${APP_ID}/users/${user.uid}/items`;
        const unsubscribe = firestore()
            .collection(path)
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                setItems(data);
                setLoadingItems(false);
            }, err => {
                console.error('Errore caricamento items:', err);
                setLoadingItems(false);
            });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        setCategories([...new Set(items.map(i => i.category).filter(Boolean))]);
        setColors([...new Set(items.map(i => i.mainColor).filter(Boolean))]);
        setBrands([...new Set(items.map(i => i.brand).filter(Boolean))]);
    }, [items]);

    const filteredItems = useMemo(() => {
        let filtered = items.filter(item => {
            const text = debouncedText.toLowerCase();
            const matchesText = !text || item.name?.toLowerCase().includes(text) || item.brand?.toLowerCase().includes(text);
            const matchesCategory = !filter.category || item.category === filter.category;
            const matchesColor = !filter.color || item.mainColor === filter.color;
            const matchesBrand = !filter.brand || item.brand === filter.brand;
            return matchesText && matchesCategory && matchesColor && matchesBrand;
        });

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'brand':
                    return (a.brand || '').localeCompare(b.brand || '');
                case 'date':
                default:
                    return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
            }
        });

        return filtered;
    }, [items, debouncedText, filter, sortBy]);

    const clearFilters = () => {
        setFilter({ text: '', category: '', color: '', brand: '' });
        setDebouncedText('');
        if (textInputRef.current) {
            textInputRef.current.clear();
        }
    };

    const openSearchModal = () => {
        setIsSearchModalVisible(true);
        Animated.spring(modalAnimation, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start();
    };

    const closeSearchModal = () => {
        Animated.timing(modalAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setIsSearchModalVisible(false));
    };

    const renderItem = ({ item }) => (
        <ItemCard item={item} onPress={() => navigation.navigate('Detail', { item })} />
    );

    if (loadingItems) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Caricamento...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header compatto senza ricerca */}
            <View style={styles.header}> 
                <Text style={styles.headerTitle}>Il Mio Armadio</Text>
                <View style={styles.headerRow}>
                    <Text style={styles.countText}>{filteredItems.length} / {items.length} capi</Text>
                    <View style={styles.sortContainer}>
                        <Text style={styles.sortLabel}>Ordina:</Text>
                        <Picker
                            selectedValue={sortBy}
                            onValueChange={setSortBy}
                            style={styles.sortPicker}
                            dropdownIconColor={COLORS.textSecondary}
                        >
                            <Picker.Item label="Data" value="date" color={COLORS.textPrimary} />
                            <Picker.Item label="Nome" value="name" color={COLORS.textPrimary} />
                            <Picker.Item label="Brand" value="brand" color={COLORS.textPrimary} />
                        </Picker>
                    </View>
                </View>
            </View>

            {/* Grid - Più spazio per le foto! */}
            {filteredItems.length === 0 ? (
                <View style={styles.emptyState}> 
                    <Text style={styles.emptyIcon}>👚</Text>
                    <Text style={styles.emptyTitle}>Nessun capo trovato</Text>
                    <Text style={styles.emptyText}>
                        {items.length === 0 ? 'Aggiungi il tuo primo capo!' : 'Modifica i filtri di ricerca.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={i => i.id}
                    numColumns={2}
                    columnWrapperStyle={{ paddingHorizontal: 8, justifyContent: 'space-between' }}
                    contentContainerStyle={{ paddingBottom: 140, paddingTop: 8 }}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FAB Search Button */}
            <TouchableOpacity 
                style={styles.fabButton}
                onPress={openSearchModal}
                activeOpacity={0.9}
            >
                <Search size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Search Modal Overlay */}
            <Modal
                visible={isSearchModalVisible}
                transparent
                animationType="none"
                onRequestClose={closeSearchModal}
            >
                <Animated.View 
                    style={[
                        styles.modalOverlay,
                        {
                            opacity: modalAnimation,
                        }
                    ]}
                >
                    <TouchableOpacity 
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={closeSearchModal}
                    />
                    
                    <Animated.View 
                        style={[
                            styles.modalContent,
                            {
                                transform: [{
                                    translateY: modalAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-300, 0],
                                    })
                                }],
                            }
                        ]}
                    >
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Ricerca e Filtri</Text>
                            <TouchableOpacity onPress={closeSearchModal} style={styles.closeButton}>
                                <X size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {/* Search Input */}
                        <View style={styles.searchRow}>
                            <TextInput
                                ref={textInputRef}
                                style={styles.searchInput}
                                placeholder="Cerca nome o brand"
                                placeholderTextColor={COLORS.textSecondary}
                                value={filter.text}
                                onChangeText={handleTextChange}
                                autoFocus
                            />
                            <TouchableOpacity style={styles.clearButton} onPress={clearFilters} activeOpacity={0.8}>
                                <Text style={styles.clearText}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Filters */}
                        <View style={styles.pillsContainer}>
                            {[
                                { key: 'category', data: categories, label: 'Categoria' }, 
                                { key: 'color', data: colors, label: 'Colore' }, 
                                { key: 'brand', data: brands, label: 'Brand' }
                            ].map(group => (
                                <View key={group.key} style={styles.pillGroup}>
                                    <Text style={styles.pillGroupLabel}>{group.label}</Text>
                                    <View style={styles.pillsRow}>
                                        <FilterPill
                                            active={!filter[group.key]}
                                            label="Tutti"
                                            onPress={() => setFilter(prev => ({ ...prev, [group.key]: '' }))}
                                        />
                                        {group.data.map(val => (
                                            <FilterPill
                                                key={val}
                                                active={filter[group.key] === val}
                                                label={val}
                                                onPress={() => setFilter(prev => ({ 
                                                    ...prev, 
                                                    [group.key]: prev[group.key] === val ? '' : val 
                                                }))}
                                            />
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Results count */}
                        <View style={styles.modalFooter}>
                            <Text style={styles.resultsText}>
                                {filteredItems.length} risultat{filteredItems.length !== 1 ? 'i' : 'o'}
                            </Text>
                            <TouchableOpacity 
                                style={styles.applyButton}
                                onPress={closeSearchModal}
                            >
                                <Text style={styles.applyButtonText}>Applica</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </Animated.View>
            </Modal>
        </View>
    );
};

const FilterPill = ({ label, active, onPress }) => (
    <PressableScale
        onPress={onPress}
        style={[styles.pill, active && styles.pillActive]}
        activeScale={0.92}
    >
        <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </PressableScale>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 0 },
    header: { 
        paddingHorizontal: 20, 
        paddingTop: 50, 
        paddingBottom: 12, 
        backgroundColor: COLORS.surface, 
        borderBottomWidth: 1, 
        borderBottomColor: COLORS.border 
    },
    headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
    headerRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginTop: 8 
    },
    countText: { fontSize: 12, color: COLORS.textSecondary },
    sortContainer: { flexDirection: 'row', alignItems: 'center' },
    sortLabel: { 
        fontSize: 11, 
        color: COLORS.textSecondary, 
        marginRight: 4, 
        fontWeight: '600' 
    },
    sortPicker: { 
        width: 110, 
        height: 36, 
        color: COLORS.textPrimary, 
        backgroundColor: COLORS.background, 
        borderRadius: 6 
    },
    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: COLORS.background 
    },
    loadingText: { marginTop: 10, color: COLORS.textSecondary },
    
    // FAB Button
    fabButton: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalBackdrop: {
        flex: 1,
    },
    modalContent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    searchRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingTop: 16, 
        gap: 12 
    },
    searchInput: { 
        flex: 1, 
        backgroundColor: COLORS.background, 
        borderWidth: 1, 
        borderColor: COLORS.border, 
        borderRadius: 10, 
        color: COLORS.textPrimary, 
        paddingHorizontal: 14, 
        height: 44 
    },
    clearButton: { 
        paddingHorizontal: 14, 
        height: 44, 
        borderRadius: 10, 
        backgroundColor: COLORS.surfaceLight, 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: COLORS.border 
    },
    clearText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13 },
    pillsContainer: { paddingHorizontal: 20, paddingTop: 16 },
    pillGroup: { marginBottom: 12 },
    pillGroupLabel: { 
        fontSize: 11, 
        fontWeight: '600', 
        color: COLORS.textSecondary, 
        marginBottom: 8, 
        textTransform: 'uppercase', 
        letterSpacing: 0.5 
    },
    pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: { 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 50, 
        borderWidth: 1, 
        borderColor: COLORS.border, 
        backgroundColor: COLORS.background 
    },
    pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    pillText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
    pillTextActive: { color: '#FFFFFF' },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        marginTop: 8,
    },
    resultsText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    applyButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 15 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
    emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});

export default HomeScreen;
