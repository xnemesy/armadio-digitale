import React, { useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ScrollView, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView, StyleSheet, Linking } from 'react-native';
import { Camera, Image as ImageIcon, ChevronLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { getStorage } from '@react-native-firebase/storage';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getFirestore } from '@react-native-firebase/firestore';
import { analyzeImageWithGemini, getShoppingRecommendations } from '../lib/ai';
import { classifyClothingFromUri } from '../ml/executorchClient';
import { ML_CONFIG } from '../ml/config';
import { APP_ID } from '../config/appConfig';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const AddItemScreen = ({ navigation, route }) => {
    const { user } = useAuth(); // Use authenticated user from AuthContext
    const { tokens } = useTheme();
    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: tokens.colors.background },
        header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
        backButton: { paddingRight: 12, paddingVertical: 4 },
        title: { fontSize: 20, fontWeight: '700', color: tokens.colors.textPrimary },
        statusText: { textAlign: 'center', marginBottom: 15, marginHorizontal: 20, color: tokens.colors.accent, fontSize: 15, fontWeight: '600', minHeight: 24 },
        imageUploadArea: { marginBottom: 25, marginHorizontal: 20, borderWidth: 2, borderColor: tokens.colors.border, borderRadius: 12, padding: 10, backgroundColor: tokens.colors.surface },
        imagePreview: { width: '100%', height: 300, borderRadius: 10, resizeMode: 'cover' },
        placeholder: { padding: 30, marginHorizontal: 20, alignItems: 'center' },
        buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 25, marginHorizontal: 20 },
        actionButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
        cameraButton: { backgroundColor: tokens.colors.surfaceLight },
        galleryButton: { backgroundColor: tokens.colors.surfaceLight },
        buttonText: { fontSize: 14, fontWeight: '600', color: tokens.colors.textPrimary },
        duplicateContainer: { marginHorizontal: 20, marginBottom: 20, padding: 12, borderRadius: 12, backgroundColor: tokens.colors.surfaceLight, borderWidth: 1, borderColor: tokens.colors.warning },
        duplicateTitle: { color: tokens.colors.warning, fontWeight: '700', marginBottom: 4 },
        duplicateMsg: { color: tokens.colors.textSecondary },
        form: { marginHorizontal: 20, marginBottom: 30, backgroundColor: tokens.colors.surface, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: tokens.colors.border },
        formTitle: { fontSize: 18, fontWeight: '700', color: tokens.colors.textPrimary, marginBottom: 10 },
        fieldGroup: { marginBottom: 12 },
        label: { fontSize: 12, color: tokens.colors.textSecondary, marginBottom: 6, textTransform: 'capitalize' },
        input: { backgroundColor: tokens.colors.surfaceLight, borderWidth: 1, borderColor: tokens.colors.border, padding: 12, borderRadius: 10, color: tokens.colors.textPrimary },
        recommendations: { padding: 15, backgroundColor: tokens.colors.surfaceLight, borderWidth: 1, borderColor: tokens.colors.accent, borderRadius: 8, marginBottom: 20 },
        recommendationsTitle: { fontSize: 16, fontWeight: '700', color: tokens.colors.accent, marginBottom: 10 },
        recommendationLink: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: tokens.colors.border },
        saveButton: { marginHorizontal: 20, marginBottom: 30, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: tokens.colors.accent },
        scanningOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
        },
        scanningText: {
            marginTop: 12,
            fontSize: 16,
            fontWeight: '700',
        },
    }), [tokens]);
    const [imageBase64, setImageBase64] = useState(null);
    const [imageLocalUri, setImageLocalUri] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [metadata, setMetadata] = useState({ name: '', category: '', mainColor: '', brand: '', size: '' });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [scanning, setScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [duplicateFound, setDuplicateFound] = useState(null);

    const removeBackground = async (imageUri) => {
        try {
            const apiKey = Constants.expoConfig.extra.CLIPDROP_API_KEY;
            if (!apiKey) {
                Alert.alert('Errore di Configurazione', 'Chiave API per Clipdrop non trovata.');
                return null;
            }

            const formData = new FormData();
            formData.append('image_file', {
                uri: imageUri,
                name: 'photo.jpg',
                type: 'image/jpeg',
            });

            const response = await fetch('https://api.clipdrop.co/remove-background/v1', {
                method: 'POST',
                headers: { 'x-api-key': apiKey },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Clipdrop API Error:', errorData);
                Alert.alert('Errore Rimozione Sfondo', `L'API ha restituito un errore: ${response.status}. Si procederà con l'immagine originale.`);
                return null;
            }

            const imageBlob = await response.blob();
            const processedUri = FileSystem.cacheDirectory + 'processed-image.png';

            const reader = new FileReader();
            reader.readAsDataURL(imageBlob);
            
            return new Promise((resolve) => {
                reader.onloadend = async () => {
                    const base64data = reader.result;
                    const base64String = base64data.split(',')[1];
                    try {
                        await FileSystem.writeAsStringAsync(processedUri, base64String, {
                            encoding: FileSystem.EncodingType.Base64,
                        });
                        resolve(processedUri);
                    } catch (error) {
                        console.error("Error writing processed image file:", error);
                        Alert.alert('Errore File', 'Impossibile salvare l\'immagine processata.');
                        resolve(null); // Resolve with null on failure
                    }
                };
                reader.onerror = () => {
                    Alert.alert('Errore File', 'Impossibile leggere l\'immagine processata.');
                    resolve(null); // Resolve with null on failure
                };
            });

        } catch (error) {
            console.error('Remove background error:', error);
            Alert.alert('Errore di Rete', 'Impossibile contattare il servizio di rimozione sfondo. Si userà l\'immagine originale.');
            return null;
        }
    };

    const processNewImage = async (pickerResult) => {
        if (pickerResult.canceled) return;
        
        setLoading(true);
        setIsProcessing(true);
        setStatus('✂️ Rimozione sfondo in corso...');

        const originalUri = pickerResult.assets[0].uri;

        // Reset state
        setMetadata({ name: '', category: '', mainColor: '', brand: '', size: '' });
        setRecommendations([]);
        setDuplicateFound(null);

        // Preview original image immediately
        setImagePreview(originalUri);

        const processedUri = await removeBackground(originalUri);
        const finalUri = processedUri || originalUri;

        setImagePreview(finalUri);
        setImageLocalUri(finalUri);

        setIsProcessing(false);
        // The 'loading' state remains true for the AI analysis

        try {
            const base64 = await FileSystem.readAsStringAsync(finalUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            setImageBase64(base64);
            if (base64) {
                await analyzeAndCheck(base64, finalUri);
            } else {
                 throw new Error("Failed to read base64 from final URI");
            }
        } catch(e) {
            console.error("Error processing image or running analysis:", e);
            setStatus('❌ Errore. Inserisci i dati manualmente.');
            setLoading(false); // Release lock if analysis fails
        }
    };
    
    const handleImageChange = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permesso negato', 'Serve l\'accesso alla galleria');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [3,4], quality: 0.7 });
        await processNewImage(result);
    };

    const handleTakePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permesso negato', 'Serve l\'accesso alla fotocamera');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3,4], quality: 0.7 });
        await processNewImage(result);
    };

    const checkDuplicate = async (aiMetadata) => {
        const itemsRef = collection(getFirestore(), `artifacts/${APP_ID}/users/${user.uid}/items`);
        const q = query(itemsRef, where('category', '==', aiMetadata.category), where('mainColor', '==', aiMetadata.mainColor));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) return snapshot.docs[0].data();
        return null;
    };

    const analyzeAndCheck = async (base64, uri) => {
        setLoading(true);
        setScanning(true);
        setStatus('🔍 Analisi on-device in corso...');
        try {
            // 1) On-device fast classification (if available)
            let aiResult = {};
            if (uri) {
                const localPred = await classifyClothingFromUri(uri);
                if (localPred && localPred.confidence >= ML_CONFIG.confidenceThreshold) {
                    aiResult.category = localPred.label;
                    setStatus(`✅ Categoria: ${localPred.label} (${(localPred.confidence*100).toFixed(0)}%)`);
                } else {
                    setStatus('🤖 Analisi Gemini AI in corso...');
                    aiResult = await analyzeImageWithGemini(base64);
                }
            } else {
                setStatus('🤖 Analisi Gemini AI in corso...');
                aiResult = await analyzeImageWithGemini(base64);
            }

            setMetadata(prev => ({ ...prev, ...aiResult }));
            setScanning(false);
            setStatus('🔎 Verifica duplicati nell\'armadio...');
            const duplicate = await checkDuplicate(aiResult);
            if (duplicate) {
                setDuplicateFound(duplicate);
                setStatus('⚠️ ATTENZIONE: Trovato capo simile!');
                setLoading(false);
                return;
            }
            setStatus('🛍️ Generazione suggerimenti acquisti...');
            const recs = await getShoppingRecommendations(`${aiResult.name} ${aiResult.category}`);
            setRecommendations(recs);
            setStatus('✨ Analisi completata! Verifica i dati.');
        } catch (e) {
            setScanning(false);
            setStatus('❌ Errore analisi AI. Inserisci manualmente.');
        } finally {
            setLoading(false);
        }
    };

    const saveItem = async () => {
        if (!user || !user.uid) {
            Alert.alert('Errore', 'Devi essere autenticato per caricare immagini.');
            return;
        }
        if (!imageLocalUri || !metadata.name || !metadata.category || !metadata.mainColor) {
            Alert.alert('Dati mancanti', 'Seleziona immagine e metadati essenziali.');
            return;
        }
        setLoading(true);
        setStatus('Generazione thumbnail...');
        try {
            const itemId = Date.now().toString();
            const basePath = `artifacts/${APP_ID}/users/${user.uid}/items/${itemId}`;
            
            // Generate optimized thumbnail (150x200px, JPEG 70%)
            const thumbnail = await ImageManipulator.manipulateAsync(
                imageLocalUri,
                [{ resize: { width: 150 } }],
                { compress: 0.7, format: 'jpeg' }
            );
            
            setStatus('Upload immagini...');
            
            // Cache metadata for CDN optimization (1 year immutable)
            const cacheMetadata = {
                cacheControl: 'public, max-age=31536000, immutable',
                contentType: 'image/jpeg'
            };
            
            // Upload thumbnail first (fast preview)
            const thumbPath = `${basePath}_thumb.jpg`;
            const thumbRef = getStorage().ref(thumbPath);
            await thumbRef.putFile(thumbnail.uri, cacheMetadata);
            const thumbnailUrl = await thumbRef.getDownloadURL();
            
            // Optimize full-size image (resize + compress) before upload
            const optimizedFull = await ImageManipulator.manipulateAsync(
                imageLocalUri,
                [{ resize: { width: 1600 } }],
                { compress: 0.85, format: 'jpeg' }
            );

            // Upload full-size image
            const fullPath = `${basePath}.jpg`;
            const fullRef = getStorage().ref(fullPath);
            await fullRef.putFile(optimizedFull.uri, cacheMetadata);
            const fullSizeUrl = await fullRef.getDownloadURL();
            
            const itemData = {
                ...metadata,
                userId: user.uid,
                storagePath: fullPath,
                thumbnailUrl,
                fullSizeUrl,
                createdAt: serverTimestamp(),
            };
            const itemRef = doc(getFirestore(), `artifacts/${APP_ID}/users/${user.uid}/items`, itemId);
            await setDoc(itemRef, itemData);
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
                        <ChevronLeft size={24} color={tokens.colors.accent} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Aggiungi Nuovo Capo</Text>
                </View>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                    <Text style={styles.statusText}>
                        {status || (imagePreview ? 'Immagine pronta. Modifica i dati se necessario.' : 'Scatta o seleziona foto per iniziare.')}
                    </Text>
                    <View style={styles.imageUploadArea}>
                        {imagePreview ? (
                            <View style={{ position: 'relative' }}>
                                <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
                                {(isProcessing || scanning) && (
                                    <View style={[styles.scanningOverlay, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                                        <ActivityIndicator size="large" color={tokens.colors.accent} />
                                        <Text style={[styles.scanningText, { color: tokens.colors.accent }]}>
                                            {isProcessing ? 'Rimozione sfondo...' : 'Scansione AI...'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={styles.placeholder}>
                                <ImageIcon size={48} color={tokens.colors.textMuted} />
                                <Text style={{ color: tokens.colors.textSecondary, marginTop: 12 }}>Nessuna immagine</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={handleTakePhoto} style={[styles.actionButton, styles.cameraButton, { borderColor: tokens.colors.accent }]} disabled={loading}>
                            <Camera size={32} color={tokens.colors.accent} strokeWidth={2} />
                            <Text style={styles.buttonText}>Scatta Foto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleImageChange} style={[styles.actionButton, styles.galleryButton, { borderColor: tokens.colors.accentLight }]} disabled={loading}>
                            <ImageIcon size={32} color={tokens.colors.accentLight} strokeWidth={2} />
                            <Text style={styles.buttonText}>Dalla Galleria</Text>
                        </TouchableOpacity>
                    </View>
                    {duplicateFound && (
                        <View style={styles.duplicateContainer}>
                            <Text style={styles.duplicateTitle}>Capo Simile Trovato!</Text>
                            <Text style={styles.duplicateMsg}>{`Hai già "${duplicateFound.name}" (${duplicateFound.category}, ${duplicateFound.mainColor}).`}</Text>
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
                                    placeholderTextColor={tokens.colors.textMuted}
                                />
                            </View>
                        ))}
                    </View>
                    {recommendations.length > 0 && (
                        <View style={styles.recommendations}>
                            <Text style={styles.recommendationsTitle}>Suggerimenti di Articoli Correlati</Text>
                            {recommendations.map((rec, idx) => (
                                    <TouchableOpacity key={`rec-${idx}`} onPress={() => Linking.openURL(rec.url)} style={styles.recommendationLink}>
                                    <Text style={{ color: tokens.colors.accent, fontWeight: '500', fontSize: 14 }}>{rec.title} →</Text>
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

export default AddItemScreen;
