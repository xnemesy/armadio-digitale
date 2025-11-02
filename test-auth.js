// Test autenticazione email/password Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBwEIW-PsXyc5stjfuvWug2PZ_j8PLwCnM",
    authDomain: "armadiodigitale.firebaseapp.com",
    projectId: "armadiodigitale",
    storageBucket: "armadiodigitale.firebasestorage.app",
    messagingSenderId: "880569534087",
    appId: "1:880569534087:web:731ba708ffe10642965a22",
    measurementId: "G-0WY4W91L0M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const testEmail = `test-${Date.now()}@example.com`;
const testPassword = "test123456";

console.log("🔥 Test autenticazione Firebase...");
console.log("📧 Email di test:", testEmail);

async function testAuth() {
    try {
        // Test 1: Registrazione nuovo utente
        console.log("📝 Test 1: Creazione nuovo utente...");
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        console.log("✅ Utente creato con successo! UID:", userCredential.user.uid);

        // Test 2: Salvataggio metadati utente in Firestore
        console.log("💾 Test 2: Salvataggio metadati utente...");
        const userRef = doc(db, 'artifacts', 'armadio-digitale-demo', 'users', userCredential.user.uid);
        await setDoc(userRef, {
            email: userCredential.user.email,
            createdAt: new Date(),
            lastActivity: new Date(),
        }, { merge: true });
        console.log("✅ Metadati utente salvati in Firestore!");

        // Test 3: Logout
        console.log("🔐 Test 3: Logout...");
        await signOut(auth);
        console.log("✅ Logout riuscito!");

        // Test 4: Login con le stesse credenziali
        console.log("🔑 Test 4: Login con credenziali esistenti...");
        const loginCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        console.log("✅ Login riuscito! UID:", loginCredential.user.uid);

        console.log("🎉 Tutti i test di autenticazione sono passati!");
        
        return {
            success: true,
            uid: loginCredential.user.uid,
            email: loginCredential.user.email
        };

    } catch (error) {
        console.error("❌ Errore nei test di autenticazione:", error.code, error.message);
        return {
            success: false,
            error: error.code,
            message: error.message
        };
    }
}

// Esegui i test
testAuth().then(result => {
    console.log("🔍 Risultato finale:", result);
});