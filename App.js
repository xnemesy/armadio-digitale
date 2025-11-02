import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as SplashScreen from 'expo-splash-screen';
import { initializeApp } from 'firebase/app';
// ❌ FIREBASE AUTH NON FUNZIONA IN REACT NATIVE - COMMENTATO
// import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

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

// *** CHIAVE API GEMINI - Caricata da variabile d'ambiente ***
const apiKey = process.env.GEMINI_API_KEY || ""; 

// LA TUA CONFIGURAZIONE CORRETTA DI FIREBASE - Usando variabili d'ambiente
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: "armadiodigitale.firebaseapp.com",
    projectId: "armadiodigitale",
    storageBucket: "armadiodigitale.firebasestorage.app",
    messagingSenderId: "880569534087",
    appId: "1:880569534087:web:731ba708ffe10642965a22",
    measurementId: "G-0WY4W91L0M"
};

// Inizializzazione
const app = initializeApp(firebaseConfig);
// ❌ AUTH COMMENTATO - NON FUNZIONA IN REACT NATIVE
// const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 


// ====================================================================
// LOGICA GEMINI API (Analisi Immagine e Suggerimenti)
// ====================================================================

/**
 * Chiama l'API Gemini per analizzare l'immagine e ottenere metadati strutturati.
 * @param {string} base64Image - Immagine in formato Base64.
 * @returns {Promise<object>} Oggetto JSON con nome, categoria e colore.
 */
const analyzeImageWithGemini = async (base64Image) => {
    const userPrompt = "Analizza questo capo d'abbigliamento in foto. Identifica la Categoria principale (es. Maglione, Jeans, Vestito), il Colore principale e fornisci un Nome breve e descrittivo (massimo 4 parole). Restituisci la risposta in formato JSON.";
    
    const responseSchema = {
        type: "OBJECT",
        properties: {
            "name": { "type": "STRING", "description": "Nome breve e descrittivo del capo." },
            "category": { "type": "STRING", "description": "Categoria principale del capo (es. Maglione, Jeans, Vestito)." },
            "mainColor": { "type": "STRING", "description": "Colore dominante in italiano (es. Blu, Rosso, Grigio)." }
        },
        required: ["name", "category", "mainColor"]
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: userPrompt },
                    {
                        inlineData: {
                            mimeType: "image/png", 
                            data: base64Image
                        }
                    }
                ]
            }
        ],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
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
                const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (jsonText) {
                    return JSON.parse(jsonText);
                }
            } else if (response.status === 429 && attempt < 4) {
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw new Error(`API response error: ${response.status} ${response.statusText}`);

        } catch (error) {
            if (attempt === 4) throw error; 
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error("Impossibile analizzare l'immagine dopo diversi tentativi.");
};

/**
 * Chiama l'API Gemini con Google Search attivo per trovare link di shopping correlati.
 * @param {string} itemDescription - Descrizione del capo da cui partire per la ricerca.
 * @returns {Promise<Array>} Array di oggetti con titolo e url.
 */
