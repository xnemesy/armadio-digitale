import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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

// Inizializza TUTTI i servizi subito, incluso Auth con getAuth
let auth, db, storage;

try {
    console.log('🔐 Inizializzando Auth con getAuth diretto...');
    auth = getAuth(app);
    console.log('✅ Auth inizializzato con getAuth');
} catch (error) {
    console.error('❌ Errore Auth:', error);
    auth = null;
}

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

// Funzione semplice per ottenere auth
async function getAuthInstance() {
    if (auth) {
        console.log('✅ Auth instance disponibile');
        return auth;
    } else {
        throw new Error('Auth non disponibile');
    }
}

export { auth, db, storage, getAuthInstance };
export default app;