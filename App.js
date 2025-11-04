import React, { useState, useEffect } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  TextInput,
  ActivityIndicator,
  Linking,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';

// Lucide Icons (The Athletic Style)
import { Home, Zap, Camera, User, ChevronLeft, Image as ImageIcon } from 'lucide-react-native';

// React Native Firebase (moduli nativi)
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ====================================================================
// Design System - Palette Dark/Minimal (The Athletic Style)
// ====================================================================
const COLORS = {
    // Background
    background: '#121212',        // The Athletic dark background
    surface: '#1A1A1A',           // Surface cards
    surfaceLight: '#2A2A2A',      // Surface hover/elevated
    
    // Accent (Verde Smeraldo/Lime - Trend 2025)
    primary: '#10B981',           // Emerald-500
    primaryDark: '#059669',       // Emerald-600
    primaryLight: '#34D399',      // Emerald-400
    
    // Text
    textPrimary: '#F9FAFB',       // Bianco quasi puro
    textSecondary: '#D1D5DB',     // Grigio chiaro
    textMuted: '#9CA3AF',         // Grigio medio
    
    // Borders & Dividers
    border: '#374151',            // Grigio scuro
    borderLight: '#4B5563',       // Grigio medio-scuro
    
    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Bottom Nav
    navBackground: '#1A1A1A',
    navInactive: '#6B7280',
    navActive: '#10B981',
};

// Scelta build: EXPO (managed) + EAS (build AAB/APK)
// Motivo: migliore integrazione con camera/image-picker, workflow EAS per build firmate,
// supporto rapido a iOS/Android, gestione credenziali con EAS secrets.
//
// Checklist rapida per porting:
// 1) Creare progetto Expo: `expo init ArmadioDigitaleApp` (managed).
// 2) Copiare la logica business (AI calls, Firestore/Storage paths, UI flows).
// 3) Sostituire elementi DOM (div, input type=file, FileReader) con:
//      - View, Text, Image, TextInput, TouchableOpacity
//      - expo-image-picker / expo-camera per acquisire immagini
//      - per ottenere Blob: fetch(uri).then(r => r.blob()) o FileSystem
// 4) Firebase: utilizzare Firebase JS SDK; per funzioni native aggiungere google-services.json
//    e configurare via eas.json/app.json se si usano plugin nativi.
// 5) Spostare chiavi sensibili in env (EAS secrets / expo-constants / .env) e non committarle.
// 6) Configurare app.json (package, icone, permissions) e eas.json (profili build).
// 7) Test su Expo Go, poi `eas build -p android --profile production` per AAB.
// 8) Usare `eas credentials` per gestire keystore o fornirne uno esistente.
// 9) Verifiche finali: permessi, privacy (policy), limitazioni API Gemini su client.
//
// Note tecniche veloci:
// - replace FileReader usage: in RN ottieni uri da ImagePicker; per inviare a Gemini serve base64:
//      const resp = await fetch(uri); const blob = await resp.blob(); convertire in base64 lato client o inviare blob a server che converte.
// - per Firebase Storage con expo-managed, uploadBytes su snapshot.ref funziona con Blob.

// ====================================================================
// PASSO 1: Configurazione e Inizializzazione Firebase
// ====================================================================

// Variabili globali fornite dall'ambiente Canvas
const __app_id = typeof __app_id !== 'undefined' ? __app_id : 'armadio-digitale-demo'; 
const __initial_auth_token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null; 

// *** CHIAVE API GEMINI - Caricata da expo-constants extra ***
const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || "AIzaSyB7zXvfWtBRk61es-Om6d_uVKXILiJJZbk"; 
console.log('🔑 Gemini API Key loaded:', apiKey ? `${apiKey.substring(0, 15)}...` : 'MISSING!');

// LA TUA CONFIGURAZIONE CORRETTA DI FIREBASE - Usando expo-constants extra
const firebaseConfig = {
    apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: "armadiodigitale.firebaseapp.com",
    projectId: "armadiodigitale",
    storageBucket: "armadiodigitale.firebasestorage.app",
    messagingSenderId: "880569534087",
    appId: "1:880569534087:web:731ba708ffe10642965a22",
    measurementId: "G-0WY4W91L0M"
};

// ⚠️ NOTA: Con React Native Firebase, l'inizializzazione avviene automaticamente
// tramite google-services.json (Android) e GoogleService-Info.plist (iOS)
// Non serve più initializeApp()


// ====================================================================
// LOGICA GEMINI API (Analisi Immagine e Suggerimenti)
// ====================================================================

/**
 * Chiama l'API Gemini per analizzare l'immagine e ottenere metadati strutturati.
 * @param {string} base64Image - Immagine in formato Base64.
 * @returns {Promise<object>} Oggetto JSON con nome, categoria e colore.
 */
