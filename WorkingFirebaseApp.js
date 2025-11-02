// ====================================================================
// POLYFILL PER FIREBASE STORAGE (React Native)
// Questo risolve l'errore "Creating blobs from 'ArrayBuffer' are not supported"
// ====================================================================
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  if (!global.Blob) {
    global.Blob = require('react-native/Libraries/Blob/Blob').default;
  }
  if (!global.File) {
    global.File = require('react-native/Libraries/Blob/File').default;
  }
  if (!global.FileReader) {
    global.FileReader = require('react-native/Libraries/Blob/FileReader').default;
  }
}
// ====================================================================
// FINE POLYFILL
// ====================================================================

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Previeni l'auto-hide dello splash screen
SplashScreen.preventAutoHideAsync().catch(console.warn);

const WorkingFirebaseApp = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("🚀 Inizializzazione Armadio Digitale...");
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setLoading(false);
        await SplashScreen.hideAsync();
        console.log("✅ App caricata!");
        
      } catch (error) {
        console.error("❌ Errore inizializzazione:", error);
        setLoading(false);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  const handleAddItem = async () => {
    try {
      console.log("➕ Aggiunta nuovo capo...");
      
      const { db, getCurrentUser } = await import('./src/config/firebaseConfig');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      const user = await getCurrentUser();
      
      const newItem = {
        nome: 'Maglietta Demo',
        categoria: 'Top',
        colore: 'Blu',
        aggiunto: serverTimestamp(),
        utente: user.uid
      };
      
      const docRef = await addDoc(collection(db, 'armadio'), newItem);
      console.log("✅ Capo aggiunto:", docRef.id);
      
      setItems([...items, { id: docRef.id, ...newItem }]);
      Alert.alert("Successo", `Capo "${newItem.nome}" aggiunto all'armadio!`);
      
    } catch (error) {
      console.error("❌ Errore aggiunta capo:", error);
      Alert.alert("Errore", error.message);
    }
  };

  const handleUploadImage = async () => {
    try {
      console.log("📸 Upload immagine demo...");
      
      const { storage, getCurrentUser } = await import('./src/config/firebaseConfig');
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      
      const user = await getCurrentUser();
      const imageRef = ref(storage, `armadio/${user.uid}/foto-${Date.now()}.jpg`);
      
      // Simulazione dati immagine (in futuro useremo expo-image-picker)
      const demoData = new Uint8Array([68, 101, 109, 111, 32, 105, 109, 97, 103, 101]);
      await uploadBytes(imageRef, demoData);
      const downloadUrl = await getDownloadURL(imageRef);
      
      console.log("✅ Immagine caricata:", downloadUrl);
      Alert.alert("Successo", "Foto caricata su Firebase Storage!");
      
    } catch (error) {
      console.error("❌ Errore upload:", error);
      Alert.alert("Errore", error.message);
    }
  };

  const loadItems = async () => {
    try {
      console.log("📥 Caricamento capi dall'armadio...");
      
      const { db, getCurrentUser } = await import('./src/config/firebaseConfig');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const user = await getCurrentUser();
      const q = query(collection(db, 'armadio'), where('utente', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const loadedItems = [];
      querySnapshot.forEach((doc) => {
        loadedItems.push({ id: doc.id, ...doc.data() });
      });
      
      setItems(loadedItems);
      console.log(`✅ ${loadedItems.length} capi caricati`);
      
    } catch (error) {
      console.error("❌ Errore caricamento:", error);
      Alert.alert("Errore", error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Caricamento Armadio Digitale...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>� Armadio Digitale</Text>
      <Text style={styles.subtitle}>Il tuo guardaroba personale</Text>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>� {items.length} capi nell'armadio</Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#4F46E5' }]} 
        onPress={handleAddItem}
      >
        <Text style={styles.buttonText}>➕ Aggiungi Nuovo Capo</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#7C3AED' }]} 
        onPress={handleUploadImage}
      >
        <Text style={styles.buttonText}>📸 Carica Foto</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#059669' }]} 
        onPress={loadItems}
      >
        <Text style={styles.buttonText}>� Aggiorna Armadio</Text>
      </TouchableOpacity>

      {items.length > 0 && (
        <View style={styles.itemsContainer}>
          <Text style={styles.itemsTitle}>I tuoi capi:</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemName}>{item.nome}</Text>
              <Text style={styles.itemDetails}>
                {item.categoria} • {item.colore}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FB',
  },
  loadingText: {
    marginTop: 10,
    color: '#4F46E5',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 30,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  itemsContainer: {
    marginTop: 20,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default WorkingFirebaseApp;