const getShoppingRecommendations = async (itemDescription) => {
    const userQuery = `Trova 3 link di acquisto per articoli correlati o simili a: ${itemDescription}. Fornisci il titolo del link e l'URL.`;
    
    const responseSchema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                "title": { "type": "STRING" },
                "url": { "type": "STRING" }
            },
            required: ["title", "url"]
        }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        // ABILITIAMO GOOGLE SEARCH (Grounding)
        tools: [{ "google_search": {} }], 
        systemInstruction: {
            parts: [{ text: "Agisci come un personal shopper esperto. Restituisci esattamente 3 suggerimenti di shopping in formato JSON." }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
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
                const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (jsonText) {
                    return JSON.parse(jsonText);
                }
            } else if (response.status === 429 && attempt < 4) {
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw new Error(`API response error: ${response.status} ${response.statusText}`);
        } catch (error) {
            if (attempt === 4) throw error; 
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return []; // Restituisce un array vuoto in caso di fallimento
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

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
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

const OutfitBuilderScreen = ({ user, setViewMode, items }) => {
    const [request, setRequest] = useState('');
    const [suggestion, setSuggestion] = useState(null);
    const [loading, setLoading] = useState(false);

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
                <TouchableOpacity onPress={() => setViewMode('home')} style={detailStyles.backButton}>
                    <Text style={{color: '#4F46E5', fontSize: 18}}>← Indietro</Text>
                </TouchableOpacity>
                <Text style={detailStyles.title}>👗 Outfit Builder AI</Text>
            </View>

            <View style={outfitStyles.inputArea}>
                <TextInput
                    style={outfitStyles.textarea}
                    placeholder="Esempio: Outfit casual per un aperitivo estivo o Abbinamento elegante per una riunione..."
                    value={request}
                    onChangeText={setRequest}
                    multiline
                />
                <TouchableOpacity 
                    onPress={handleGenerate} 
                    style={loading ? authStyles.disabledButton : outfitStyles.generateButton}
                    disabled={loading}
                >
                    <Text style={{color: 'white', fontWeight: '600', fontSize: 16}}>
                        {loading ? 'Generazione in corso...' : 'Genera Outfit'}
                    </Text>
                </TouchableOpacity>
            </View>
            
            {suggestion && (
                <View style={outfitStyles.resultBox}>
                    <Text style={outfitStyles.resultTitle}>Suggerimento del tuo Stylist AI</Text>
                    <Text style={outfitStyles.resultText}>{suggestion}</Text>
                </View>
            )}
            
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
        </View>
    );
};


// ====================================================================
// Componente Aggiunta Articolo (AddItemScreen)
// ====================================================================

const AddItemScreen = ({ user, setViewMode }) => {
    const [imageBase64, setImageBase64] = useState(null); // Base64 string
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
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 4], 
                quality: 0.7, 
                base64: true, // IMPORTANTE: Abilitiamo la generazione Base64
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                const base64 = result.assets[0].base64;
                
                setImagePreview(uri);
                
                // Salviamo la stringa Base64 nello stato
                setImageBase64(base64); 
                
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
    
    // Funzione per cercare duplicati in Firestore
    const checkDuplicate = async (aiMetadata) => {
        const itemsCollectionRef = collection(db, `artifacts/${__app_id}/users/${user.uid}/items`);
        
        // Query per cercare capi con la stessa Categoria e Colore
        const q = query(
            itemsCollectionRef, 
            where('category', '==', aiMetadata.category), 
            where('mainColor', '==', aiMetadata.mainColor)
        );

        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            return snapshot.docs[0].data(); // Restituisce il primo duplicato trovato
        }
        return null;
    };

    // Analisi AI e verifica duplicati
    const analyzeAndCheck = async (base64Content) => {
        // 🔧 DEBUG: AI temporaneamente disabilitata per isolare problema Blob
        setLoading(false);
        setStatus('⚠️ AI disabilitata - Inserisci nome, categoria e colore manualmente per testare upload');
        console.log('🔧 DEBUG MODE: Gemini AI disabilitata');
        return;
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
        // Ora controlliamo imageBase64
        if (!imageBase64 || !metadata.name || !metadata.category || !metadata.mainColor) {
            Alert.alert("Dati mancanti", "Per favore, seleziona un'immagine e verifica i metadati essenziali (Nome, Categoria, Colore).");
            return;
        }

        setLoading(true);
        setStatus('Caricamento su Firebase Storage...');

        try {
            const itemId = Date.now().toString();
            // Usiamo jpg come estensione di default
            const filePath = `artifacts/${__app_id}/users/${user.uid}/items/${itemId}.jpg`;
            
            const fileRef = storageRef(storage, filePath);

            // ==================================================
            // ECCO LA CORREZIONE CHIAVE
            // Usiamo uploadString con il formato Base64 invece di uploadBytes
            const snapshot = await uploadString(fileRef, imageBase64, 'base64');
            // ==================================================
            
            const fullSizeUrl = await getDownloadURL(snapshot.ref);

            setStatus('File caricato. Salvataggio su Firestore...');

            const thumbnailUrl = fullSizeUrl;
            
            const itemData = {
                ...metadata,
                userId: user.uid,
                storagePath: filePath,
                thumbnailUrl: thumbnailUrl,
                createdAt: serverTimestamp(),
            };

            const itemsCollectionRef = collection(db, `artifacts/${__app_id}/users/${user.uid}/items`);
            await setDoc(doc(itemsCollectionRef, itemId), itemData); 

            setStatus('Capo aggiunto con successo all\'armadio!');
            
            Alert.alert("Successo", "Capo aggiunto!");
            setViewMode('home');

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
        <View style={addItemStyles.container}>
            <View style={addItemStyles.header}>
                <TouchableOpacity onPress={() => setViewMode('home')} style={addItemStyles.backButton}>
                    <Text style={{color: '#4F46E5', fontSize: 18}}>← Indietro</Text>
                </TouchableOpacity>
                <Text style={addItemStyles.title}>Aggiungi Nuovo Capo</Text>
            </View>
            
            <Text style={addItemStyles.statusText}>
                 {loading && <ActivityIndicator size="small" color="#4F46E5" style={{marginRight: 8}} />}
                 {status}
            </Text>

            {/* Area Caricamento Immagine */}
            <TouchableOpacity 
                onPress={handleImageChange} 
                style={addItemStyles.imageUploadArea}
                disabled={loading}
            >
                {imagePreview ? (
                    <Image source={{ uri: imagePreview }} style={addItemStyles.imagePreview} />
                ) : (
                    <View style={addItemStyles.placeholder}>
                        <Text style={{ fontSize: 32, color: '#6B7280' }}>📷</Text>
                        <Text style={{ color: '#6B7280' }}>Scatta o carica una foto</Text>
                    </View>
                )}
            </TouchableOpacity>
            
            {/* MESSAGGIO DUPLICATO */}
            {duplicateFound && (
                <View style={duplicateWarningStyles}>
                    <Text style={{fontWeight: '600'}}>⚠️ Capo Simile Trovato!</Text>
                    <Text style={{marginTop: 5, fontSize: 14}}>
                        Hai già un articolo di tipo **{duplicateFound.category}** di colore **{duplicateFound.mainColor}** chiamato "{duplicateFound.name}". 
                        Se non è un duplicato, puoi procedere con l'aggiunta.
                    </Text>
                </View>
            )}
            
            {/* Metadati (Pre-popolati da AI) */}
            <View style={addItemStyles.metadataForm}>
                <Text style={addItemStyles.metadataTitle}>Dati Articolo (Modificabili)</Text>
                
                <Text style={addItemStyles.label}>Nome Articolo (AI):</Text>
                <TextInput 
                    value={metadata.name} 
                    onChangeText={text => setMetadata(prev => ({...prev, name: text}))}
                    style={addItemStyles.input} 
                    placeholder="Nome (es. Maglione Oversize)" 
                />
                
                <Text style={addItemStyles.label}>Categoria (AI):</Text>
                <TextInput 
                    value={metadata.category} 
                    onChangeText={text => setMetadata(prev => ({...prev, category: text}))}
                    style={addItemStyles.input} 
                    placeholder="Categoria (es. Maglione)" 
                />
                
                <Text style={addItemStyles.label}>Colore Principale (AI):</Text>
                <TextInput 
                    value={metadata.mainColor} 
                    onChangeText={text => setMetadata(prev => ({...prev, mainColor: text}))}
                    style={addItemStyles.input} 
                    placeholder="Colore (es. Rosso)" 
                />
                
                <Text style={addItemStyles.label}>Marca:</Text>
                <TextInput 
                    value={metadata.brand} 
                    onChangeText={text => setMetadata(prev => ({...prev, brand: text}))}
                    style={addItemStyles.input} 
                    placeholder="Marca (es. Zara)" 
                />
                
                <Text style={addItemStyles.label}>Taglia:</Text>
                <TextInput 
                    value={metadata.size} 
                    onChangeText={text => setMetadata(prev => ({...prev, size: text}))}
                    style={addItemStyles.input} 
                    placeholder="Taglia (es. M / 42)" 
                />
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


            <TouchableOpacity 
                onPress={handleSubmit} 
                style={loading ? authStyles.disabledButton : addItemStyles.saveButton}
                disabled={loading}
            >
                <Text style={{color: 'white', fontWeight: '600', fontSize: 16}}>
                    {loading ? 'SALVATAGGIO...' : 'SALVA CAPO NELL\'ARMADIO'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};


// ====================================================================
// Componente Autenticazione (AuthScreen)
// ====================================================================

const AuthScreen = ({ setViewMode }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true); 
    const [loading, setLoading] = useState(false);

    // Funzione per salvare i metadati utente in Firestore
    const saveUserMetadata = async (uid, userEmail) => {
        const userRef = doc(db, 'artifacts', __app_id, 'users', uid);
        try {
            await setDoc(userRef, {
                email: userEmail,
                createdAt: new Date(),
                lastActivity: new Date(),
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
            setUser(mockUser);
            setViewMode('home');
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
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            
            <TextInput
                style={authStyles.input}
                placeholder="Password"
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

const DetailScreen = ({ item, setViewMode, onDelete }) => {
    const [editing, setEditing] = useState(false);
    const [editedMetadata, setEditedMetadata] = useState(item);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const itemRef = doc(db, `artifacts/${__app_id}/users/${item.userId}/items/${item.id}`);
            // Usiamo setDoc per sovrascrivere o unire i metadati modificati
            await setDoc(itemRef, editedMetadata, { merge: true });
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
                const fileRef = storageRef(storage, item.storagePath);
                await deleteObject(fileRef);
            }
            
            // 2. Elimina il documento da Firestore
            const itemRef = doc(db, `artifacts/${__app_id}/users/${item.userId}/items/${item.id}`);
            await deleteDoc(itemRef);
            
            onDelete(); // Aggiorna lo stato nel genitore (HomeScreen)
            setViewMode('home');
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
            <View style={detailStyles.header}>
                <TouchableOpacity onPress={() => setViewMode('home')} style={detailStyles.backButton}>
                    <Text style={{color: '#4F46E5', fontSize: 18}}>← Indietro</Text>
                </TouchableOpacity>
                <Text style={detailStyles.title}>Dettaglio Capo</Text>
            </View>

            <Image source={{ uri: item.thumbnailUrl }} style={detailStyles.image} />
            
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
                <View style={detailStyles.info}>
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
                </View>
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
        <TouchableOpacity style={itemCardStyles.card} onPress={() => onClick(item)}>
            <Image source={{ uri: imageUrl }} style={itemCardStyles.image} />
            <View style={itemCardStyles.info}>
                <Text style={itemCardStyles.name}>{item.name}</Text>
                <Text style={itemCardStyles.category}>{item.category} ({item.mainColor})</Text>
                <Text style={itemCardStyles.brand}>{item.brand} | Taglia: {item.size}</Text>
            </View>
        </TouchableOpacity>
    );
};

// Componente Home (Schermata Principale App - Armadio)
const HomeScreen = ({ user, setViewMode }) => {
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [filter, setFilter] = useState({ text: '', category: '', color: '' });
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);

    // Fetch dei dati in tempo reale
    useEffect(() => {
        if (!user || !user.uid) return;

        setLoadingItems(true);
        const itemsCollectionPath = `artifacts/${__app_id}/users/${user.uid}/items`;
        
        const itemsQuery = query(collection(db, itemsCollectionPath));
        
        const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
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
            setUser(null);
            setViewMode('auth');
        } catch (error) {
            alert("Errore Disconnessione: " + error.message);
        }
    };

    // Navigazione a Dettaglio Articolo
    if (selectedItem) {
        return (
            <DetailScreen 
                item={selectedItem}
                setViewMode={setViewMode}
                onDelete={() => setSelectedItem(null)} // Quando l'articolo è eliminato, torna alla Home
            />
        );
    }

    return (
        <View style={styles.contentContainer}>
            <View style={headerStyles.header}>
                <Text style={headerStyles.title}>Il Mio Armadio</Text>
                <TouchableOpacity 
                    onPress={handleSignOut} 
                    style={headerStyles.signOutButton}
                    title="Disconnetti"
                >
                    <Text style={{color: 'white', fontWeight: '600'}}>Esci</Text>
                </TouchableOpacity>
            </View>
            
            {/* Componente Filtri */}
            <View style={filterStyles.container}>
                <TextInput
                    style={filterStyles.input}
                    placeholder="Cerca per nome o marca..."
                    value={filter.text}
                    onChangeText={text => setFilter(prev => ({...prev, text}))}
                />
                <Picker
                    selectedValue={filter.category}
                    onValueChange={value => setFilter(prev => ({...prev, category: value}))}
                    style={filterStyles.select}
                >
                    <Picker.Item label="Tutte le categorie" value="" />
                    {categories.map(cat => (
                        <Picker.Item key={cat} label={cat} value={cat} />
                    ))}
                </Picker>
                <Picker
                    selectedValue={filter.color}
                    onValueChange={value => setFilter(prev => ({...prev, color: value}))}
                    style={filterStyles.select}
                >
                    <Picker.Item label="Tutti i colori" value="" />
                    {colors.map(color => (
                        <Picker.Item key={color} label={color} value={color} />
                    ))}
                </Picker>
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
                            onClick={setSelectedItem} // Cliccando sulla card si apre il dettaglio
                        />
                    ))}
                </View>
            )}

            <TouchableOpacity 
                onPress={() => setViewMode('add')} 
                style={fabStyles}
                title="Aggiungi nuovo capo"
            >
                <Text style={{fontSize: 28, color: 'white'}}>➕</Text>
            </TouchableOpacity>
             <TouchableOpacity 
                onPress={() => setViewMode('outfit')} 
                style={outfitButtonStyles}
                title="Genera Outfit con AI"
            >
                <Text style={{fontSize: 24, color: 'white'}}>🤖</Text>
            </TouchableOpacity>
        </View>
    );
};

