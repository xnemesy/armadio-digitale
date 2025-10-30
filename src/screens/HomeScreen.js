import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
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

    if (loadingItems) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Il Mio Armadio</Text>
            </View>

            <FlatList
                data={items}
                renderItem={({ item }) => (
                    <ItemCard item={item} onPress={() => setViewMode('detail')} />
                )}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
            />

            <TouchableOpacity 
                style={styles.fab}
                onPress={() => setViewMode('add')}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#F7F9FB',
    },
    // ...altri stili...
};

export default HomeScreen;
