// Test completo Firebase con Storage
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';
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

console.log("🎯 Test completo Firebase con Storage...");

async function testStorage() {
    try {
        // 1. Login con utente esistente
        console.log("🔑 Login con utente di test...");
        const userCredential = await signInWithEmailAndPassword(auth, 'test-1761931127903@example.com', 'test123456');
        const uid = userCredential.user.uid;
        console.log("✅ Login riuscito! UID:", uid);

        // 2. Test Storage - Upload file di test
        console.log("📁 Test 2: Upload file su Firebase Storage...");
        const testImageContent = new Blob(['Test image content for wardrobe app'], { type: 'text/plain' });
        const fileName = `test-item-${Date.now()}.txt`;
        const storageRef = ref(storage, `artifacts/armadio-digitale-demo/users/${uid}/items/${fileName}`);
        
        const snapshot = await uploadBytes(storageRef, testImageContent);
        console.log("✅ File caricato su Storage!");

        // 3. Ottieni URL di download
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("✅ URL di download ottenuto:", downloadURL);

        // 4. Salva riferimento in Firestore (simula aggiunta capo)
        console.log("💾 Test 3: Simulazione aggiunta capo all'armadio...");
        const itemData = {
            name: "Test Maglietta",
            category: "Maglietta",
            mainColor: "Blu",
            brand: "Test Brand",
            size: "M",
            userId: uid,
            storagePath: `artifacts/armadio-digitale-demo/users/${uid}/items/${fileName}`,
            thumbnailUrl: downloadURL,
            createdAt: new Date(),
        };

        const itemsCollectionRef = collection(db, `artifacts/armadio-digitale-demo/users/${uid}/items`);
        const docRef = await addDoc(itemsCollectionRef, itemData);
        console.log("✅ Capo aggiunto all'armadio con ID:", docRef.id);

        console.log("🎉 TUTTI I SISTEMI FIREBASE FUNZIONANO PERFETTAMENTE!");
        
        return {
            success: true,
            uid: uid,
            storageUrl: downloadURL,
            itemId: docRef.id
        };

    } catch (error) {
        console.error("❌ Errore nel test Storage:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

testStorage().then(result => {
    console.log("🔍 Risultato finale test completo:", result);
});