// ====================================================================
// Componente Principale (Root) - MANTIENI SOLO QUESTO
// ====================================================================

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('home'); 
    const [items, setItems] = useState([]);

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

    // Fetch dei dati per l'Outfit Builder (duplica la logica di fetching da HomeScreen)
    useEffect(() => {
        if (!user || !user.uid) return;

        const itemsCollectionPath = `artifacts/${__app_id}/users/${user.uid}/items`;
        const itemsQuery = query(collection(db, itemsCollectionPath));
        
        // Questo listener è necessario per passare l'inventario aggiornato all'Outfit Builder
        const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
            const fetchedItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setItems(fetchedItems);
        }, (error) => {
            console.error("Errore nel fetching globale degli articoli:", error);
        });

        return () => unsubscribe(); 
    }, [user]);


    useEffect(() => {
        // ❌ AUTH DISABILITATO - Skip diretto alla home
        const initApp = async () => {
            try {
                console.log('App inizializzata senza Auth');
                setUser({ uid: 'test-user' }); // Utente mock
                setLoading(false);
                setViewMode('home');
            } catch (err) {
                console.error("Errore di inizializzazione:", err);
                setLoading(false);
                setViewMode('home'); // Anche in caso di errore vai alla home
            }
        };

        initApp();

        return () => {}; // Nessun cleanup necessario
    }, []);

    if (loading) {
        return (
            <View style={styles.fullScreenCenter}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={{ marginTop: 10, color: '#333' }}>Caricamento App...</Text>
            </View>
        );
    }

    let CurrentComponent;
    if (!user) {
        CurrentComponent = AuthScreen;
    } else if (viewMode === 'add') {
        CurrentComponent = AddItemScreen;
    } else if (viewMode === 'outfit') {
        CurrentComponent = OutfitBuilderScreen;
    } else {
        CurrentComponent = HomeScreen;
    }

    return (
        <View style={styles.container}>
            <CurrentComponent user={user} setViewMode={setViewMode} items={items} />
        </View>
    );
};

