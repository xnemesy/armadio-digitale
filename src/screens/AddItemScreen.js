import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ScrollView, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView, StyleSheet, Linking } from 'react-native';
import { Camera, Image as ImageIcon, ChevronLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import { analyzeImageWithGemini, getShoppingRecommendations } from '../lib/ai';
import { APP_ID } from '../config/appConfig';
import { COLORS } from '../theme/colors';

const AddItemScreen = ({ navigation, route }) => {
    const { user } = route.params || { user: { uid: 'test-user' } };
    const [imageBase64, setImageBase64] = useState(null);
    const [imageLocalUri, setImageLocalUri] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [metadata, setMetadata] = useState({ name: '', category: '', mainColor: '', brand: '', size: '' });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const [duplicateFound, setDuplicateFound] = useState(null);

    const handleImageChange = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permesso negato', 'Serve l\'accesso alla galleria');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [3,4], quality: 0.7, base64: true });
        if (!result.canceled) {
            const uri = result.assets[0].uri;
            const base64 = result.assets[0].base64;
            setImagePreview(uri);
            setImageLocalUri(uri);
            setImageBase64(base64);
            setMetadata({ name: '', category: '', mainColor: '', brand: '', size: '' });
            setRecommendations([]);
            setDuplicateFound(null);
            if (base64) analyzeAndCheck(base64);
        }
    };

    const handleTakePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permesso negato', 'Serve l\'accesso alla fotocamera');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3,4], quality: 0.7, base64: true });
        if (!result.canceled) {
            const uri = result.assets[0].uri;
            const base64 = result.assets[0].base64;
            setImagePreview(uri);
            setImageLocalUri(uri);
            setImageBase64(base64);
            setMetadata({ name: '', category: '', mainColor: '', brand: '', size: '' });
            setRecommendations([]);
            setDuplicateFound(null);
            if (base64) analyzeAndCheck(base64);
        }
    };

    const checkDuplicate = async (aiMetadata) => {
            const snapshot = await firestore()
                .collection(`artifacts/${APP_ID}/users/${user.uid}/items`)
            .where('category', '==', aiMetadata.category)
            .where('mainColor', '==', aiMetadata.mainColor)
            .get();
        if (!snapshot.empty) return snapshot.docs[0].data();
        return null;
    };

    const analyzeAndCheck = async (base64) => {
        setLoading(true);
        setStatus('Analisi immagine in corso con Gemini AI...');
        try {
            const aiResult = await analyzeImageWithGemini(base64);
            setMetadata(prev => ({ ...prev, ...aiResult }));
            setStatus('Verifica duplicati nell\'armadio...');
            const duplicate = await checkDuplicate(aiResult);
            if (duplicate) {
                setDuplicateFound(duplicate);
                setStatus('ATTENZIONE: Trovato capo simile!');
                setLoading(false);
                return;
            }
            setStatus('Generazione suggerimenti E-commerce...');
            const recs = await getShoppingRecommendations(`${aiResult.name} ${aiResult.category}`);
            setRecommendations(recs);
            setStatus('Analisi completata. Verifica i metadati.');
        } catch (e) {
            setStatus('Errore analisi AI. Inserisci i dati manualmente.');
        } finally {
            setLoading(false);
        }
    };

    const saveItem = async () => {
        if (!imageLocalUri || !metadata.name || !metadata.category || !metadata.mainColor) {
            Alert.alert('Dati mancanti', 'Seleziona immagine e metadati essenziali.');
            return;
        }
        setLoading(true);
        setStatus('Caricamento su Firebase Storage...');
        try {
            const itemId = Date.now().toString();
            const filePath = `artifacts/${APP_ID}/users/${user.uid}/items/${itemId}.jpg`;
            await storage().ref(filePath).putFile(imageLocalUri);
            const fullSizeUrl = await storage().ref(filePath).getDownloadURL();
            const itemData = {
                ...metadata,
                userId: user.uid,
                storagePath: filePath,
                thumbnailUrl: fullSizeUrl,
                createdAt: firestore.FieldValue.serverTimestamp(),
            };
            await firestore().collection(`artifacts/${APP_ID}/users/${user.uid}/items`).doc(itemId).set(itemData);
            Alert.alert('Successo', 'Capo aggiunto!');
            navigation.goBack();
        } catch (e) {
            Alert.alert('Errore', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft size={24} color={COLORS.primary} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Aggiungi Nuovo Capo</Text>
                </View>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator contentContainerStyle={{ paddingBottom: 120 }}>
                    <Text style={styles.statusText}>
                        {loading && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />}
                        {status}
                    </Text>
                    {imagePreview ? (
                        <View style={styles.imageUploadArea}>
                            <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
                        </View>
                    ) : (
                        <View style={styles.placeholder}>
                            <Text style={{ fontSize: 48, color: COLORS.textSecondary }}>📷</Text>
                            <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>Scegli come aggiungere la foto</Text>
                        </View>
                    )}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={handleTakePhoto} style={[styles.actionButton, styles.cameraButton]} disabled={loading}>
                            <Camera size={32} color={COLORS.primary} strokeWidth={2} />
                            <Text style={styles.buttonText}>Scatta Foto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleImageChange} style={[styles.actionButton, styles.galleryButton]} disabled={loading}>
                            <ImageIcon size={32} color={COLORS.primaryLight} strokeWidth={2} />
                            <Text style={styles.buttonText}>Dalla Galleria</Text>
                        </TouchableOpacity>
                    </View>
                    {duplicateFound && (
                        <View style={styles.duplicateContainer}>
                            <Text style={styles.duplicateTitle}>Capo Simile Trovato!</Text>
                            <Text style={styles.duplicateMsg}>Hai già "{duplicateFound.name}" ({duplicateFound.category}, {duplicateFound.mainColor}).</Text>
                        </View>
                    )}
                    <View style={styles.form}>
                        <Text style={styles.formTitle}>Dati Articolo (Modificabili)</Text>
                        {['name', 'category', 'mainColor', 'brand', 'size'].map(key => (
                            <View key={key} style={styles.fieldGroup}>
                                <Text style={styles.label}>{key}</Text>
                                <TextInput
                                    value={metadata[key] || ''}
                                    onChangeText={t => setMetadata(prev => ({ ...prev, [key]: t }))}
                                    style={styles.input}
                                    placeholder={key}
                                    placeholderTextColor={COLORS.textMuted}
                                />
                            </View>
                        ))}
                    </View>
                    {recommendations.length > 0 && (
                        <View style={styles.recommendations}>
                            <Text style={styles.recommendationsTitle}>Suggerimenti di Articoli Correlati</Text>
                            {recommendations.map((rec, idx) => (
                                <TouchableOpacity key={idx} onPress={() => Linking.openURL(rec.url)} style={styles.recommendationLink}>
                                    <Text style={{ color: COLORS.primary, fontWeight: '500', fontSize: 14 }}>{rec.title} →</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <TouchableOpacity onPress={saveItem} style={styles.saveButton} disabled={loading}>
                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>{loading ? 'SALVATAGGIO...' : 'SALVA CAPO NELL\'ARMADIO'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
    backButton: { paddingRight: 12, paddingVertical: 4 },
    title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
    statusText: { textAlign: 'center', marginBottom: 15, marginHorizontal: 20, color: COLORS.primary, fontSize: 14, minHeight: 20 },
    imageUploadArea: { marginBottom: 25, marginHorizontal: 20, borderWidth: 2, borderColor: COLORS.border, borderRadius: 12, padding: 10, backgroundColor: COLORS.surface },
    imagePreview: { width: '100%', height: 300, borderRadius: 10, resizeMode: 'cover' },
    placeholder: { padding: 30, marginHorizontal: 20, alignItems: 'center' },
    buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 25, marginHorizontal: 20 },
    actionButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    cameraButton: { backgroundColor: COLORS.surfaceLight, borderColor: COLORS.primary },
    galleryButton: { backgroundColor: COLORS.surfaceLight, borderColor: COLORS.primaryLight },
    buttonText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    duplicateContainer: { marginHorizontal: 20, marginBottom: 20, padding: 12, borderRadius: 12, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.warning },
    duplicateTitle: { color: COLORS.warning, fontWeight: '700', marginBottom: 4 },
    duplicateMsg: { color: COLORS.textSecondary },
    form: { marginHorizontal: 20, marginBottom: 30, backgroundColor: COLORS.surface, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
    formTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
    fieldGroup: { marginBottom: 12 },
    label: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6, textTransform: 'capitalize' },
    input: { backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, padding: 12, borderRadius: 10, color: COLORS.textPrimary },
    recommendations: { padding: 15, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, marginBottom: 20 },
    recommendationsTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 10 },
    recommendationLink: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    saveButton: { marginHorizontal: 20, marginBottom: 30, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.primary },
});

export default AddItemScreen;
