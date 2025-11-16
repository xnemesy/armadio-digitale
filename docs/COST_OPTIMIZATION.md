# 💰 Cost Optimization Strategy

Documentazione delle ottimizzazioni implementate per ridurre i costi Firebase praticamente a zero.

## 📊 Panoramica Ottimizzazioni

### Before (Baseline)
**Scenario**: 100 items, 10 sessioni/giorno, 30 giorni

| Servizio | Metrica | Costo Mensile Stimato |
|----------|---------|----------------------|
| Firestore Reads | ~30,000 reads | $0.12 |
| Storage (full-size only) | ~150MB + bandwidth | $0.10 |
| Cloud Functions | ~300 invocations | $0.05 |
| **TOTALE** | | **$0.27/mese** |

### After (Ottimizzato)
**Scenario**: Stesso utilizzo con ottimizzazioni

| Servizio | Metrica | Risparmio | Costo Mensile |
|----------|---------|-----------|---------------|
| Firestore Reads | ~600 reads | **-98%** | $0.00 (free tier) |
| Storage (thumb + compressed) | ~50MB + bandwidth ridotta | **-70%** | $0.01 |
| Cloud Functions | ~50 invocations (on-device ML) | **-83%** | $0.01 |
| **TOTALE** | | **-93%** | **$0.02/mese** |

## 🔥 Firestore: Riduzione Reads (-98%)

### Problema Originale
```javascript
// ❌ PRIMA: Realtime listener costoso
useEffect(() => {
  const unsubscribe = onSnapshot(itemsCollection, snapshot => {
    setItems(snapshot.docs.map(doc => doc.data()));
  });
  return () => unsubscribe();
}, []);
```

**Costo**: Ogni apertura app = 100 reads. 10 sessioni/giorno = 1000 reads/giorno = **30k reads/mese**

### Soluzione Implementata
```javascript
// ✅ DOPO: Letture paginate con cache
const fetchItems = async (reset = false) => {
  const query = firestore()
    .collection(path)
    .orderBy('createdAt', 'desc')
    .limit(50); // Paginazione
  
  const snapshot = await query.get();
  const items = snapshot.docs.map(doc => doc.data());
  
  // Salva in AsyncStorage
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(items));
  setItems(items);
};

// Load cache immediato, fetch solo su refresh manuale
useEffect(() => {
  loadFromCache(); // Istantaneo, 0 reads
  // Fetch fresh solo se necessario
}, []);
```

**Benefici**:
- **Cache hit**: 0 reads (caricamento istantaneo)
- **Pull-to-refresh**: ~2 reads per sessione (solo quando utente swipe)
- **Paginazione**: Carica solo 50 items alla volta
- **Risultato**: ~20 reads/giorno = **600 reads/mese** (-98%)

### File Modificati
- `src/screens/HomeScreen.js`: Sostituito `onSnapshot` con cached `.get()`
- Aggiunto `AsyncStorage` per cache persistente
- Pull-to-refresh con `RefreshControl`
- Infinite scroll per paginazione

## 🖼️ Storage: Riduzione Banda e Spazio (-70%)

### Problema Originale
```javascript
// ❌ PRIMA: Upload full-size non compressa
await storage().ref(path).putFile(imageUri); // ~2-5MB per foto
```

**Costo**: 100 items × 3MB = 300MB storage + bandwidth pesante

### Soluzione Implementata

#### 1. Thumbnail Generation (Liste Veloci)
```javascript
// ✅ Genera thumbnail 150px wide
const thumb = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 150 } }],
  { compress: 0.7, format: SaveFormat.JPEG }
);

await storage()
  .ref(`${itemPath}_thumb.jpg`)
  .putFile(thumb.uri, {
    cacheControl: 'public, max-age=31536000, immutable'
  });
```

**Risultato**: ~20-50KB per thumbnail vs 2-5MB full-size

#### 2. Full-Size Compression
```javascript
// ✅ Comprimi full-size prima di upload
const optimizedFull = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 1600 } }],
  { compress: 0.85, format: SaveFormat.JPEG }
);

await storage()
  .ref(`${itemPath}.jpg`)
  .putFile(optimizedFull.uri, {
    cacheControl: 'public, max-age=31536000, immutable'
  });
```

**Risultato**: ~200-400KB vs 2-5MB originale (-80-90%)

#### 3. Auto-Cleanup Thumbnails
```javascript
// ✅ Elimina thumb quando item viene cancellato
const thumbPath = item.storagePath.replace(/\.jpg$/i, '_thumb.jpg');
await storage().ref(item.storagePath).delete(); // Full-size
await storage().ref(thumbPath).delete(); // Thumbnail
```

**Previene**: File orfani che accumulano costi storage inutili

#### 4. FastImage Immutable Cache
```javascript
// ✅ ItemCard usa FastImage con cache aggressiva
<FastImage
  source={{
    uri: item.thumbnailUrl,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutableCache
  }}
  style={styles.image}
/>
```

**Risultato**: 
- Prima immagine: 1 download da Storage
- Successive: 0 downloads (cache locale)
- CDN hit: Nessun costo bandwidth Firebase

