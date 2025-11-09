import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { ChevronLeft, Zap } from 'lucide-react-native';
import { getOutfitSuggestion } from '../lib/ai';
import { APP_ID } from '../config/appConfig';
import { useTheme } from '../contexts/ThemeContext';

const OutfitBuilderScreen = ({ navigation, route }) => {
    const { user } = route.params || { user: { uid: 'test-user' } };
    const { tokens } = useTheme();
    const [request, setRequest] = useState('');
    const [suggestion, setSuggestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;
        const path = `artifacts/${APP_ID}/users/${user.uid}/items`;
        const unsub = firestore().collection(path).onSnapshot(s => {
            setItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoadingItems(false);
        }, () => setLoadingItems(false));
        return () => unsub();
    }, [user]);

    const handleGenerate = async () => {
        if (!request.trim()) return;
        if (items.length === 0) return;
        setLoading(true);
        setSuggestion(null);
        try {
            const res = await getOutfitSuggestion(items, request);
            setSuggestion(res);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={tokens.colors.primary} strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.title}><Zap size={20} color={tokens.colors.primary} /> Outfit Builder AI</Text>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.textarea}
                        placeholder="Es: Outfit casual per un aperitivo..."
                        placeholderTextColor={tokens.colors.textSecondary}
                        value={request}
                        onChangeText={setRequest}
                        multiline
                    />
                    <TouchableOpacity onPress={handleGenerate} style={styles.generateButton} disabled={loading}>
                        {loading ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>Generazione in corso...</Text>
                            </View>
                        ) : (
                            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>Genera Outfit</Text>
                        )}
                    </TouchableOpacity>
                </View>
                {suggestion && (
                    <View style={styles.resultBox}>
                        <Text style={styles.resultTitle}>Suggerimento del tuo Stylist AI</Text>
                        <Text style={styles.resultText}>{suggestion}</Text>
                    </View>
                )}
                {loadingItems ? (
                    <View style={styles.inventoryPreview}>
                        <ActivityIndicator size="small" color={tokens.colors.primary} />
                        <Text style={styles.note}>Caricamento capi...</Text>
                    </View>
                ) : (
                    <View style={styles.inventoryPreview}>
                        <Text style={styles.inventoryTitle}>Capi nel tuo armadio ({items.length})</Text>
                        <View style={styles.itemList}>
                            {items.slice(0, 5).map(i => (
                                <Text key={i.id} style={styles.itemTag}>{i.name} ({i.mainColor})</Text>
                            ))}
                            {items.length > 5 && <Text style={styles.itemTag}>...e altri {items.length - 5}</Text>}
                        </View>
                        <Text style={styles.note}>L'AI utilizzerà questi capi per il suggerimento.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: tokens.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
    backButton: { paddingRight: 12, paddingVertical: 4 },
    title: { fontSize: 20, fontWeight: '700', color: tokens.colors.textPrimary },
    inputArea: { margin: 16, padding: 15, backgroundColor: tokens.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: tokens.colors.border },
    textarea: { backgroundColor: tokens.colors.surfaceLight, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: 8, color: tokens.colors.textPrimary, padding: 12, minHeight: 100, textAlignVertical: 'top' },
    generateButton: { marginTop: 12, backgroundColor: tokens.colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
    resultBox: { margin: 16, padding: 20, borderRadius: 12, backgroundColor: tokens.colors.surfaceLight, borderWidth: 1, borderColor: tokens.colors.primary },
    resultTitle: { fontSize: 18, fontWeight: '700', color: tokens.colors.primary, marginBottom: 8 },
    resultText: { color: tokens.colors.textPrimary, fontSize: 15, lineHeight: 22 },
    inventoryPreview: { marginHorizontal: 16, padding: 15, backgroundColor: tokens.colors.surface, borderRadius: 8, borderWidth: 1, borderColor: tokens.colors.border },
    inventoryTitle: { fontSize: 15, fontWeight: '600', color: tokens.colors.textSecondary, marginBottom: 8 },
    itemList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    itemTag: { backgroundColor: '#D1D5DB', color: '#374151', padding: 5, borderRadius: 5, fontSize: 12 },
    note: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
});

export default OutfitBuilderScreen;

