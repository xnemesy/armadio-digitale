import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { collection, getDocs, doc, onSnapshot, getFirestore } from '@react-native-firebase/firestore';
import { ChevronLeft, Zap, Lock } from 'lucide-react-native'; // Aggiunto Lock icon
import { getOutfitSuggestion } from '../lib/ai'; // Assicurati che questo usi la tua nuova secureFetch
import { APP_ID } from '../config/appConfig';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const OutfitBuilderScreen = ({ navigation, route }) => {
    const { user } = useAuth();
    const { tokens } = useTheme();
    const [request, setRequest] = useState('');
    const [suggestion, setSuggestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    
    // Stato per la quota
    const [usageData, setUsageData] = useState({ outfitsCount: 0, lastOutfitDate: '' });
    const [userPlan, setUserPlan] = useState('free'); // Idealmente questo verrebbe dal profilo utente
    
    // Costanti dei limiti (dovrebbero matchare il backend o essere scaricati da remote config)
    const DAILY_LIMIT = userPlan === 'pro' ? 50 : 3;
    const remainingCredits = Math.max(0, DAILY_LIMIT - usageData.outfitsCount);
    const isLimitReached = remainingCredits === 0;

    // 1. Listener in tempo reale per la quota (usage)
    useEffect(() => {
        if (!user?.uid) return;
        
        const usageRef = doc(getFirestore(), `users/${user.uid}/private/usage`);
        
        // onSnapshot è fondamentale qui: aggiorna la UI appena la Cloud Function scrive sul DB
        const unsubscribe = onSnapshot(usageRef, (docSnap) => {
            if (docSnap.exists) {
                const data = docSnap.data();
                // Reset locale visivo se la data è vecchia (il backend lo fa comunque, ma per la UI aiuta)
                const today = new Date().toISOString().split('T')[0];
                if (data.lastOutfitDate !== today) {
                    setUsageData({ outfitsCount: 0, lastOutfitDate: today });
                } else {
                    setUsageData({ 
                        outfitsCount: data.outfitsCount || 0, 
                        lastOutfitDate: data.lastOutfitDate 
                    });
                }
            }
        });

        return () => unsubscribe();
    }, [user?.uid]);

    // ... (Il blocco useFocusEffect per caricare gli items rimane uguale) ...
    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            const run = async () => {
                if (!user?.uid) return;
                setLoadingItems(true);
                try {
                    // NOTA: Qui dovresti usare la logica "Slim" discussa prima se non l'hai già fatto
                    const path = `artifacts/${APP_ID}/users/${user.uid}/items`;
                    const itemsCollection = collection(getFirestore(), path);
                    const s = await getDocs(itemsCollection);
                    if (cancelled) return;
                    setItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
                } catch (e) {
                    // handle error
                } finally {
                    if (!cancelled) setLoadingItems(false);
                }
            };
            run();
            return () => { cancelled = true; };
        }, [user?.uid])
    );

    const handleGenerate = async () => {
        if (!request.trim()) return;
        if (items.length === 0) return;
        
        // Check preventivo UI (risparmia una chiamata di rete se il limite è palese)
        if (isLimitReached) {
            Alert.alert(
                "Limite Raggiunto", 
                "Hai esaurito gli outfit per oggi. Torna domani o passa a Pro!"
            );
            return;
        }

        setLoading(true);
        setSuggestion(null);
        
        try {
            // Passiamo items (ricorda di usare la versione 'Slim' in getOutfitSuggestion se non l'hai fatto)
            const res = await getOutfitSuggestion(items, request);
            setSuggestion(res);
        } catch (error) {
            // Gestione errori specifica
            console.error("Errore generazione:", error);
            if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('403')) {
                Alert.alert("Ops!", "Hai raggiunto il limite giornaliero di outfit.");
            } else {
                Alert.alert("Errore", "Impossibile generare l'outfit al momento. Riprova.");
            }
        } finally {
            setLoading(false);
        }
    };

    const styles = useMemo(() => StyleSheet.create({
        // ... (i tuoi stili esistenti rimangono uguali) ...
        container: { flex: 1, backgroundColor: tokens.colors.background },
        header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
        backButton: { paddingRight: 12, paddingVertical: 4 },
        title: { fontSize: 20, fontWeight: '700', color: tokens.colors.textPrimary, flex: 1 },
        
        // NUOVI STILI PER LA QUOTA
        quotaBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isLimitReached ? '#FEE2E2' : tokens.colors.surfaceLight, // Rosso chiaro se limitato
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isLimitReached ? '#EF4444' : tokens.colors.border
        },
        quotaText: {
            fontSize: 12,
            fontWeight: '600',
            color: isLimitReached ? '#DC2626' : tokens.colors.textSecondary,
            marginLeft: 4
        },
        
        inputArea: { margin: 16, padding: 15, backgroundColor: tokens.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: tokens.colors.border },
        textarea: { backgroundColor: tokens.colors.surfaceLight, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: 8, color: tokens.colors.textPrimary, padding: 12, minHeight: 100, textAlignVertical: 'top' },
        
        generateButton: { 
            marginTop: 12, 
            backgroundColor: isLimitReached ? '#9CA3AF' : tokens.colors.accent, // Grigio se disabilitato
            borderRadius: 8, 
            paddingVertical: 12, 
            alignItems: 'center' 
        },
        
        // ... (altri stili uguali) ...
        resultBox: { margin: 16, padding: 20, borderRadius: 12, backgroundColor: tokens.colors.surfaceLight, borderWidth: 1, borderColor: tokens.colors.accent },
        resultTitle: { fontSize: 18, fontWeight: '700', color: tokens.colors.accent, marginBottom: 8 },
        resultText: { color: tokens.colors.textPrimary, fontSize: 15, lineHeight: 22 },
        inventoryPreview: { marginHorizontal: 16, padding: 15, backgroundColor: tokens.colors.surface, borderRadius: 8, borderWidth: 1, borderColor: tokens.colors.border },
        inventoryTitle: { fontSize: 15, fontWeight: '600', color: tokens.colors.textSecondary, marginBottom: 8 },
        itemList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
        itemTag: { backgroundColor: '#D1D5DB', color: '#374151', padding: 5, borderRadius: 5, fontSize: 12 },
        note: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
    }), [tokens, isLimitReached]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={tokens.colors.accent} strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.title}><Zap size={20} color={tokens.colors.accent} /> Outfit AI</Text>
                
                {/* BADGE QUOTA */}
                <View style={styles.quotaBadge}>
                    {isLimitReached ? <Lock size={12} color="#DC2626" /> : <Zap size={12} color={tokens.colors.textSecondary} />}
                    <Text style={styles.quotaText}>
                        {remainingCredits} / {DAILY_LIMIT}
                    </Text>
                </View>
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
                    <TouchableOpacity 
                        onPress={handleGenerate} 
                        style={styles.generateButton} 
                        disabled={loading || isLimitReached} // Disabilita tasto se limite raggiunto
                    >
                        {loading ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>Generazione...</Text>
                            </View>
                        ) : (
                            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>
                                {isLimitReached ? "Limite Giornaliero Raggiunto" : "Genera Outfit (1 Credit)"}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
                
                {/* ... Resto della UI (suggestion box, inventory preview) uguale ... */}
                {suggestion && (
                    <View style={styles.resultBox}>
                        <Text style={styles.resultTitle}>Suggerimento del tuo Stylist AI</Text>
                        <Text style={styles.resultText}>{suggestion}</Text>
                    </View>
                )}
                {/* ... */}
                 {loadingItems ? (
                    <View style={styles.inventoryPreview}>
                        <ActivityIndicator size="small" color={tokens.colors.accent} />
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
                        <Text style={styles.note}>{"L'AI utilizzerà questi capi per il suggerimento."}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};
export default OutfitBuilderScreen;