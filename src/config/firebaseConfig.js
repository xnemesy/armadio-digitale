import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBwEIW-PsXyc5stjfuvWug2PZ_j8PLwCnM",
    authDomain: "armadiodigitale.firebaseapp.com",
    projectId: "armadiodigitale",
    storageBucket: "armadiodigitale.firebasestorage.app",
    messagingSenderId: "880569534087",
    appId: "1:880569534087:web:731ba708ffe10642965a22",
    measurementId: "G-0WY4W91L0M"
};

// Inizializza Firebase
let app;
if (getApps().length === 0) {
    console.log('🔥 Inizializzando Firebase...');
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase inizializzato');
} else {
    app = getApps()[0];
    console.log('✅ Firebase già inizializzato');
}

// Inizializza SOLO Firestore e Storage (che funzionano!)
let db, storage;

try {
    db = getFirestore(app);
    console.log('✅ Firestore inizializzato');
} catch (error) {
    console.error('❌ Errore Firestore:', error);
}

try {
    storage = getStorage(app);
    console.log('✅ Storage inizializzato');
} catch (error) {
    console.error('❌ Errore Storage:', error);
}

// Simulazione utente per testing (senza Auth)
const simulatedUser = {
    uid: 'demo-user-' + Date.now(),
    email: 'demo@armadio.com',
    displayName: 'Utente Demo'
};

console.log('👤 Modalità Demo - utente simulato:', simulatedUser.email);

// Funzioni per simulare autenticazione
async function getCurrentUser() {
    return simulatedUser;
}

async function testFirebaseServices() {
    try {
        console.log('🧪 Test Firestore...');
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        
        const testDoc = await addDoc(collection(db, 'test-no-auth'), {
            message: 'Test senza autenticazione',
            timestamp: serverTimestamp(),
            user: simulatedUser.uid
        });
        
        console.log('✅ Firestore test OK:', testDoc.id);
        
        console.log('🧪 Test Storage...');
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        
        // Usa uploadBytes invece di uploadString per React Native
        const testData = new Uint8Array([72, 101, 108, 108, 111, 32, 70, 105, 114, 101, 98, 97, 115, 101]); // "Hello Firebase"
        const testRef = ref(storage, `test-no-auth/${simulatedUser.uid}/test-${Date.now()}.txt`);
        
        await uploadBytes(testRef, testData);
        const downloadUrl = await getDownloadURL(testRef);
        
        console.log('✅ Storage test OK:', downloadUrl);
        
        return {
            firestore: true,
            storage: true,
            auth: false,
            user: simulatedUser
        };
        
    } catch (error) {
        console.error('❌ Errore test servizi:', error);
        throw error;
    }
}

export { db, storage, getCurrentUser, testFirebaseServices };
export default app;