# Storage Optimization & Security Strategy

Documento tecnico sulle strategie di ottimizzazione Storage, sicurezza e CDN per Armadio Digitale.

## 📊 Architettura Dual Storage

### Path Structure
```
gs://armadiodigitale.appspot.com/
└── artifacts/
    └── ${APP_ID}/
        └── users/
            └── ${userId}/
                └── items/
                    ├── ${itemId}_thumb.jpg  (~5-10KB, 150x200px JPEG 70%)
                    └── ${itemId}.jpg        (~500KB-2MB, full-size)
```

### Upload Flow
```javascript
// 1. Generate thumbnail client-side (expo-image-manipulator)
const thumbnail = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 150 } }],
  { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
);

// 2. Upload with immutable cache metadata
const cacheMetadata = {
  cacheControl: 'public, max-age=31536000, immutable',
  contentType: 'image/jpeg'
};

await storage().ref(thumbPath).putFile(thumbnail.uri, { metadata: cacheMetadata });
await storage().ref(fullPath).putFile(imageUri, { metadata: cacheMetadata });
```

## 🔐 Domanda 1: Regole Storage per Multi-Tenancy & Dual Storage

### Strategia Implementata

Le regole Storage sono state ottimizzate per:
1. **Path-specific validation**: Validazione diversa per thumbnail (max 500KB) vs full-size (max 10MB)
2. **Multi-tenancy sicuro**: Pattern `artifacts/{appId}/users/{userId}/items/...`
3. **Type safety**: Solo JPEG/PNG/WebP consentiti
4. **Cache-aware**: Supporto metadati `cacheControl` immutabili

### Regole Storage (storage.rules)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // ===== HELPER FUNCTIONS =====
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidImageType() {
      return request.resource.contentType.matches('image/(jpeg|jpg|png|webp)');
    }
    
    // Thumbnail: max 500KB (generously, actual ~5-10KB)
    function isValidThumbnailSize() {
      return request.resource.size < 500 * 1024;
    }
    
    // Full-size: max 10MB
    function isValidFullSizeSize() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // ===== USER ITEMS STORAGE =====
    
    // Thumbnail images (150x200px JPEG 70%)
    match /artifacts/{appId}/users/{userId}/items/{itemId}_thumb.jpg {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) 
                   && isValidImageType()
                   && isValidThumbnailSize();
      allow delete: if isOwner(userId);
    }
    
    // Full-size images
    match /artifacts/{appId}/users/{userId}/items/{itemId}.jpg {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) 
                   && isValidImageType()
                   && isValidFullSizeSize();
      allow delete: if isOwner(userId);
    }
    
    // Fallback for other formats (PNG, WebP)
    match /artifacts/{appId}/users/{userId}/items/{filename} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) 
                   && isValidImageType()
                   && isValidFullSizeSize();
      allow delete: if isOwner(userId);
    }
    
    // Block all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Vantaggi

1. **Zero-trust security**: Ogni utente accede solo ai propri file
2. **Validazione granulare**: Size limits diversi per thumbnail vs full-size
3. **Format whitelisting**: Solo formati immagine sicuri
4. **Multi-tenancy**: `appId` permette ambienti separati (dev/staging/prod)
5. **Flessibilità**: Fallback per PNG/WebP oltre a JPEG

### Testing Regole

```bash
# Firebase Emulator per test locali
firebase emulators:start --only storage

# Test con Firebase Console Rules Simulator:
# 1. Vai su Console > Storage > Rules
# 2. Usa il simulator con:
#    - Auth: { uid: 'user123' }
#    - Path: artifacts/armadio-digitale/users/user123/items/123_thumb.jpg
#    - Operation: write, size: 8KB
```

## ⚡ Domanda 2: CDN e Ottimizzazioni Lato Server

### Strategia Implementata: Firebase Storage + Google Cloud CDN

Firebase Storage è **già integrato con Cloud CDN** di default! Ecco come sfruttarlo al massimo:

#### 1. Cache Headers Immutabili

```javascript
// Impostati durante upload (già implementato in AddItemScreen)
const cacheMetadata = {
  cacheControl: 'public, max-age=31536000, immutable', // 1 anno
  contentType: 'image/jpeg'
};
```