export default App;

// ====================================================================
// STILI CSS (Necessari per il corretto funzionamento in React Web)
// ====================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FB',
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
        backgroundColor: '#F7F9FB',
    },
    contentContainer: {
        padding: 20,
        flex: 1,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
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

const headerStyles = {
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        margin: 0,
    },
    signOutButton: {
        backgroundColor: '#EF4444', 
        color: '#FFFFFF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        fontWeight: '600',
        borderWidth: 0,
        cursor: 'pointer',
    }
}

const authStyles = {
    authContainer: {
        padding: 20,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    authTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 30,
    },
    input: {
        width: '100%',
        padding: 15,
        marginBottom: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        fontSize: 16,
        color: '#374151',
    },
    mainButton: {
        width: '100%',
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#4F46E5', // Indigo-600
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
        borderWidth: 0,
        cursor: 'pointer',
        marginTop: 10,
    },
    disabledButton: {
        opacity: 0.7,
        cursor: 'not-allowed',
    },
    switchTextContainer: {
        marginTop: 20,
        backgroundColor: 'transparent',
        borderWidth: 0,
        cursor: 'pointer',
    },
    switchText: {
        color: '#4F46E5',
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

const itemCardStyles = {
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        transition: 'transform 0.2s',
        display: 'flex',
        flexDirection: 'column',
        height: 220,
        cursor: 'pointer', // Rende la card cliccabile
    },
    image: {
        width: '100%',
        height: '60%',
        objectFit: 'cover',
    },
    info: {
        padding: 10,
        height: '40%',
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        margin: 0,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    category: {
        fontSize: 12,
        color: '#4F46E5',
        margin: 0,
    },
    brand: {
        fontSize: 10,
        color: '#9CA3AF',
        margin: 0,
    }
};

const fabStyles = {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
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
    right: 86, // Posizionato a sinistra del FAB (20px + 56px + 10px spazio)
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669', // Verde per l'AI
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

const emptyStateStyles = {
    container: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginTop: 30,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    icon: {
        fontSize: 48,
        marginBottom: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 10,
    },
    text: {
        fontSize: 14,
        color: '#6B7280',
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
        padding: 20,
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 10,
    },
    backButton: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        fontSize: 24,
        color: '#4F46E5',
        cursor: 'pointer',
        paddingRight: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        margin: 0,
    },
    statusText: {
        textAlign: 'center',
        marginBottom: 15,
        color: '#4F46E5',
        fontSize: 14,
        minHeight: 20,
    },
    imageUploadArea: {
        marginBottom: 25,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 10,
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: '#FFFFFF',
    },
    imageLabel: {
        display: 'block',
        cursor: 'pointer',
    },
    placeholder: {
        padding: 30,
        color: '#6B7280',
    },
    imagePreview: {
        width: '100%',
        maxHeight: 300,
        objectFit: 'cover',
        borderRadius: 10,
    },
    metadataForm: {
        marginBottom: 30,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    metadataTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 10,
    },
    label: {
        display: 'block',
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
        marginTop: 10,
    },
    input: {
        width: '100%',
        padding: 10,
        marginBottom: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        fontSize: 16,
        color: '#374151',
    },
    saveButton: {
        width: '100%',
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#10B981', // Emerald-500
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
        borderWidth: 0,
        cursor: 'pointer',
    }
};

const duplicateWarningStyles = {
    padding: 15,
    backgroundColor: '#FFFBEB', 
    borderWidth: 1,
    borderColor: '#F59E0B',
    color: '#92400E',
    borderRadius: 8,
    marginBottom: 20,
    fontWeight: '600',
    fontSize: 16
};

const recommendationStyles = {
    container: {
        padding: 15,
        backgroundColor: '#ECFDF5', 
        borderWidth: 1,
        borderColor: '#10B981',
        borderRadius: 8,
        marginBottom: 30,
        marginTop: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#065F46',
        marginBottom: 10,
    },
    link: {
        display: 'block',
        color: '#10B981',
        fontWeight: '500',
        textDecoration: 'none',
        padding: '5px 0',
        borderBottomWidth: 1,
        borderBottomColor: '#A7F3D0',
        fontSize: 14
    }
};

const detailStyles = {
    container: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 10,
    },
    backButton: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        fontSize: 24,
        color: '#4F46E5',
        cursor: 'pointer',
        paddingRight: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        margin: 0,
    },
    image: {
        width: '100%',
        height: 'auto',
        borderRadius: 10,
        marginBottom: 15,
        objectFit: 'contain',
        maxHeight: 250,
        backgroundColor: '#F3F4F6'
    },
    form: {
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    formGroup: {
        marginBottom: 10,
    },
    label: {
        display: 'block',
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 5,
    },
    input: {
        width: '100%',
        padding: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        fontSize: 16,
        color: '#374151',
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
        backgroundColor: '#10B981', // Emerald-500
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
        backgroundColor: '#D1D5DB', 
        color: '#4B5563',
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
        color: '#1F2937',
        margin: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 5
    },
    metadata: {
        fontSize: 16,
        color: '#374151',
        margin: 5,
    },
    editButton: {
        flex: 1,
        padding: 10,
        borderRadius: 6,
        backgroundColor: '#4F46E5', // Indigo-600
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
        backgroundColor: '#EF4444', // Rosso-600
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
        borderWidth: 0,
        cursor: 'pointer',
    },
};

const filterStyles = {
    container: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    input: {
        flex: 1,
        minWidth: 150,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    select: {
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        flex: 1,
        minWidth: 120,
    }
};

const outfitStyles = {
    container: {
        padding: 20,
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    inputArea: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    textarea: {
        width: '100%',
        padding: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        marginBottom: 10,
        fontSize: 16,
        resize: 'vertical',
    },
    generateButton: {
        width: '100%',
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#059669', // Verde scuro per l'azione AI
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
        borderWidth: 0,
        cursor: 'pointer',
    },
    resultBox: {
        padding: 20,
        borderRadius: 12,
        backgroundColor: '#E0F2F1', // Verde chiaro
        borderWidth: 1,
        borderColor: '#26A69A',
        marginBottom: 30,
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#004D40',
        marginBottom: 10,
    },
    resultText: {
        whiteSpace: 'pre-wrap', // Mantiene la formattazione del testo AI
        color: '#004D40',
        fontSize: 16,
        lineHeight: 1.6,
    },
    inventoryPreview: {
        padding: 15,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    inventoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 10,
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