const analyzeImageWithGemini = async (base64Image) => {
    console.log('🤖 Chiamata Cloud Function con immagine Base64:', base64Image ? 'Immagine presente' : 'ERRORE - Nessuna immagine');
    
    // URL della Cloud Function deployata su Google Cloud
    const cloudFunctionUrl = 'https://europe-west1-armadiodigitale.cloudfunctions.net/analyzeImage';

    const payload = {
        imageBase64: base64Image,
        mimeType: 'image/jpeg'
    };

    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            console.log(`🔄 Tentativo ${attempt + 1}/5 - Chiamata Cloud Function...`);
            
            const response = await fetch(cloudFunctionUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                timeout: 30000 // 30 secondi timeout
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Cloud Function response:', result);

                if (result.success && result.data) {
                    // Mappa i campi dalla risposta Cloud Function al formato app
                    return {
                        name: result.data.category || "",
                        category: result.data.category || "",
                        mainColor: result.data.color || "",
                        brand: result.data.brand || "Generic",
                        size: "M" // Default, la Cloud Function non restituisce size
                    };
                } else {
                    console.error('❌ Cloud Function error:', result.error);
                    throw new Error(result.error || 'Errore analisi immagine');
                }
            } else if (response.status === 429 && attempt < 4) {
                // Rate limiting - retry con exponential backoff
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                console.warn(`⚠️ Rate limit (429), retry tra ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // Log dettagliato errore
            let errorBody = '';
            try { errorBody = await response.text(); } catch {}
            console.error('❌ Cloud Function HTTP error', response.status, response.statusText, errorBody);
            throw new Error(`Cloud Function error: ${response.status} ${response.statusText}`);

        } catch (error) {
            console.error(`❌ Tentativo ${attempt + 1} fallito:`, error.message);
            
            if (attempt === 4) {
                // Ultimo tentativo fallito
                throw new Error(`Impossibile analizzare l'immagine dopo 5 tentativi: ${error.message}`);
            }
            
            // Retry con exponential backoff
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            console.log(`🔄 Retry tra ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error("Impossibile analizzare l'immagine dopo diversi tentativi.");
};

/**
 * Chiama la Cloud Function per ottenere suggerimenti shopping con Google Search.
 * @param {string} itemDescription - Descrizione del capo.
 * @returns {Promise<Array>} Array di oggetti con titolo e url.
 */
const getShoppingRecommendations = async (itemDescription) => {
    console.log('🛍️ Chiamata Cloud Function Shopping:', itemDescription);
    
    const cloudFunctionUrl = 'https://europe-west1-armadiodigitale.cloudfunctions.net/getShoppingRecommendations';

    const payload = {
        itemDescription
    };

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            console.log(`🔄 Tentativo ${attempt + 1}/3 - Shopping...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(cloudFunctionUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('📥 Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Shopping response completo:', JSON.stringify(result));

                if (result.success && result.recommendations && result.recommendations.length > 0) {
                    console.log(`✅ ${result.recommendations.length} suggerimenti trovati`);
                    return result.recommendations;
                } else {
                    console.warn('⚠️ No recommendations in response:', result);
                    return [];
                }
            } else if (response.status === 429 && attempt < 2) {
                const delay = Math.pow(2, attempt) * 1000;
                console.warn(`⚠️ Rate limit, retry tra ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            let errorBody = '';
            try { errorBody = await response.text(); } catch {}
            console.error(`❌ Error response (${response.status}):`, errorBody);
            console.error('❌ Shopping HTTP error', response.status, errorBody);
            
            // Non fallire, restituisci array vuoto
            return [];

        } catch (error) {
            console.error(`❌ Shopping tentativo ${attempt + 1} fallito:`, error.message);
            
            if (attempt === 2) {
                console.warn('⚠️ Shopping fallito dopo 3 tentativi, restituisco array vuoto');
                return [];
            }
            
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    return []; // Fallback gracefully
};

/**
 * Genera un suggerimento di outfit basato sui capi disponibili e una richiesta specifica.
 * @param {Array<object>} availableItems - Lista dei capi dell'utente.
 * @param {string} userRequest - Richiesta specifica dell'utente (es. "Outfit elegante per ufficio").
 * @returns {Promise<string>} Risposta testuale con la descrizione dell'outfit.
 */
const getOutfitSuggestion = async (availableItems, userRequest) => {
    // Trasforma la lista dei capi in una stringa concisa per il prompt
    const inventory = availableItems.map(item => 
        `[ID: ${item.id.substring(0,4)}, ${item.name} (${item.category}, ${item.mainColor}, Taglia: ${item.size})]`
    ).join('; ');
    
    const systemPrompt = `Sei un fashion stylist personale. Devi creare un outfit completo e coerente usando ESCLUSIVAMENTE i capi forniti. Se un outfit richiede un capo non disponibile, indicalo chiaramente come 'Capo Mancante'.`;
    
    const userPrompt = `Basandoti sul mio inventario, suggerisci un outfit per la seguente occasione: '${userRequest}'. 
                        Inventario disponibile: ${inventory}. 
                        Descrivi l'outfit in modo entusiasta, menzionando i nomi dei capi utilizzati (usa gli ID per riferimento).`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                return text || "Nessun suggerimento generato.";
            } else if (response.status === 429 && attempt < 4) {
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            // Log dettagliato dell'errore per diagnosi 403/401
            let errorBody = '';
            try { errorBody = await response.text(); } catch {}
            console.error('Gemini outfit suggestion error', response.status, response.statusText, errorBody);
            throw new Error(`API response error: ${response.status} ${response.statusText}`);
        } catch (error) {
            if (attempt === 4) throw error; 
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return "Errore nella comunicazione con l'AI. Riprova più tardi.";
};


// ====================================================================
// Componente Outfit Builder (OutfitBuilderScreen)
// ====================================================================

const OutfitBuilderScreen = ({ navigation, route }) => {
    const { user } = route.params || { user: { uid: 'test-user' } };
    const [request, setRequest] = useState('');
    const [suggestion, setSuggestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);

    // Fetch items from Firestore
    useEffect(() => {
        if (!user || !user.uid) return;

        const itemsCollectionPath = `artifacts/${__app_id}/users/${user.uid}/items`;
        
        const unsubscribe = firestore()
            .collection(itemsCollectionPath)
            .onSnapshot((snapshot) => {
                const fetchedItems = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setItems(fetchedItems);
                setLoadingItems(false);
            }, (error) => {
                console.error('Errore nel recupero degli item:', error);
                setLoadingItems(false);
            });

        return () => unsubscribe();
    }, [user]);

    const handleGenerate = async () => {
        if (!request.trim()) {
            alert("Per favore, inserisci una richiesta per l'outfit.");
            return;
        }
        if (items.length === 0) {
            alert("Il tuo armadio è vuoto! Aggiungi prima dei capi.");
            return;
        }
        
        setLoading(true);
        setSuggestion(null);
        
        try {
            const result = await getOutfitSuggestion(items, request);
            setSuggestion(result);
        } catch (error) {
            alert("Errore nella generazione dell'outfit: " + error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={outfitStyles.container}>
            <View style={detailStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={detailStyles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <ChevronLeft size={24} color={COLORS.primary} strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={detailStyles.title}>
                    <Zap size={20} color={COLORS.primary} /> Outfit Builder AI
                </Text>
            </View>

            <ScrollView style={{flex: 1}} contentContainerStyle={{paddingBottom: 20}}>
            <View style={outfitStyles.inputArea}>
                <TextInput
                    style={outfitStyles.textarea}
                    placeholder="Esempio: Outfit casual per un aperitivo estivo o Abbinamento elegante per una riunione..."
                    placeholderTextColor="#9CA3AF"
                    selectionColor="#4F46E5"
                    value={request}
                    onChangeText={setRequest}
                    multiline
                />
                <TouchableOpacity 
                    onPress={handleGenerate} 
                    style={loading ? authStyles.disabledButton : outfitStyles.generateButton}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={{color: '#FFFFFF', fontWeight: '600', fontSize: 16}}>
                                Generazione in corso...
                            </Text>
                        </View>
                    ) : (
                        <Text style={{color: 'white', fontWeight: '600', fontSize: 16}}>
                            Genera Outfit
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
            
            {suggestion && (
                <View style={outfitStyles.resultBox}>
                    <Text style={outfitStyles.resultTitle}>Suggerimento del tuo Stylist AI</Text>
                    <Text style={outfitStyles.resultText}>{suggestion}</Text>
                </View>
            )}
            
            {loadingItems ? (
                <View style={outfitStyles.inventoryPreview}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={outfitStyles.note}>Caricamento capi...</Text>
                </View>
            ) : (
                <View style={outfitStyles.inventoryPreview}>
                    <Text style={outfitStyles.inventoryTitle}>Capi nel tuo armadio ({items.length})</Text>
                    <View style={outfitStyles.itemList}>
                        {items.slice(0, 5).map(item => (
                            <Text key={item.id} style={outfitStyles.itemTag}>
                                {item.name} ({item.mainColor})
                            </Text>
                        ))}
                        {items.length > 5 && <Text style={outfitStyles.itemTag}>...e altri {items.length - 5}</Text>}
                    </View>
                    <Text style={outfitStyles.note}>L'AI utilizzerà questi capi per il suggerimento.</Text>
                </View>
            )}
            </ScrollView>
        </View>
    );
};


// ====================================================================
// Componente Aggiunta Articolo (AddItemScreen)
// ====================================================================

const AddItemScreen = ({ navigation, route }) => {
    const { user } = route.params || { user: { uid: 'test-user' } };
    const [imageBase64, setImageBase64] = useState(null); // Base64 per AI
    const [imageLocalUri, setImageLocalUri] = useState(null); // URI locale per upload nativo
    const [imagePreview, setImagePreview] = useState(null);
    const [metadata, setMetadata] = useState({ name: '', category: '', mainColor: '', brand: '', size: '' });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const [duplicateFound, setDuplicateFound] = useState(null);

    // Gestione della selezione del file (React Native)
    const handleImageChange = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert("Permesso negato", "Serve l'accesso alla galleria per selezionare le foto");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], // expo-image-picker v17+ usa array di stringhe
                allowsEditing: true,
                aspect: [3, 4], 
                quality: 0.7, 
                base64: true, // IMPORTANTE: Abilitiamo la generazione Base64
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                const base64 = result.assets[0].base64;
                
                setImagePreview(uri);
                setImageLocalUri(uri); // Salva URI locale per upload nativo
                setImageBase64(base64); // Salva Base64 per AI
                
                // Resetta stato
                setMetadata({ name: '', category: '', mainColor: '', brand: '', size: '' });
                setRecommendations([]);
                setDuplicateFound(null);

                if (base64) {
                    analyzeAndCheck(base64); // Avvia analisi con Base64
                } else {
                    Alert.alert("Errore", "Impossibile ottenere Base64 per l'analisi AI.");
                }
            }
        } catch (error) {
            Alert.alert("Errore", "Impossibile caricare l'immagine: " + error.message);
            console.error("Errore gestione immagine:", error);
        }
    };

    // Gestione scatto foto con fotocamera
    const handleTakePhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert("Permesso negato", "Serve l'accesso alla fotocamera per scattare foto");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.7,
                base64: true,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                const base64 = result.assets[0].base64;
                
                setImagePreview(uri);
                setImageLocalUri(uri);
                setImageBase64(base64);
                
                // Resetta stato
                setMetadata({ name: '', category: '', mainColor: '', brand: '', size: '' });
                setRecommendations([]);
                setDuplicateFound(null);

                if (base64) {
                    analyzeAndCheck(base64);
                } else {
                    Alert.alert("Errore", "Impossibile ottenere Base64 per l'analisi AI.");
                }
            }
        } catch (error) {
            Alert.alert("Errore", "Impossibile scattare la foto: " + error.message);
            console.error("Errore scatto foto:", error);
        }
    };
    
    // Funzione per cercare duplicati in Firestore (sintassi nativa)
    const checkDuplicate = async (aiMetadata) => {
        const snapshot = await firestore()
            .collection(`artifacts/${__app_id}/users/${user.uid}/items`)
            .where('category', '==', aiMetadata.category)
            .where('mainColor', '==', aiMetadata.mainColor)
            .get();
        
        if (!snapshot.empty) {
            return snapshot.docs[0].data(); // Restituisce il primo duplicato trovato
        }
        return null;
    };

    // Analisi AI e verifica duplicati
    const analyzeAndCheck = async (base64Content) => {
        setLoading(true);
        setStatus('Analisi immagine in corso con Gemini AI...');
        let aiResult = null;
        try {
            aiResult = await analyzeImageWithGemini(base64Content);
            
            setMetadata(prev => ({
                ...prev,
                name: aiResult.name || '',
                category: aiResult.category || '',
                mainColor: aiResult.mainColor || '',
                brand: aiResult.brand || '',
                size: aiResult.size || ''
            }));
            
            // Verifica Duplicati
            setStatus('Verifica duplicati nell\'armadio...');
            const duplicate = await checkDuplicate(aiResult);
            if (duplicate) {
                setDuplicateFound(duplicate);
                setStatus('ATTENZIONE: Trovato capo simile! Non aggiungerlo se è un duplicato.');
                setLoading(false); 
                return;
            }
            
            // Generazione Suggerimenti E-commerce
            setStatus('Generazione suggerimenti E-commerce...');
            try {
                const recommendations = await getShoppingRecommendations(aiResult.name + ' ' + aiResult.category);
                console.log('📦 Suggerimenti ricevuti:', recommendations);
                if (recommendations && recommendations.length > 0) {
                    setRecommendations(recommendations);
                } else {
                    console.warn('⚠️ Nessun suggerimento ricevuto dalla Cloud Function');
                    setRecommendations([]);
                }
            } catch (recError) {
                console.error('❌ Errore recupero suggerimenti:', recError);
                setRecommendations([]);
            }

            setStatus('Analisi completata. Verifica i metadati.');
            
        } catch (error) {
            setStatus('Errore analisi AI. Inserisci i dati manualmente.');
            console.error("Errore AI/Duplicati:", error);
        } finally {
            if (!duplicateFound) {
                 setLoading(false);
            }
        }
    };


    // Upload su Storage e Salvataggio su Firestore
    const handleSubmit = async () => {
        if (duplicateFound) {
            // Utilizziamo un messaggio di conferma personalizzato (NO window.confirm)
            const confirm = window.confirm(`Hai trovato un capo simile (${duplicateFound.name}). Sei sicuro di voler aggiungere questo articolo?`);
            if (!confirm) { return; }
        }
        await saveItem();
    };

    // MODIFICA: Aggiorniamo saveItem per usare uploadString (Base64)
    const saveItem = async () => {
        // Verifica che abbiamo l'URI locale per l'upload
        if (!imageLocalUri || !metadata.name || !metadata.category || !metadata.mainColor) {
            Alert.alert("Dati mancanti", "Per favore, seleziona un'immagine e verifica i metadati essenziali (Nome, Categoria, Colore).");
            return;
        }

        setLoading(true);
        setStatus('Caricamento su Firebase Storage...');

        try {
            const itemId = Date.now().toString();
            const filePath = `artifacts/${__app_id}/users/${user.uid}/items/${itemId}.jpg`;
            
            // ==================================================
            // UPLOAD NATIVO CON REACT-NATIVE-FIREBASE
            // Usa putFile() con l'URI locale del file
            const task = storage().ref(filePath).putFile(imageLocalUri);

            // Monitora il progresso (opzionale)
            task.on('state_changed', (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setStatus(`Caricamento: ${Math.round(progress)}%`);
            });

            // Attendi completamento
            await task;
            // ==================================================
            
            const fullSizeUrl = await storage().ref(filePath).getDownloadURL();

            setStatus('File caricato. Salvataggio su Firestore...');

            const thumbnailUrl = fullSizeUrl;
            
            const itemData = {
                ...metadata,
                userId: user.uid,
                storagePath: filePath,
                thumbnailUrl: thumbnailUrl,
                createdAt: firestore.FieldValue.serverTimestamp(),
            };

            await firestore()
                .collection(`artifacts/${__app_id}/users/${user.uid}/items`)
                .doc(itemId)
                .set(itemData); 

            setStatus('Capo aggiunto con successo all\'armadio!');
            
            Alert.alert("Successo", "Capo aggiunto!");
            navigation.goBack();

        } catch (error) {
            console.error("Errore nel processo di aggiunta capo:", error);
            setStatus('Errore grave nel salvataggio. Riprova.');
            Alert.alert("Errore", "Errore nel salvataggio: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMetadata(prev => ({ ...prev, [name]: value }));
    };

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={addItemStyles.container}>
                <View style={addItemStyles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={addItemStyles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <ChevronLeft size={24} color={COLORS.primary} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={addItemStyles.title}>Aggiungi Nuovo Capo</Text>
                </View>
                
                <ScrollView 
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    <Text style={addItemStyles.statusText}>
                         {loading && <ActivityIndicator size="small" color="#4F46E5" style={{marginRight: 8}} />}
                         {status}
                    </Text>

                    {/* Area Preview Immagine */}
                    {imagePreview ? (
                        <View style={addItemStyles.imageUploadArea}>
                            <Image source={{ uri: imagePreview }} style={addItemStyles.imagePreview} />
                        </View>
                    ) : (
                        <View style={addItemStyles.placeholder}>
                            <Text style={{ fontSize: 48, color: '#6B7280' }}>📷</Text>
                            <Text style={{ color: '#6B7280', marginTop: 8 }}>Scegli come aggiungere la foto</Text>
                        </View>
                    )}

            {/* Pulsanti Fotocamera e Galleria con Lucide Icons */}
            <View style={addItemStyles.buttonRow}>
                <TouchableOpacity 
                    onPress={handleTakePhoto}
                    style={[addItemStyles.actionButton, addItemStyles.cameraButton]}
                    disabled={loading}
                >
                    <Camera size={32} color={COLORS.primary} strokeWidth={2} />
                    <Text style={addItemStyles.buttonText}>Scatta Foto</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={handleImageChange}
                    style={[addItemStyles.actionButton, addItemStyles.galleryButton]}
                    disabled={loading}
                >
                    <ImageIcon size={32} color={COLORS.primaryLight} strokeWidth={2} />
                    <Text style={addItemStyles.buttonText}>Dalla Galleria</Text>
                </TouchableOpacity>
            </View>
            
            {/* BANNER DUPLICATO NON-MODALE */}
            {duplicateFound && (
                <View style={duplicateBannerStyles.container}>
                    <View style={duplicateBannerStyles.iconContainer}>
                        <Text style={duplicateBannerStyles.icon}>⚠️</Text>
                    </View>
                    <View style={duplicateBannerStyles.content}>
                        <Text style={duplicateBannerStyles.title}>Capo Simile Trovato!</Text>
                        <Text style={duplicateBannerStyles.message}>
                            Hai già "{duplicateFound.name}" ({duplicateFound.category}, {duplicateFound.mainColor}). 
                            Verifica se è un duplicato prima di aggiungerlo.
                        </Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => setDuplicateFound(null)}
                        style={duplicateBannerStyles.closeButton}
                    >
                        <Text style={duplicateBannerStyles.closeIcon}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {/* Metadati (Pre-popolati da AI) */}
            <View style={addItemStyles.metadataForm}>
                <Text style={addItemStyles.metadataTitle}>Dati Articolo (Modificabili)</Text>
                
                <View style={addItemStyles.fieldGroup}>
                    <Text style={addItemStyles.label}>Nome Articolo</Text>
                    <TextInput 
                        value={metadata.name} 
                        onChangeText={text => setMetadata(prev => ({...prev, name: text}))}
                        style={addItemStyles.input} 
                        placeholder="Nome (es. Maglione Oversize)"
                        placeholderTextColor="#9CA3AF"
                        selectionColor="#4F46E5"
                    />
                </View>
                
                <View style={addItemStyles.fieldGroup}>
                    <Text style={addItemStyles.label}>Categoria</Text>
                    <TextInput 
                        value={metadata.category} 
                        onChangeText={text => setMetadata(prev => ({...prev, category: text}))}
                        style={addItemStyles.input} 
                        placeholder="Categoria (es. Maglione)"
                        placeholderTextColor="#9CA3AF"
                        selectionColor="#4F46E5"
                    />
                </View>
                
                <View style={addItemStyles.fieldGroup}>
                    <Text style={addItemStyles.label}>Colore Principale</Text>
                    <TextInput 
                        value={metadata.mainColor} 
                        onChangeText={text => setMetadata(prev => ({...prev, mainColor: text}))}
                        style={addItemStyles.input} 
                        placeholder="Colore (es. Rosso)"
                        placeholderTextColor="#9CA3AF"
                        selectionColor="#4F46E5"
                    />
                </View>
                
                <View style={addItemStyles.fieldGroup}>
                    <Text style={addItemStyles.label}>Marca</Text>
                    <TextInput 
                        value={metadata.brand} 
                        onChangeText={text => setMetadata(prev => ({...prev, brand: text}))}
                        style={addItemStyles.input} 
                        placeholder="Marca (es. Zara)"
                        placeholderTextColor="#9CA3AF"
                        selectionColor="#4F46E5"
                    />
                </View>
                
                <View style={addItemStyles.fieldGroup}>
                    <Text style={addItemStyles.label}>Taglia</Text>
                    <TextInput 
                        value={metadata.size} 
                        onChangeText={text => setMetadata(prev => ({...prev, size: text}))}
                        style={addItemStyles.input} 
                        placeholder="Taglia (es. M / 42)"
                        placeholderTextColor="#9CA3AF"
                        selectionColor="#4F46E5"
                    />
                </View>
            </View>
            
            {/* Suggerimenti E-commerce */}
            {recommendations.length > 0 && (
                <View style={recommendationStyles.container}>
                    <Text style={recommendationStyles.title}>🛍️ Suggerimenti di Articoli Correlati</Text>
                    {recommendations.map((rec, index) => (
                        <TouchableOpacity 
                            key={index} 
                            onPress={() => Linking.openURL(rec.url)}
                            style={recommendationStyles.link}
                        >
                            <Text style={{color: '#10B981', fontWeight: '500', fontSize: 14}}>
                                {rec.title} →
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Fallback: Link ricerca Google Shopping se nessun suggerimento */}
            {!loading && imagePreview && metadata.name && recommendations.length === 0 && (
                <View style={recommendationStyles.fallbackContainer}>
                    <Text style={recommendationStyles.fallbackTitle}>🔍 Cerca articoli simili</Text>
                    <TouchableOpacity 
                        onPress={() => {
                            const searchQuery = encodeURIComponent(`${metadata.name} ${metadata.category} ${metadata.brand}`.trim());
                            Linking.openURL(`https://www.google.com/search?tbm=shop&q=${searchQuery}`);
                        }}
                        style={recommendationStyles.fallbackButton}
                    >
                        <Text style={recommendationStyles.fallbackButtonText}>
                            Cerca su Google Shopping →
                        </Text>
                    </TouchableOpacity>
                </View>
            )}


            <TouchableOpacity 
                onPress={handleSubmit} 
                style={loading ? authStyles.disabledButton : addItemStyles.saveButton}
                disabled={loading}
            >
                <Text style={{color: 'white', fontWeight: '600', fontSize: 16}}>
                    {loading ? 'SALVATAGGIO...' : 'SALVA CAPO NELL\'ARMADIO'}
                </Text>
            </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};


// ====================================================================
// Componente Autenticazione (AuthScreen)
// ====================================================================

// ====================================================================
// Profile Screen (Account & Settings)
// ====================================================================
const ProfileScreen = ({ navigation, route }) => {
    const { user } = route.params || { user: { uid: 'test-user' } };
    const [itemsCount, setItemsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.uid) return;

        const itemsCollectionPath = `artifacts/${__app_id}/users/${user.uid}/items`;
        
        firestore()
            .collection(itemsCollectionPath.split('/')[0])
            .doc(itemsCollectionPath.split('/')[1])
            .collection(itemsCollectionPath.split('/')[2])
            .doc(itemsCollectionPath.split('/')[3])
            .collection('items')
            .get()
            .then((snapshot) => {
                setItemsCount(snapshot.size);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Errore caricamento stats:', error);
                setLoading(false);
            });
    }, [user]);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Sei sicuro di voler uscire?',
            [
                { text: 'Annulla', style: 'cancel' },
                { 
                    text: 'Esci', 
                    style: 'destructive',
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        navigation.replace('Auth');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={profileStyles.container}>
                {/* Header */}
                <View style={profileStyles.header}>
                    <Text style={profileStyles.headerTitle}>Profilo</Text>
                </View>

                <ScrollView 
                    style={profileStyles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* User Info Card */}
                    <View style={profileStyles.userCard}>
                        <View style={profileStyles.avatarContainer}>
                            <User size={40} color="#FFFFFF" strokeWidth={2.5} />
                        </View>
                        <Text style={profileStyles.userName}>
                            {user.email || 'Utente'}
                        </Text>
                        <Text style={profileStyles.userEmail}>
                            {user.email || 'user@example.com'}
                        </Text>
                    </View>

                    {/* Stats Card */}
                    <View style={profileStyles.statsCard}>
                        <Text style={profileStyles.sectionTitle}>Statistiche</Text>
                        <View style={profileStyles.statsRow}>
                            <View style={profileStyles.statItem}>
                                <Text style={profileStyles.statValue}>
                                    {loading ? '...' : itemsCount}
                                </Text>
                                <Text style={profileStyles.statLabel}>Capi</Text>
                            </View>
                            <View style={profileStyles.divider} />
                            <View style={profileStyles.statItem}>
                                <Text style={profileStyles.statValue}>0</Text>
                                <Text style={profileStyles.statLabel}>Outfit</Text>
                            </View>
                            <View style={profileStyles.divider} />
                            <View style={profileStyles.statItem}>
                                <Text style={profileStyles.statValue}>0</Text>
                                <Text style={profileStyles.statLabel}>Look</Text>
                            </View>
                        </View>
                    </View>

                    {/* Settings Card */}
                    <View style={profileStyles.settingsCard}>
                        <Text style={profileStyles.sectionTitle}>Impostazioni</Text>
                        
                        <TouchableOpacity style={profileStyles.settingItem}>
                            <Text style={profileStyles.settingIcon}>🌙</Text>
                            <Text style={profileStyles.settingText}>Tema Scuro</Text>
                            <Text style={profileStyles.settingValue}>Attivo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={profileStyles.settingItem}>
                            <Text style={profileStyles.settingIcon}>🔔</Text>
                            <Text style={profileStyles.settingText}>Notifiche</Text>
                            <Text style={profileStyles.settingValue}>Abilitate</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={profileStyles.settingItem}>
                            <Text style={profileStyles.settingIcon}>📱</Text>
                            <Text style={profileStyles.settingText}>Feedback Tattile</Text>
                            <Text style={profileStyles.settingValue}>Attivo</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity 
                        style={profileStyles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Text style={profileStyles.logoutText}>Esci dall'Account</Text>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

// ====================================================================
// Auth Screen (Login/Register)
// ====================================================================
const AuthScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true); 
    const [loading, setLoading] = useState(false);

    // Funzione per salvare i metadati utente in Firestore
    const saveUserMetadata = async (uid, userEmail) => {
        try {
            await firestore()
                .collection('artifacts')
                .doc(__app_id)
                .collection('users')
                .doc(uid)
                .set({
                    email: userEmail,
                    createdAt: firestore.FieldValue.serverTimestamp(),
                    lastActivity: firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            console.log("Metadati utente salvati in Firestore.");
        } catch (error) {
            console.error("Errore nel salvataggio dei metadati:", error);
        }
    };
    
    // Gestione Login / Registrazione
    const handleAuth = async () => {
        // Validazione Input
        if (!email || !password) {
            alert("Per favore inserisci email e password");
            return;
        }
        if (password.length < 6) {
            alert("La password deve essere di almeno 6 caratteri");
            return;
        }
        
        setLoading(true);
        try {
            // ❌ AUTH DISABILITATO - Login automatico con utente mock
            console.log('Login simulato per:', email);
            const mockUser = { uid: 'test-user-' + Date.now(), email: email };
            navigation.replace('Home', { user: mockUser });
            alert('Login simulato riuscito!');
        } catch (error) {
            alert("Errore: " + error.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <View style={authStyles.authContainer}>
            <Text style={authStyles.authTitle}>{isLogin ? 'Accedi al tuo Armadio' : 'Crea un Account'}</Text>
            
            <TextInput
                style={authStyles.input}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                selectionColor="#4F46E5"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            
            <TextInput
                style={authStyles.input}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                selectionColor="#4F46E5"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity 
                style={loading ? authStyles.disabledButton : authStyles.mainButton} 
                onPress={handleAuth} 
                disabled={loading}
            >
                <Text style={{color: 'white', fontWeight: '600', fontSize: 16}}>
                    {loading ? 'Caricamento...' : (isLogin ? 'Login' : 'Registrati')}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={authStyles.switchTextContainer}>
                <Text style={authStyles.switchText}>
                    {isLogin 
                        ? "Non hai un account? Registrati" 
                        : "Hai già un account? Accedi"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

// ====================================================================
// Componente Dettaglio Articolo (DetailScreen)
// ====================================================================

const DetailScreen = ({ navigation, route }) => {
    const { item } = route.params;
    const [editing, setEditing] = useState(false);
    const [editedMetadata, setEditedMetadata] = useState(item);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await firestore()
                .collection(`artifacts/${__app_id}/users/${item.userId}/items`)
                .doc(item.id)
                .set(editedMetadata, { merge: true });
            setEditing(false);
            alert("Modifiche salvate!");
        } catch (error) {
            alert("Errore nel salvataggio: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const confirmDelete = window.confirm("Sei sicuro di voler eliminare questo capo? L'azione è irreversibile e rimuoverà la foto dal cloud.");
        if (!confirmDelete) return;
        
        setLoading(true);
        try {
            // 1. Elimina il file da Storage
            if (item.storagePath) {
                await storage().ref(item.storagePath).delete();
            }
            
            // 2. Elimina il documento da Firestore
            await firestore()
                .collection(`artifacts/${__app_id}/users/${item.userId}/items`)
                .doc(item.id)
                .delete();
            
            navigation.goBack(); // Torna alla Home
        } catch (error) {
            alert("Errore nell'eliminazione: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={detailStyles.container}
        >
          <ScrollView>
            <Animated.View entering={FadeIn.delay(100).duration(300)} style={detailStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={detailStyles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <ChevronLeft size={24} color={COLORS.primary} strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={detailStyles.title}>Dettaglio Capo</Text>
            </Animated.View>

            <Animated.Image 
                source={{ uri: item.thumbnailUrl }} 
                style={detailStyles.image} 
                sharedTransitionTag={`item-${item.id}`}
                sharedTransitionStyle={(values) => {
                    'worklet';
                    return {
                        borderRadius: 10,
                        transform: [
                            { scale: values.targetOriginX !== undefined ? 1 : 0.95 }
                        ],
                        opacity: values.progress !== undefined ? values.progress : 1,
                    };
                }}
            />
            
            {editing ? (
                <View style={detailStyles.form}>
                    {/* Campi per la modifica */}
                    {['name', 'category', 'mainColor', 'brand', 'size'].map(key => (
                        <View key={key} style={detailStyles.formGroup}>
                            <Text style={detailStyles.label}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                            <TextInput
                                value={editedMetadata[key] || ''}
                                onChangeText={text => setEditedMetadata(prev => ({...prev, [key]: text}))}
                                style={detailStyles.input}
                            />
                        </View>
                    ))}
                    
                    <View style={detailStyles.buttonGroup}>
                        <TouchableOpacity onPress={handleSave} style={detailStyles.saveButton} disabled={loading}>
                            <Text style={{color: 'white', fontWeight: '600', fontSize: 16}}>
                                {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditing(false)} style={detailStyles.cancelButton}>
                            <Text style={{color: '#4B5563', fontWeight: '600', fontSize: 16}}>
                                Annulla
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <Animated.View style={detailStyles.info} entering={FadeIn.duration(200)}>
                    <Text style={detailStyles.itemName}>{item.name}</Text>
                    <Text style={detailStyles.metadata}>Categoria: {item.category}</Text>
                    <Text style={detailStyles.metadata}>Colore: {item.mainColor}</Text>
                    <Text style={detailStyles.metadata}>Marca: {item.brand}</Text>
                    <Text style={detailStyles.metadata}>Taglia: {item.size}</Text>
                    <Text style={detailStyles.metadata}>ID Capo: {item.id}</Text>
                    
                    <View style={detailStyles.buttonGroup}>
                        <TouchableOpacity onPress={() => setEditing(true)} style={detailStyles.editButton}>
                            <Text style={{color: 'white', fontWeight: '600', fontSize: 16}}>
                                Modifica
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDelete} style={detailStyles.deleteButton}>
                            <Text style={{color: 'white', fontWeight: '600', fontSize: 16}}>
                                Elimina
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
    );
};


// ====================================================================
// Componente Card Articolo e Home (HomeScreen)
// ====================================================================

// Componente per la singola card articolo
const ItemCard = ({ item, onClick }) => {
    const imageUrl = item.thumbnailUrl || `https://placehold.co/150x200/4F46E5/FFFFFF?text=${item.name.substring(0, 10)}`;
    
    return (
        <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)}>
            <TouchableOpacity style={itemCardStyles.card} onPress={() => onClick(item)}>
                <Animated.Image 
                source={{ uri: imageUrl }} 
                style={itemCardStyles.image} 
                sharedTransitionTag={`item-${item.id}`}
                sharedTransitionStyle={(values) => {
                    'worklet';
                    return {
                        borderRadius: 10,
                        transform: [
                            { scale: values.targetOriginX !== undefined ? 1.05 : 1 }
                        ],
                    };
                }}
            />
                <View style={itemCardStyles.info}>
                <Text style={itemCardStyles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={itemCardStyles.category} numberOfLines={1}>{item.category} ({item.mainColor})</Text>
                <Text style={itemCardStyles.brand} numberOfLines={1}>{item.brand} | Taglia: {item.size}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ====================================================================
// Custom Tab Bar Component (The Athletic Style - Curved con Camera Prominente)
// ====================================================================
const CustomTabBar = ({ state, descriptors, navigation }) => {
    return (
        <View style={customTabBarStyles.wrapper}>
            <View style={customTabBarStyles.container}>
                {/* Left Side Tabs */}
                <View style={customTabBarStyles.sideContainer}>
                    {state.routes.slice(0, 2).map((route, index) => {
                        const { options } = descriptors[route.key];
                        const label = options.tabBarLabel;
                        const isFocused = state.index === index;

                        const onPress = () => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        const IconComponent = route.name === 'HomeTab' ? Home : Zap;
                        const iconColor = isFocused ? COLORS.navActive : COLORS.navInactive;

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                style={customTabBarStyles.tabButton}
                                activeOpacity={0.7}
                            >
                                <IconComponent 
                                    size={24} 
                                    color={iconColor}
                                    strokeWidth={isFocused ? 2.5 : 2}
                                />
                                <Text style={[
                                    customTabBarStyles.label,
                                    isFocused && customTabBarStyles.labelActive
                                ]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Center Space for Floating Button */}
                <View style={customTabBarStyles.centerSpacer} />

                {/* Right Side Tabs */}
                <View style={customTabBarStyles.sideContainer}>
                    {state.routes.slice(3).map((route, index) => {
                        const { options } = descriptors[route.key];
                        const label = options.tabBarLabel;
                        const isFocused = state.index === index + 3;

                        const onPress = () => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        const IconComponent = User;
                        const iconColor = isFocused ? COLORS.navActive : COLORS.navInactive;

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                style={customTabBarStyles.tabButton}
                                activeOpacity={0.7}
                            >
                                <IconComponent 
                                    size={24} 
                                    color={iconColor}
                                    strokeWidth={isFocused ? 2.5 : 2}
                                />
                                <Text style={[
                                    customTabBarStyles.label,
                                    isFocused && customTabBarStyles.labelActive
                                ]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Floating Camera Button (Prominente) */}
            <TouchableOpacity
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate('AddItem');
                }}
                style={customTabBarStyles.floatingButton}
                activeOpacity={0.8}
            >
                <View style={customTabBarStyles.floatingButtonInner}>
                    <Camera size={32} color="#FFFFFF" strokeWidth={2.5} />
                </View>
            </TouchableOpacity>
        </View>
    );
};

// Componente Home (Schermata Principale App - Armadio)
const HomeScreen = ({ navigation, route }) => {
    const { user } = route.params || { user: { uid: 'test-user' } };
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [filter, setFilter] = useState({ text: '', category: '', color: '' });
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);

    // Fetch dei dati in tempo reale
    useEffect(() => {
        if (!user || !user.uid) return;

        setLoadingItems(true);
        const itemsCollectionPath = `artifacts/${__app_id}/users/${user.uid}/items`;
        
        const unsubscribe = firestore()
            .collection(itemsCollectionPath)
            .onSnapshot((snapshot) => {
                const fetchedItems = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                fetchedItems.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)); 
                
                setItems(fetchedItems);
                setLoadingItems(false);
            }, (error) => {
                console.error("Errore nel fetching degli articoli:", error);
                setLoadingItems(false);
                alert("Errore nel caricamento dell'armadio: " + error.message);
            });

        return () => unsubscribe(); 
    }, [user]);
    
    // Aggiorna le liste di categorie e colori disponibili
    useEffect(() => {
        const uniqueCategories = [...new Set(items.map(item => item.category))];
        const uniqueColors = [...new Set(items.map(item => item.mainColor))];
        setCategories(uniqueCategories.filter(Boolean));
        setColors(uniqueColors.filter(Boolean));
    }, [items]);

    // Logica di Filtro
    const filteredItems = items.filter(item => {
        const matchesText = !filter.text || 
            item.name.toLowerCase().includes(filter.text.toLowerCase()) ||
            item.brand?.toLowerCase().includes(filter.text.toLowerCase());
        const matchesCategory = !filter.category || item.category === filter.category;
        const matchesColor = !filter.color || item.mainColor === filter.color;
        return matchesText && matchesCategory && matchesColor;
    });

    const handleSignOut = async () => {
        try {
            // ❌ AUTH DISABILITATO - Logout simulato
            console.log("Logout simulato");
            navigation.replace('Auth');
        } catch (error) {
            alert("Errore Disconnessione: " + error.message);
        }
    };

    return (
        <View style={styles.contentContainer}>
            <View style={headerStyles.header}>
                <Text style={headerStyles.title}>Il Mio Armadio</Text>
                <TouchableOpacity 
                    onPress={handleSignOut} 
                    style={headerStyles.signOutButton}
                    title="Disconnetti"
                >
                    <Text style={headerStyles.signOutButtonText}>Esci</Text>
                </TouchableOpacity>
            </View>
            
            <ScrollView 
                style={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.scrollContentContainer}
            >
                {/* Componente Filtri */}
                <View style={filterStyles.container}>
                    <TextInput
                        style={filterStyles.searchInput}
                        placeholder="Cerca per nome o marca..."
                        placeholderTextColor="#9CA3AF"
                        value={filter.text}
                        onChangeText={text => setFilter(prev => ({...prev, text}))}
                    />
                    <View style={filterStyles.pickerRow}>
                        <Picker
                            selectedValue={filter.category}
                            onValueChange={value => setFilter(prev => ({...prev, category: value}))}
                            style={filterStyles.picker}
                            dropdownIconColor="#111827"
                        >
                            <Picker.Item label="Tutte le categorie" value="" />
                            {categories.map(cat => (
                                <Picker.Item key={cat} label={cat} value={cat} />
                            ))}
                        </Picker>
                        <Picker
                            selectedValue={filter.color}
                            onValueChange={value => setFilter(prev => ({...prev, color: value}))}
                            style={filterStyles.picker}
                            dropdownIconColor="#111827"
                        >
                            <Picker.Item label="Tutti i colori" value="" />
                            {colors.map(color => (
                                <Picker.Item key={color} label={color} value={color} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <Text style={styles.subtitle}>
                    Totale capi: <Text style={{fontWeight: '600'}}>{items.length}</Text> - Filtrati: <Text style={{fontWeight: '600'}}>{filteredItems.length}</Text>
                </Text>

                {loadingItems ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                        <Text style={{ marginTop: 10, color: '#333' }}>Caricamento del tuo armadio...</Text>
                    </View>
                ) : items.length === 0 ? (
                    <View style={emptyStateStyles.container}>
                        <Text style={emptyStateStyles.icon}>👚</Text>
                        <Text style={emptyStateStyles.title}>Armadio Vuoto</Text>
                        <Text style={emptyStateStyles.text}>Non hai ancora aggiunto nessun capo. Iniziamo subito!</Text>
                    </View>
                ) : (
                    <View style={itemsGridStyles.container}>
                        {filteredItems.map(item => (
                            <ItemCard 
                                key={item.id} 
                                item={item} 
                                onClick={(selectedItem) => navigation.navigate('Detail', { item: selectedItem })}
                            />
                        ))}
                    </View>
                )}
                
                {/* Padding bottom per Tab Bar */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

// ====================================================================
// Stack Navigators Annidati (per Hero Transitions)
// ====================================================================

// Home Stack (Armadio + Detail con hero transition)
const HomeStackNavigator = ({ user }) => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            animation: 'default',
            contentStyle: { backgroundColor: COLORS.background }
        }}
    >
        <Stack.Screen 
            name="HomeMain" 
            component={HomeScreen}
            initialParams={{ user }}
        />
        <Stack.Screen 
            name="Detail" 
            component={DetailScreen}
            options={{
                animation: 'default',
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                transitionSpec: {
                    open: {
                        animation: 'spring',
                        config: {
                            stiffness: 1000,
                            damping: 500,
                            mass: 3,
                            overshootClamping: true,
                            restDisplacementThreshold: 0.01,
                            restSpeedThreshold: 0.01,
                        },
                    },
                    close: {
                        animation: 'spring',
                        config: {
                            stiffness: 1000,
                            damping: 500,
                            mass: 3,
                            overshootClamping: true,
                            restDisplacementThreshold: 0.01,
                            restSpeedThreshold: 0.01,
                        },
                    },
                },
            }}
        />
    </Stack.Navigator>
);

// Outfit AI Stack
const OutfitAIStackNavigator = ({ user }) => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            animation: 'default',
            contentStyle: { backgroundColor: COLORS.background }
        }}
    >
        <Stack.Screen 
            name="OutfitBuilderMain" 
            component={OutfitBuilderScreen}
            initialParams={{ user }}
        />
    </Stack.Navigator>
);

// Profile Stack
const ProfileStackNavigator = ({ user }) => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            animation: 'default',
            contentStyle: { backgroundColor: COLORS.background }
        }}
    >
        <Stack.Screen 
            name="ProfileMain" 
            component={ProfileScreen}
            initialParams={{ user }}
        />
    </Stack.Navigator>
);

// ====================================================================
// Tab Navigator Principale (The Athletic Style)
// ====================================================================
const MainTabNavigator = ({ user }) => (
    <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
            headerShown: false,
        }}
    >
        <Tab.Screen 
            name="HomeTab" 
            options={{ 
                tabBarLabel: 'Armadio',
                tabBarAccessibilityLabel: 'Armadio'
            }}
        >
            {() => <HomeStackNavigator user={user} />}
        </Tab.Screen>
        
        <Tab.Screen 
            name="OutfitAITab" 
            options={{ 
                tabBarLabel: 'Outfit AI',
                tabBarAccessibilityLabel: 'Outfit AI Builder'
            }}
        >
            {() => <OutfitAIStackNavigator user={user} />}
        </Tab.Screen>
        
        <Tab.Screen 
            name="AddItem" 
            component={AddItemScreen}
            initialParams={{ user }}
            options={{ 
                tabBarLabel: '',
                tabBarAccessibilityLabel: 'Aggiungi Capo con Fotocamera'
            }}
        />
        
        <Tab.Screen 
            name="ProfileTab" 
            options={{ 
                tabBarLabel: 'Profilo',
                tabBarAccessibilityLabel: 'Profilo Utente'
            }}
        >
            {() => <ProfileStackNavigator user={user} />}
        </Tab.Screen>
    </Tab.Navigator>
);

// ====================================================================
// Componente Principale (Root)
// ====================================================================

const App = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    // Previeni l'auto-hide dello splash screen
    SplashScreen.preventAutoHideAsync().catch(console.warn);

    // Nascondi lo splash screen quando il caricamento è completato
    useEffect(() => {
        const hideSplash = async () => {
            if (!loading) {
                try {
                    await SplashScreen.hideAsync();
                } catch (error) {
                    console.warn('Error hiding splash screen:', error);
                }
            }
        };
        hideSplash();
    }, [loading]);

    useEffect(() => {
        // ❌ AUTH DISABILITATO - Skip diretto alla home
        const initApp = async () => {
            try {
                console.log('App inizializzata senza Auth');
                setUser({ uid: 'test-user' }); // Utente mock
                setLoading(false);
            } catch (err) {
                console.error("Errore di inizializzazione:", err);
                setLoading(false);
            }
        };

        initApp();
    }, []);

    if (loading) {
        return (
            <View style={styles.fullScreenCenter}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 10, color: COLORS.textPrimary }}>Caricamento App...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar 
                barStyle="light-content" 
                backgroundColor={COLORS.background}
                translucent={false}
            />
            <NavigationContainer>
                {user ? (
                    <MainTabNavigator user={user} />
                ) : (
                    <Stack.Navigator
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: COLORS.background }
                        }}
                    >
                        <Stack.Screen 
                            name="Auth" 
                            component={AuthScreen}
                        />
                    </Stack.Navigator>
                )}
            </NavigationContainer>
        </SafeAreaView>
    );
};

export default App;

// ====================================================================
// STILI CSS (Necessari per il corretto funzionamento in React Web)
// ====================================================================

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 0,
        margin: 0,
        maxWidth: '100%',
        position: 'relative',
    },
    fullScreenCenter: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    contentContainer: {
        padding: 20,
        flex: 1,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingBottom: 20,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

const headerStyles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
        ...Platform.select({
            android: {
                paddingTop: 16,
            },
            ios: {
                paddingTop: 0,
            }
        }),
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
        lineHeight: 28,
    },
    signOutButton: {
        backgroundColor: COLORS.error,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    signOutButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    }
});

const authStyles = {
    authContainer: {
        padding: 20,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
    },
    authTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 30,
        lineHeight: 38,
    },
    input: {
        width: '100%',
        padding: 15,
        marginBottom: 15,
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: 16,
        lineHeight: 22,
        color: COLORS.textPrimary,
    },
    mainButton: {
        width: '100%',
        padding: 15,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
        borderWidth: 0,
        cursor: 'pointer',
        marginTop: 10,
    },
    disabledButton: {
        width: '100%',
        padding: 15,
        borderRadius: 10,
        backgroundColor: COLORS.textMuted,
        borderWidth: 0,
        cursor: 'not-allowed',
        marginTop: 10,
    },
    switchTextContainer: {
        marginTop: 20,
        backgroundColor: 'transparent',
        borderWidth: 0,
        cursor: 'pointer',
    },
    switchText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '500',
    },
};

const itemsGridStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 5
  },
  item: {
    width: (Dimensions.get('window').width - 45) / 2,
    marginBottom: 15
  }
});

const itemCardStyles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 220,
        marginBottom: 16,
        // Shadow per iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        // Elevation per Android
        elevation: 8,
    },
    image: {
        width: '100%',
        height: 140,
        resizeMode: 'cover',
    },
    info: {
        padding: 12,
        flex: 1,
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 6,
        lineHeight: 20,
    },
    category: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 4,
        lineHeight: 18,
    },
    brand: {
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.textSecondary,
        lineHeight: 16,
    }
});

const fabStyles = {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    color: 'white',
    fontSize: 28,
    borderWidth: 0,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 1000,
};

const outfitButtonStyles = {
    position: 'absolute',
    bottom: 20,
    right: 86,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryDark,
    color: 'white',
    fontSize: 24,
    borderWidth: 0,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 1000,
};

// ====================================================================
// Bottom Navigation Bar Styles
// ====================================================================
// ====================================================================
// Custom Tab Bar Styles (The Athletic Style - Curved Design)
// ====================================================================
const customTabBarStyles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 90,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.navBackground,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 15,
    },
    sideContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    centerSpacer: {
        width: 80,
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    label: {
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.navInactive,
        marginTop: 4,
    },
    labelActive: {
        color: COLORS.navActive,
        fontWeight: '600',
    },
    floatingButton: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 30,
        left: '50%',
        marginLeft: -36,
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingButtonInner: {
        width: '100%',
        height: '100%',
        borderRadius: 36,
        borderWidth: 4,
        borderColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

// ====================================================================
// Profile Screen Styles
// ====================================================================
const profileStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
        lineHeight: 28,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    userCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    avatarIcon: {
        fontSize: 40,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    statsCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.border,
    },
    settingsCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    settingIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    settingText: {
        flex: 1,
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    settingValue: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    logoutButton: {
        backgroundColor: COLORS.error,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 20,
    },
    logoutText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

const emptyStateStyles = {
    container: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
        marginTop: 30,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    icon: {
        fontSize: 48,
        marginBottom: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 10,
    },
    text: {
        fontSize: 14,
        color: COLORS.textSecondary,
    }
};

const spinnerStyles = {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderLeftColor: '#4F46E5',
    borderRadius: '50%',
    width: 40,
    height: 40,
    animation: 'spin 1s linear infinite',
};

const addItemStyles = {
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 10,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 20 : 10,
        backgroundColor: COLORS.surface,
        zIndex: 2,
    },
    backButton: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        fontSize: 24,
        color: COLORS.primary,
        cursor: 'pointer',
        paddingRight: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        margin: 0,
    },
    statusText: {
        textAlign: 'center',
        marginBottom: 15,
        marginHorizontal: 20,
        color: COLORS.primary,
        fontSize: 14,
        minHeight: 20,
    },
    imageUploadArea: {
        marginBottom: 25,
        marginHorizontal: 20,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 10,
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: COLORS.surface,
    },
    imageLabel: {
        display: 'block',
        cursor: 'pointer',
    },
    placeholder: {
        padding: 30,
        marginHorizontal: 20,
        color: COLORS.textSecondary,
    },
    imagePreview: {
        width: '100%',
        maxHeight: 300,
        objectFit: 'cover',
        borderRadius: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 25,
        marginHorizontal: 20,
    },
    actionButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    cameraButton: {
        backgroundColor: COLORS.surfaceLight,
        borderColor: COLORS.primary,
    },
    galleryButton: {
        backgroundColor: COLORS.surfaceLight,
        borderColor: COLORS.primaryLight,
    },
    buttonIcon: {
        fontSize: 32,
        marginBottom: 4,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    metadataForm: {
        marginBottom: 30,
        marginHorizontal: 20,
        backgroundColor: COLORS.surface,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    },
    fieldGroup: {
        marginBottom: 16,
    },
    metadataTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 10,
    },
    label: {
        display: 'block',
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textSecondary,
        marginTop: 10,
    },
    input: {
        width: '100%',
        padding: 10,
        marginBottom: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: 16,
        color: COLORS.textPrimary,
        backgroundColor: COLORS.surface,
    },
    saveButton: {
        width: '100%',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 20,
        backgroundColor: COLORS.primary,
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
        borderWidth: 0,
        cursor: 'pointer',
    }
};

// Stili Banner Duplicato Non-Modale
const duplicateBannerStyles = {
    container: {
        flexDirection: 'row',
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 2,
        borderColor: COLORS.warning,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        marginHorizontal: 20,
        alignItems: 'flex-start',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    },
    iconContainer: {
        marginRight: 12,
    },
    icon: {
        fontSize: 24,
    },
    content: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.warning,
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    closeButton: {
        padding: 4,
    },
    closeIcon: {
        fontSize: 18,
        color: COLORS.warning,
        fontWeight: '700',
    },
};

const recommendationStyles = StyleSheet.create({
    container: {
        padding: 15,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        marginBottom: 20,
        marginTop: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 12,
        lineHeight: 24,
    },
    link: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    fallbackContainer: {
        padding: 16,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        marginBottom: 20,
        marginTop: 10,
    },
    fallbackTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 12,
        lineHeight: 20,
    },
    fallbackButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    fallbackButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    }
});

const detailStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
        ...Platform.select({
            android: {
                paddingTop: 16,
            },
            ios: {
                paddingTop: 0,
            }
        }),
    },
    backButton: {
        paddingRight: 12,
        paddingVertical: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
        lineHeight: 28,
    },
    image: {
        width: '100%',
        height: 'auto',
        borderRadius: 10,
        marginBottom: 15,
        objectFit: 'contain',
        maxHeight: 250,
        backgroundColor: COLORS.surface
    },
    form: {
        backgroundColor: COLORS.surface,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    },
    formGroup: {
        marginBottom: 10,
    },
    label: {
        display: 'block',
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textSecondary,
        marginBottom: 5,
    },
    input: {
        width: '100%',
        padding: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: 16,
        color: COLORS.textPrimary,
        backgroundColor: COLORS.surface,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    saveButton: {
        flex: 1,
        padding: 10,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
        borderWidth: 0,
        cursor: 'pointer',
        marginRight: 10,
    },
    cancelButton: {
        flex: 1,
        padding: 10,
        borderRadius: 6,
        backgroundColor: COLORS.surfaceLight,
        color: COLORS.textSecondary,
        fontWeight: '600',
        fontSize: 16,
        borderWidth: 0,
        cursor: 'pointer',
    },
    info: {
        marginBottom: 15,
    },
    itemName: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.textPrimary,
        margin: 0,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 5
    },
    metadata: {
        fontSize: 16,
        color: COLORS.textSecondary,
        margin: 5,
    },
    editButton: {
        flex: 1,
        padding: 10,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
        borderWidth: 0,
        cursor: 'pointer',
        marginRight: 10,
    },
    deleteButton: {
        flex: 1,
        padding: 10,
        borderRadius: 6,
        backgroundColor: COLORS.error,
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
        borderWidth: 0,
        cursor: 'pointer',
    },
});

