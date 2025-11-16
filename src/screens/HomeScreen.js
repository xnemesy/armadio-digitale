import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, Animated } from 'react-native';
import firestore, { collection, onSnapshot } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import debounce from 'lodash.debounce';
import { Picker } from '@react-native-picker/picker';
import { Search, X } from 'lucide-react-native';
import { ItemCard, PressableScale, SkeletonBlock, OnboardingModal } from '../components';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { APP_ID } from '../config/appConfig';

const FILTER_STORAGE_KEY = '@armadio_filters';
const SORT_STORAGE_KEY = '@armadio_sort';
const ONBOARDING_STORAGE_KEY = '@armadio_onboarding_shown';

// Enhanced HomeScreen with filters, debounced search, sorting, and persistence
const HomeScreen = ({ navigation, route }) => {
    const { user } = useAuth();
    const { tokens } = useTheme();
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [filter, setFilter] = useState({ text: '', categories: [], colors: [], brands: [] });
    const [debouncedText, setDebouncedText] = useState('');
    const [sortBy, setSortBy] = useState('date'); // 'date' | 'name' | 'brand'
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [brands, setBrands] = useState([]);
    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
    const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);
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
                const [savedFilters, savedSort, onboardingShown] = await Promise.all([
                    AsyncStorage.getItem(FILTER_STORAGE_KEY),
                    AsyncStorage.getItem(SORT_STORAGE_KEY),
                    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
                ]);
                if (savedFilters) {
                    const parsed = JSON.parse(savedFilters);
                    setFilter(parsed);
                    setDebouncedText(parsed.text || '');
                }
                if (savedSort) {
                    setSortBy(savedSort);
                }
                // Show onboarding if first time
                if (!onboardingShown) {
                    setTimeout(() => setIsOnboardingVisible(true), 800);
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
        const itemsCollection = collection(firestore(), path);
    
        const unsubscribe = onSnapshot(itemsCollection, snapshot => {
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
            const matchesCategory = filter.categories.length === 0 || filter.categories.includes(item.category);
            const matchesColor = filter.colors.length === 0 || filter.colors.includes(item.mainColor);
            const matchesBrand = filter.brands.length === 0 || filter.brands.includes(item.brand);
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
        setFilter({ text: '', categories: [], colors: [], brands: [] });
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

    const closeOnboarding = async () => {
        setIsOnboardingVisible(false);
        try {
            await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        } catch (error) {
            console.warn('Error saving onboarding state:', error);
        }
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.cardWrapper}>
            <ItemCard item={item} onPress={() => navigation.navigate('Detail', { item })} />
        </View>
    );

    if (loadingItems) {
        return (
            <View style={[styles.loadingSkeletonContainer, { backgroundColor: tokens.colors.background }]}>
                {[0, 1, 2].map(row => (
                    <View key={row} style={styles.skeletonRow}>
                        {[0, 1].map(col => (
                            <View key={`skeleton-${row}-${col}`} style={[styles.skeletonCard, { backgroundColor: tokens.colors.surface, borderRadius: tokens.radii.lg }]}> 
                                <SkeletonBlock height={150} borderRadius={tokens.radii.lg} />
                                <SkeletonBlock height={14} style={styles.skeletonLinePrimary} />
                                <SkeletonBlock height={12} style={styles.skeletonLineSecondary} />
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
            {/* Header compatto senza ricerca */}
            <View style={[styles.header, { backgroundColor: tokens.colors.surface, borderBottomColor: tokens.colors.border }]}> 
                <Text style={[styles.headerTitle, { color: tokens.colors.textPrimary }]}>Il Mio Armadio</Text>
                <View style={styles.headerRow}>
                    <Text style={[styles.countText, { color: tokens.colors.textSecondary }]}>{filteredItems.length} / {items.length} capi</Text>
                    <View style={styles.sortContainer}>
                        <Text style={[styles.sortLabel, { color: tokens.colors.textSecondary }]}>Ordina:</Text>
                        <Picker
                            selectedValue={sortBy}
                            onValueChange={setSortBy}
                            style={[styles.sortPicker, { color: tokens.colors.textPrimary, backgroundColor: tokens.colors.background }]}
                            dropdownIconColor={tokens.colors.textSecondary}
                        >
                            <Picker.Item label="Data" value="date" color={tokens.colors.textPrimary} />
                            <Picker.Item label="Nome" value="name" color={tokens.colors.textPrimary} />
                            <Picker.Item label="Brand" value="brand" color={tokens.colors.textPrimary} />
                        </Picker>
                    </View>
                </View>
            </View>

            {/* Grid - Più spazio per le foto! */}
            {filteredItems.length === 0 ? (
                <View style={styles.emptyState}> 
                    <Text style={styles.emptyIcon}>👚</Text>
                    <Text style={[styles.emptyTitle, { color: tokens.colors.textPrimary }]}>Nessun capo trovato</Text>
                    <Text style={[styles.emptyText, { color: tokens.colors.textSecondary }]}>
                        {items.length === 0 ? 'Aggiungi il tuo primo capo!' : 'Modifica i filtri di ricerca.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={i => i.id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.gridContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FAB Search Button */}
            <TouchableOpacity 
                style={[styles.fabButton, { backgroundColor: tokens.colors.accent }]}
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
                            { backgroundColor: tokens.colors.surface },
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
                        <View style={[styles.modalHeader, { borderBottomColor: tokens.colors.border }]}>
                            <Text style={[styles.modalTitle, { color: tokens.colors.textPrimary }]}>Ricerca e Filtri</Text>
                            <TouchableOpacity onPress={closeSearchModal} style={styles.closeButton}>
                                <X size={24} color={tokens.colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {/* Search Input */}
                        <View style={styles.searchRow}>
                            <TextInput
                                ref={textInputRef}
                                style={[styles.searchInput, { 
                                    backgroundColor: tokens.colors.background, 
                                    borderColor: tokens.colors.border, 
                                    color: tokens.colors.textPrimary 
                                }]}
                                placeholder="Cerca nome o brand"
                                placeholderTextColor={tokens.colors.textSecondary}
                                value={filter.text}
                                onChangeText={handleTextChange}
                                autoFocus
                            />
                            <TouchableOpacity 
                                style={[styles.clearButton, { 
                                    backgroundColor: tokens.colors.surfaceLight, 
                                    borderColor: tokens.colors.border 
                                }]} 
                                onPress={clearFilters} 
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.clearText, { color: tokens.colors.textSecondary }]}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Filters */}
                        <View style={styles.pillsContainer}>
                            {[
                                { key: 'categories', data: categories, label: 'Categoria' }, 
                                { key: 'colors', data: colors, label: 'Colore' }, 
                                { key: 'brands', data: brands, label: 'Brand' }
                            ].map(group => (
                                <View key={group.key} style={styles.pillGroup}>
                                    <Text style={[styles.pillGroupLabel, { color: tokens.colors.textSecondary }]}>
                                        {group.label} {filter[group.key].length > 0 && `(${filter[group.key].length})`}
                                    </Text>
                                    <View style={styles.pillsRow}>
                                        <FilterPill
                                            active={filter[group.key].length === 0}
                                            label="Tutti"
                                            onPress={() => setFilter(prev => ({ ...prev, [group.key]: [] }))}
                                            tokens={tokens}
                                        />
                                        {group.data.map(val => (
                                            <FilterPill
                                                key={val}
                                                active={filter[group.key].includes(val)}
                                                label={val}
                                                onPress={() => setFilter(prev => {
                                                    const current = prev[group.key];
                                                    const newArray = current.includes(val)
                                                        ? current.filter(v => v !== val)
                                                        : [...current, val];
                                                    return { ...prev, [group.key]: newArray };
                                                })}
                                                tokens={tokens}
                                            />
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Results count */}
                        <View style={styles.modalFooter}>
                            <Text style={[styles.resultsText, { color: tokens.colors.textSecondary }]}>
                                {filteredItems.length} risultat{filteredItems.length !== 1 ? 'i' : 'o'}
                            </Text>
                            <TouchableOpacity 
                                style={[styles.applyButton, { backgroundColor: tokens.colors.accent }]}
                                onPress={closeSearchModal}
                            >
                                <Text style={styles.applyButtonText}>Applica</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </Animated.View>
            </Modal>

            {/* Onboarding Modal */}
            <OnboardingModal 
                visible={isOnboardingVisible}
                onClose={closeOnboarding}
            />
        </View>
    );
};

const FilterPill = ({ label, active, onPress, tokens }) => (
    <PressableScale
        onPress={onPress}
        style={[
            styles.pill, 
            { 
                borderColor: active ? tokens.colors.accent : tokens.colors.border,
                backgroundColor: active ? tokens.colors.accent : tokens.colors.background
            }
        ]}
        activeScale={0.92}
    >
        <Text style={[
            styles.pillText, 
            { color: active ? '#FFFFFF' : tokens.colors.textSecondary }
        ]}>{label}</Text>
    </PressableScale>
);

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 0 },
    header: { 
        paddingHorizontal: 20, 
        paddingTop: 50, 
        paddingBottom: 12, 
        borderBottomWidth: 1 
    },
    headerTitle: { fontSize: 24, fontWeight: '700' },
    headerRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginTop: 8 
    },
    countText: { fontSize: 12 },
    sortContainer: { flexDirection: 'row', alignItems: 'center' },
    sortLabel: { 
        fontSize: 11, 
        marginRight: 4, 
        fontWeight: '600' 
    },
    sortPicker: { 
        width: 110, 
        height: 36, 
        borderRadius: 6 
    },
    
    // Grid Layout - Fixed
    gridContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 180,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    cardWrapper: {
        flex: 1,
        maxWidth: '48%',
    },
    
    loadingSkeletonContainer: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 16,
    },
    skeletonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    skeletonCard: {
        flex: 0.48,
        padding: 12,
    },
    skeletonLinePrimary: {
        marginTop: 12,
        width: '70%',
    },
    skeletonLineSecondary: {
        marginTop: 8,
        width: '50%',
    },
    
    // FAB Button
    fabButton: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
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
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
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
        borderWidth: 1, 
        borderRadius: 10, 
        paddingHorizontal: 14, 
        height: 44 
    },
    clearButton: { 
        paddingHorizontal: 14, 
        height: 44, 
        borderRadius: 10, 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 1 
    },
    clearText: { fontWeight: '600', fontSize: 13 },
    pillsContainer: { paddingHorizontal: 20, paddingTop: 16 },
    pillGroup: { marginBottom: 12 },
    pillGroupLabel: { 
        fontSize: 11, 
        fontWeight: '600', 
        marginBottom: 8, 
        textTransform: 'uppercase', 
        letterSpacing: 0.5 
    },
    pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: { 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 50, 
        borderWidth: 1
    },
    pillText: { fontSize: 12, fontWeight: '500' },
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
        fontWeight: '600',
    },
    applyButton: {
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
    emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
    emptyText: { fontSize: 14, textAlign: 'center' },
});

export default HomeScreen;