**Effetto**: 
- Browser/app cacheranno le immagini per 1 anno
- CDN edge locations serviranno copie cached (latenza ~10-50ms vs ~200-500ms)
- **99%+ cache hit rate** dopo primo caricamento

#### 2. Firebase Storage Auto-CDN

Firebase Storage usa automaticamente:
- **Global CDN**: 200+ edge locations worldwide
- **Anycast routing**: Richieste servite dal datacenter più vicino
- **HTTP/2**: Multiplexing per download paralleli
- **Brotli compression**: Compressione automatica per metadati/headers

**Nessuna configurazione richiesta** - è incluso gratuitamente!

#### 3. Ottimizzazioni Aggiuntive Possibili

##### A. Firebase Hosting Rewrite (opzionale, per web app)

Se sviluppi una web app companion, puoi usare Firebase Hosting per servire immagini:

```json
// firebase.json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/img/**",
        "function": "imageProxy"
      }
    ]
  }
}
```

```javascript
// functions/index.js
exports.imageProxy = functions.https.onRequest(async (req, res) => {
  const bucket = admin.storage().bucket();
  const file = bucket.file(req.path.replace('/img/', ''));
  
  // Set aggressive cache headers
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  file.createReadStream().pipe(res);
});
```

##### B. Cloud CDN Custom Domain (enterprise)

Per controllo completo:

```bash
# 1. Setup Load Balancer con Storage backend
gcloud compute backend-buckets create armadio-images \
  --gcs-bucket-name=armadiodigitale.appspot.com \
  --enable-cdn

# 2. Mappa custom domain (es: cdn.armadiodigitale.com)
gcloud compute url-maps create armadio-cdn \
  --default-backend-bucket=armadio-images
```

**Costi**: ~$0.08/GB egress (vs $0.12/GB Storage diretto) - **33% risparmio** su grandi volumi!

##### C. Image Optimization On-the-Fly (avanzato)

Per resize dinamico (es: `image.jpg?w=300`):

```javascript
// functions/index.js
const sharp = require('sharp');

exports.optimizeImage = functions.https.onRequest(async (req, res) => {
  const { path, w, q = 80 } = req.query;
  const bucket = admin.storage().bucket();
  const file = bucket.file(path);
  
  // Download + transform
  const [buffer] = await file.download();
  const optimized = await sharp(buffer)
    .resize(parseInt(w))
    .jpeg({ quality: parseInt(q) })
    .toBuffer();
  
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('Content-Type', 'image/jpeg');
  res.send(optimized);
});
```

**Quando serve**: Se vuoi supportare più dimensioni thumbnail (es: 100px, 200px, 400px) senza generare tutte client-side.

### Monitoring Performance

```javascript
// FirebaseMonitorScreen già mostra:
// - Bytes scaricati (banda)
// - Cache hit rate (stimato)
// - Numero richieste

// Per analytics avanzati, usa Cloud Monitoring:
gcloud monitoring dashboards create --config-from-file=storage-dashboard.yaml
```

### Costi Stimati

Scenario: 1000 utenti, 50 item ciascuno, 5 visualizzazioni/giorno

**Senza ottimizzazioni:**
```
Storage: 50K items × 800KB = 40GB × $0.026/GB = $1.04/mese
Egress: 50K items × 5 views/day × 800KB × 30 days = 6TB × $0.12/GB = $720/mese
TOTALE: ~$721/mese
```

**Con thumbnail + CDN:**
```
Storage: 50K × (800KB + 7KB) = 40.35GB × $0.026/GB = $1.05/mese
Egress (thumbnails): 50K × 5 × 7KB × 30 = 52.5GB × $0.12/GB = $6.30/mese
Egress (full-size, solo detail): 50K × 0.5 × 800KB × 30 = 600GB × $0.08/GB = $48/mese
TOTALE: ~$55/mese (92% risparmio!)
```

**CDN Cache hit 90%:**
```
Egress: 10% di 54.30/mese = $5.43/mese
TOTALE: ~$6.50/mese (99% risparmio!)
```

## 🔄 Domanda 3: Cloud Functions Trigger per Storage

### Caso d'Uso: Auto-Analisi Immagini al Caricamento

Attualmente `analyzeImage` viene chiamata manualmente dall'app. Possiamo automatizzarla con Storage Trigger:

#### Implementazione

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');