const filterStyles = {
    container: {
        marginBottom: 20,
    },
    searchInput: {
        width: '100%',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        color: COLORS.textPrimary,
        fontSize: 15,
        marginBottom: 10,
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
    },
    pickerRow: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    picker: {
        flex: 1,
        minWidth: 145,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        color: COLORS.textPrimary,
        fontSize: 14,
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
    }
};

const outfitStyles = {
    container: {
        padding: 20,
        flex: 1,
        backgroundColor: COLORS.background,
    },
    inputArea: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    },
    textarea: {
        width: '100%',
        padding: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 10,
        fontSize: 16,
        resize: 'vertical',
        color: COLORS.textPrimary,
        backgroundColor: COLORS.surface,
        textAlignVertical: 'top',
    },
    generateButton: {
        width: '100%',
        padding: 12,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
        borderWidth: 0,
        cursor: 'pointer',
    },
    resultBox: {
        padding: 20,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginBottom: 30,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 12,
        lineHeight: 26,
    },
    resultText: {
        color: COLORS.textPrimary,
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '400',
    },
    inventoryPreview: {
        padding: 15,
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    inventoryTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 12,
        lineHeight: 22,
    },
    itemList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    itemTag: {
        backgroundColor: '#D1D5DB',
        color: '#374151',
        padding: 5,
        borderRadius: 5,
        fontSize: 12,
    },
    note: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
    }
};


// Miglioramento della compressione immagini
// ❌ FUNZIONE RIMOSSA - compressImage non necessaria (usiamo Base64 direttamente)
// La compressione è già gestita da ImagePicker con quality: 0.7

// Aggiungi gestione permessi fotocamera
const requestCameraPermissions = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permesso negato',
      'Abbiamo bisogno dei permessi della fotocamera per scattare foto.'
    );
    return false;
  }
  return true;
};
