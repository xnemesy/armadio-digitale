// Test semplificato Firebase (senza autenticazione anonima)
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBwEIW-PsXyc5stjfuvWug2PZ_j8PLwCnM",
    authDomain: "armadiodigitale.firebaseapp.com",
    projectId: "armadiodigitale",
    storageBucket: "armadiodigitale.firebasestorage.app",
    messagingSenderId: "880569534087",
    appId: "1:880569534087:web:731ba708ffe10642965a22",
    measurementId: "G-0WY4W91L0M"
};

console.log("🔥 Inizializzazione Firebase...");

try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    
    console.log("✅ Firebase inizializzato correttamente!");
    console.log("✅ Auth disponibile:", !!auth);
    console.log("✅ Firestore disponibile:", !!db);
    console.log("✅ Storage disponibile:", !!storage);
    
    // Test delle funzioni principali usate nell'app
    console.log("📋 Funzioni disponibili:");
    console.log("  - createUserWithEmailAndPassword:", typeof createUserWithEmailAndPassword);
    console.log("  - signInWithEmailAndPassword:", typeof signInWithEmailAndPassword);
    console.log("  - doc (Firestore):", typeof doc);
    console.log("  - setDoc (Firestore):", typeof setDoc);
    console.log("  - ref (Storage):", typeof ref);
    
    console.log("🎉 Configurazione Firebase sembra valida!");
    
} catch (error) {
    console.error("❌ Errore nell'inizializzazione Firebase:", error);
}