import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeTokens } from '../design/tokens';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { ItemCard } from '../components';

const HomeScreen = ({ user, setViewMode, items, setItems }) => {
    const [loadingItems, setLoadingItems] = useState(true);
    const [filter, setFilter] = useState({ text: '', category: '', color: '' });

    useEffect(() => {
        if (!user?.uid) return;

        const itemsQuery = query(collection(db, `artifacts/${__app_id}/users/${user.uid}/items`));
        const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
            const fetchedItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setItems(fetchedItems);
            setLoadingItems(false);
        });

        return () => unsubscribe();
    }, [user]);

    const t = useThemeTokens();
    if (loadingItems) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: t.colors.background }]}>
                <ActivityIndicator size="large" color={t.colors.accent} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: t.colors.background }]}>
            <View style={[styles.header, { paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.md }]}>
                <Text style={{ fontSize: t.typography.sizes.xl, fontWeight: '700', color: t.colors.textPrimary }}>Il Mio Armadio</Text>
            </View>

            <FlatList
                contentContainerStyle={{ paddingHorizontal: t.spacing.md, paddingBottom: t.spacing.xl }}
                data={items}
                renderItem={({ item }) => (
                    <ItemCard item={item} onPress={() => setViewMode('detail')} />
                )}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={{ gap: t.spacing.sm }}
            />

            <TouchableOpacity 
                style={[styles.fab, { backgroundColor: t.colors.accent }]}
                onPress={() => setViewMode('add')}
                activeOpacity={0.85}
            >
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 8,
        paddingBottom: 4,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
    },
});

export default HomeScreen;