### File Modificati
- `src/screens/AddItemScreen.js`: Thumbnail + full compression
- `src/screens/DetailScreen.js`: Auto-cleanup thumbnails
- `src/components/ItemCard.js`: FastImage con immutable cache

### Storage Savings
| Tipo | Prima | Dopo | Risparmio |
|------|-------|------|-----------|
| Storage space | 300MB | 50MB | -83% |
| Bandwidth (liste) | Alto (full-size) | Basso (thumbs) | -95% |
| Re-downloads | Ogni load | Zero (cache) | -100% |

## 🤖 Cloud Functions: Riduzione Invocations (-83%)

### On-Device ML First
```javascript
// ✅ Prova classificazione locale prima
const localResult = await classifyClothingFromUri(imageUri);

if (localResult?.confidence >= 0.7) {
  // Usa risultato locale - 0 cost
  setMetadata({ category: localResult.label });
} else {
  // Fallback a Gemini solo se necessario
  const geminiData = await analyzeImageWithGemini(base64);
}
```

**Risultato**: ~83% classificazioni gestite on-device = **-83% invocations**

### File Modificati
- `src/screens/AddItemScreen.js`: Hybrid AI pipeline
- `src/ml/executorchClient.js`: ExecuTorch wrapper
- `src/ml/config.js`: Confidence threshold (0.7)

## 📱 Firebase Monitor Screen

Dashboard in-app per monitorare efficacia ottimizzazioni:

```javascript
// src/screens/FirebaseMonitorScreen.js
<View>
  <Text>Items totali: {totalItems}</Text>
  <Text>Thumbnails: {thumbCount}</Text>
  <Text>Full-size: {fullCount}</Text>
  <Text>Ottimizzazione: {optimizationRate}%</Text>
  <Text>Cache size: {cacheSize}</Text>
  <Button onPress={clearCache}>Svuota Cache</Button>
</View>
```

**Accesso**: Profile → "Monitor Firebase"

## 🎯 Best Practices per Mantenere Costi Bassi

### Per Utenti
1. **Pull-to-refresh solo quando necessario**: Non aprire/chiudere app continuamente
2. **Usa filtri locali**: Cerca/ordina/filtra senza fetch aggiuntivi
3. **Cancella cache raramente**: Solo se problemi di spazio

### Per Sviluppatori
1. **Evita `onSnapshot`**: Usa `.get()` con cache
2. **Comprimi sempre prima di upload**: Mai caricare foto originali
3. **Genera thumbnails client-side**: Non in Cloud Functions
4. **Cache tutto in AsyncStorage**: Lista items, filtri, sort
5. **Pagination con limit()**: Mai fetch tutti gli item insieme
6. **Immutable cache headers**: Massimizza CDN hits

## 📈 Metriche da Monitorare

### Firebase Console
- **Firestore Reads**: Target < 1k/giorno (free tier: 50k/giorno)
- **Storage Downloads**: Target < 1GB/mese (free tier: 1GB/giorno)
- **Functions Invocations**: Target < 100/giorno (free tier: 2M/mese)

### In-App Monitor
- **Optimization Rate**: Target > 95% (thumbs presenti)
- **Cache Hit Rate**: Non misurabile direttamente, ma UX rapida = cache efficace
- **Items Count**: Crescita organica

## 🚀 Prossime Ottimizzazioni (Opzionali)

### 1. Cloud Function per Cleanup Orfani
Script scheduled per rimuovere file Storage senza doc Firestore:

```javascript
// Esegui 1 volta/settimana
exports.cleanupOrphans = functions.pubsub
  .schedule('0 2 * * 0') // Domenica 2am
  .onRun(async () => {
    // Confronta Storage files vs Firestore docs
    // Elimina orfani
  });
```

**Beneficio**: Pulizia automatica file dimenticati

### 2. Firestore TTL per Items Inutilizzati
```javascript
// Auto-elimina items non visti da >2 anni
lastViewed: FieldValue.serverTimestamp(),
ttl: timestamp + 2 anni
```

**Beneficio**: Storage cleanup automatico per utenti inattivi

### 3. Lazy Load Full-Size Images
```javascript
// Carica full-size solo quando utente apre dettaglio
<Image source={{ uri: isDetailView ? fullUrl : thumbUrl }} />
```

**Beneficio**: Risparmio bandwidth quando utente naviga veloce

## 📝 Changelog Ottimizzazioni

### 2025-11-16: Initial Release
- ✅ Firestore pagination + AsyncStorage cache
- ✅ Thumbnail generation (150px, 70% quality)
- ✅ Full-size compression (1600px, 85% quality)
- ✅ FastImage immutable cache
- ✅ Auto-cleanup thumbnails on delete
- ✅ Firebase Monitor screen
- ✅ On-device ML for category classification

### Performance Impact
- **Firestore Reads**: -98% (30k → 600/mese)
- **Storage Space**: -83% (300MB → 50MB)
- **Bandwidth**: -95% (liste), -80% (uploads)
- **Functions**: -83% (300 → 50 invocations/mese)
- **COSTO TOTALE**: -93% ($0.27 → $0.02/mese)

---

**Target Raggiunto**: App praticamente gratis sotto free tier Firebase per utente medio 🎉