// Trigger on full-size image upload
exports.onImageUpload = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name; // artifacts/armadio-digitale/users/UID/items/123.jpg
  
  // 1. Security: Validate path structure
  const pathRegex = /^artifacts\/([^\/]+)\/users\/([^\/]+)\/items\/(\d+)\.jpg$/;
  const match = filePath.match(pathRegex);
  if (!match) {
    console.log('Invalid path, skipping:', filePath);
    return null;
  }
  
  const [, appId, userId, itemId] = match;
  
  // 2. Security: Check if Firestore doc exists and belongs to user
  const itemRef = admin.firestore().doc(`artifacts/${appId}/users/${userId}/items/${itemId}`);
  const itemDoc = await itemRef.get();
  if (!itemDoc.exists || itemDoc.data().userId !== userId) {
    console.error('Security violation: unauthorized upload', { filePath, userId });
    // Delete unauthorized file
    await admin.storage().bucket().file(filePath).delete();
    return null;
  }
  
  // 3. Skip if already analyzed
  if (itemDoc.data().analyzedAt) {
    console.log('Already analyzed, skipping:', itemId);
    return null;
  }
  
  // 4. Run Vision AI analysis
  const bucket = admin.storage().bucket();
  const visionClient = new vision.ImageAnnotatorClient();
  
  const [labels] = await visionClient.labelDetection(`gs://${bucket.name}/${filePath}`);
  const [colors] = await visionClient.imageProperties(`gs://${bucket.name}/${filePath}`);
  
  // 5. Update Firestore with AI metadata
  await itemRef.update({
    aiLabels: labels.map(l => l.description),
    dominantColors: colors.imagePropertiesAnnotation.dominantColors.colors.map(c => ({
      color: c.color,
      score: c.score
    })),
    analyzedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('Analysis complete:', itemId);
  return null;
});

// Trigger on thumbnail generation (optional - validate thumbnail was created)
exports.onThumbnailUpload = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  if (!filePath.endsWith('_thumb.jpg')) return null;
  
  const pathRegex = /^artifacts\/([^\/]+)\/users\/([^\/]+)\/items\/(\d+)_thumb\.jpg$/;
  const match = filePath.match(pathRegex);
  if (!match) return null;
  
  const [, appId, userId, itemId] = match;
  
  // Verify thumbnail size is appropriate (5-50KB range)
  const size = parseInt(object.size);
  if (size < 1024 || size > 100 * 1024) {
    console.warn('Suspicious thumbnail size:', { itemId, size });
    // Optionally notify admin or flag for review
  }
  
  console.log('Thumbnail validated:', { itemId, size });
  return null;
});
```

### Considerazioni Sicurezza per Trigger

#### 1. **Path Validation**
```javascript
// SEMPRE validare che il path corrisponda al pattern atteso
const pathRegex = /^artifacts\/([^\/]+)\/users\/([^\/]+)\/items\/(\d+)\.jpg$/;
if (!filePath.match(pathRegex)) {
  console.error('Invalid path detected:', filePath);
  await admin.storage().bucket().file(filePath).delete();
  return;
}
```

#### 2. **Cross-Reference con Firestore**
```javascript
// Verifica che il documento Firestore esista E appartenga all'utente corretto
const itemDoc = await firestore().doc(path).get();
if (!itemDoc.exists || itemDoc.data().userId !== extractedUserId) {
  // Unauthorized upload detected!
  await storage().bucket().file(filePath).delete();
  await logSecurityIncident({ userId, filePath, timestamp });
  return;
}
```

#### 3. **Rate Limiting**
```javascript
// Prevenire abuse di trigger (es: upload massivo fake)
const recentUploads = await firestore()
  .collection(`artifacts/${appId}/users/${userId}/items`)
  .where('createdAt', '>', Date.now() - 60000) // Last minute
  .count()
  .get();

if (recentUploads.data().count > 10) {
  console.error('Rate limit exceeded:', userId);
  await admin.storage().bucket().file(filePath).delete();
  return;
}
```

#### 4. **Content Validation (Malware/NSFW)**
```javascript
// Integra Cloud Vision SafeSearch
const [safeSearch] = await visionClient.safeSearchDetection(`gs://${bucket.name}/${filePath}`);
const { adult, violence, racy } = safeSearch.safeSearchAnnotation;

