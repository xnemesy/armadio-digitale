// Test script per verificare la connessione Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
const storage = getStorage(app);

console.log("🔥 Inizializzazione Firebase...");

async function testFirebase() {
    try {
        // Test 1: Autenticazione anonima
        console.log("📱 Test 1: Autenticazione anonima...");
        const userCredential = await signInAnonymously(auth);
        console.log("✅ Autenticazione riuscita! UID:", userCredential.user.uid);

        // Test 2: Scrittura su Firestore
        console.log("💾 Test 2: Scrittura su Firestore...");
        const testRef = doc(db, 'test', 'connection-test');
        await setDoc(testRef, {
            message: 'Firebase connection test successful!',
            timestamp: new Date(),
            uid: userCredential.user.uid
        });
        console.log("✅ Scrittura su Firestore riuscita!");

        // Test 3: Lettura da Firestore
        console.log("📖 Test 3: Lettura da Firestore...");
        const docSnap = await getDoc(testRef);
        if (docSnap.exists()) {
            console.log("✅ Lettura da Firestore riuscita! Dati:", docSnap.data());
        } else {
            console.log("❌ Documento non trovato!");
        }

        // Test 4: Test Storage (creazione di un file di test)
        console.log("📁 Test 4: Firebase Storage...");
        const testContent = new Blob(['Test file content'], { type: 'text/plain' });
        const storageRef = ref(storage, `test/${userCredential.user.uid}/test.txt`);
        
        const snapshot = await uploadBytes(storageRef, testContent);
        console.log("✅ Upload su Storage riuscito!");
        
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("✅ URL di download ottenuto:", downloadURL);

        console.log("🎉 Tutti i test Firebase sono passati con successo!");
        
        return {
            auth: true,
            firestore: true,
            storage: true,
            uid: userCredential.user.uid
        };

    } catch (error) {
        console.error("❌ Errore nei test Firebase:", error);
        return {
            auth: false,
            firestore: false,
            storage: false,
            error: error.message
        };
    }
}

// Esegui i test
testFirebase().then(result => {
    console.log("🔍 Risultato finale dei test:", result);
});