if (adult === 'LIKELY' || adult === 'VERY_LIKELY' || violence === 'VERY_LIKELY') {
  console.error('Inappropriate content detected:', itemId);
  await admin.storage().bucket().file(filePath).delete();
  await itemRef.delete(); // Remove from Firestore too
  await notifyUser(userId, 'Content policy violation');
  return;
}
```

#### 5. **Idempotency**
```javascript
// Trigger possono essere chiamati più volte per lo stesso evento
// Usa flag Firestore per evitare duplicazioni
const alreadyProcessed = itemDoc.data().triggerProcessedAt;
if (alreadyProcessed) {
  console.log('Already processed, skipping:', itemId);
  return;
}

await itemRef.update({
  triggerProcessedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

### Deploy Trigger

```bash
# Deploy solo i trigger Storage
firebase deploy --only functions:onImageUpload,functions:onThumbnailUpload

# Monitor execution
firebase functions:log --only onImageUpload
```

### Costi Trigger

```
Invocazioni: 50K uploads/mese × 2 trigger = 100K invocazioni
Costo: (100K - 2M free) = $0 (entro quota gratuita!)

Compute: 100K × 1s × $0.0000004/s = $0.04/mese

Vision API: 50K images × $1.50/1000 = $75/mese
```

**Alternativa economica**: Usa solo label detection basic (gratis fino a 1000/mese) invece di full Vision AI.

## 🎯 Strategia Consigliata (Production-Ready)

### Fase 1: Immediate (già implementato)
- ✅ Dual storage (thumb + full-size)
- ✅ Client-side thumbnail generation
- ✅ FastImage caching
- ✅ Immutable cache headers
- ✅ Storage rules con path-specific validation

### Fase 2: Optimization (prossimi step)
- 🔄 Deploy regole Storage aggiornate: `firebase deploy --only storage`
- 🔄 Test upload con metadati cache
- 🔄 Monitor Firebase Console per cache hit rate

### Fase 3: Scale (quando > 1000 utenti attivi)
- ⏳ Implement Storage triggers per auto-analisi
- ⏳ Setup Cloud Monitoring dashboards
- ⏳ Consider Cloud CDN custom domain (se egress > $100/mese)

### Fase 4: Advanced (enterprise)
- ⏳ On-the-fly image optimization (dynamic resize)
- ⏳ Multi-region Storage buckets
- ⏳ ML-powered image moderation

## 📊 Metriche da Monitorare

### In-App (FirebaseMonitorScreen)
```javascript
// Già implementato:
- Total storage used (MB)
- Bandwidth consumed (MB)
- Cache hit rate estimate
- Thumbnail optimization rate (% items with dual storage)
```

### Firebase Console
```
Storage > Usage:
- Total stored: <40GB per 1000 users
- Download bandwidth: <10GB/day con cache
- Upload operations: ~2 per item (thumb + full)

Storage > Rules:
- Denied requests: Idealmente 0 (se > 0, investigate security)
```

### Cloud Monitoring (avanzato)
```
Metrics:
- storage.googleapis.com/storage/total_bytes
- storage.googleapis.com/network/sent_bytes_count
- cloudfunctions.googleapis.com/function/execution_count

Alerts:
- Bandwidth spike > 100GB/day (possibile abuse)
- Error rate > 1% (problemi rules o quota)
- Storage growth > 10GB/day (anomalo)
```

## 🔒 Security Checklist

- ✅ Storage rules validate `request.auth.uid == userId`
- ✅ Path structure prevents directory traversal
- ✅ File size limits enforced (500KB thumb, 10MB full)
- ✅ Content-Type whitelist (only JPEG/PNG/WebP)
- ⏳ Storage triggers validate cross-references con Firestore
- ⏳ Rate limiting su trigger (max 10 uploads/min per user)
- ⏳ Content moderation (Vision API SafeSearch)
- ⏳ Audit logs per accessi sospetti

## 📚 Risorse

- [Firebase Storage Best Practices](https://firebase.google.com/docs/storage/best-practices)
- [Cloud CDN Documentation](https://cloud.google.com/cdn/docs)
- [Storage Trigger Examples](https://github.com/firebase/functions-samples/tree/main/storage-resize-images)
- [Image Optimization Guide](https://web.dev/fast/#optimize-your-images)
