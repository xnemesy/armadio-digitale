# 🧪 Test Checklist - Ottimizzazioni Costi

## Pre-Test Setup
- [ ] Build completata con successo
- [ ] App installata su dispositivo
- [ ] Utente autenticato
- [ ] Firebase Console aperta (Firestore + Storage tabs)

## 📱 Test 1: HomeScreen Cache & Pagination

### Primo Avvio (Cold Start)
- [ ] Apri app, vai su Home
- [ ] **Verifica**: Lista items appare immediatamente? (cache hit)
- [ ] **Firebase Console**: Controlla Firestore reads count (dovrebbe essere ~0-2 reads)

### Pull-to-Refresh
- [ ] Swipe verso il basso su Home
- [ ] **Verifica**: Spinner refresh appare
- [ ] **Verifica**: Lista si aggiorna
- [ ] **Firebase Console**: +50 reads (o meno se hai <50 items)

### Infinite Scroll
- [ ] Scroll fino in fondo alla lista (se hai >50 items)
- [ ] **Verifica**: Appare "Caricamento..." footer
- [ ] **Verifica**: Nuovi items caricati
- [ ] **Firebase Console**: +50 reads per pagina

### Re-Apertura App
- [ ] Chiudi app completamente
- [ ] Riapri e vai su Home
- [ ] **Verifica**: Lista appare IMMEDIATAMENTE da cache
- [ ] **Firebase Console**: 0 reads (cache hit perfetto)

**Risultato Atteso**: 
- Cold start: 0-2 reads
- Refresh manuale: ~50 reads
- Re-apertura: 0 reads
- **TOTALE TEST**: ~50-100 reads vs ~300+ con onSnapshot

## 🖼️ Test 2: Thumbnails & Image Caching

### Aggiungi Nuovo Item
- [ ] Vai su Camera tab
- [ ] Scatta/carica foto
- [ ] Completa analisi AI
- [ ] Salva item
- [ ] **Verifica Upload**:
  - [ ] Firebase Storage Console: 2 nuovi files
    - [ ] `{itemId}_thumb.jpg` (~20-50KB)
    - [ ] `{itemId}.jpg` (~200-400KB)
  - [ ] Entrambi con metadata `cacheControl: immutable`

### Lista Items (Thumbnails)
- [ ] Torna su Home
- [ ] Scroll lista items
- [ ] **Verifica**: Thumbnails caricano velocemente
- [ ] **Verifica**: Nessun "flash" su re-scroll (FastImage cache)
- [ ] **Network Tab (DevTools)**: Dopo primo load, 0 nuovi downloads

### Dettaglio Item (Full-Size)
- [ ] Tap su item
- [ ] **Verifica**: Full-size carica (1600px max)
- [ ] **Verifica**: Qualità buona ma file leggero
- [ ] **Storage Console**: 1 download logged

### Cache Test
- [ ] Chiudi app
- [ ] Riapri, vai su Home
- [ ] Scroll lista
- [ ] **Verifica**: Thumbnails appaiono ISTANTANEAMENTE (cache locale)
- [ ] **Storage Downloads**: 0 nuovi downloads

**Risultato Atteso**:
- Thumbnails: ~20-50KB (vs ~2-5MB originali)
- Full-size: ~200-400KB (vs ~2-5MB originali)
- Re-load: 0 downloads (FastImage cache hit)

## 🗑️ Test 3: Thumbnail Cleanup

### Elimina Item
- [ ] Apri dettaglio di un item
- [ ] Tap "Elimina"
- [ ] Conferma eliminazione
- [ ] **Firebase Storage Console**:
  - [ ] Verifica che `{itemId}.jpg` sia stato eliminato
  - [ ] Verifica che `{itemId}_thumb.jpg` sia stato eliminato
  - [ ] Nessun file orfano rimasto

**Risultato Atteso**: 
- Entrambi i files (thumb + full) eliminati
- 0 file orfani

## 📊 Test 4: Firebase Monitor Screen

### Accesso Monitor
- [ ] Vai su Profile tab
- [ ] Tap "Monitor Firebase"
- [ ] **Verifica Metriche**:
  - [ ] Items totali: Numero corretto
  - [ ] Thumbnails: Numero corretto
  - [ ] Full-size: Numero corretto
  - [ ] Tasso ottimizzazione: >90%
  - [ ] Cache size: Dimensione ragionevole

### Clear Cache Test
- [ ] Tap "Svuota Cache Items"
- [ ] Conferma
- [ ] **Verifica**: Cache size = 0
- [ ] Torna su Home
- [ ] **Verifica**: Lista si ricarica da Firestore
- [ ] **Firebase Console**: +50 reads

**Risultato Atteso**:
- Metriche accurate
- Clear cache funziona
- Re-fetch corretto dopo clear

## 🤖 Test 5: On-Device ML Priority

### Aggiungi Item con Categoria Comune
- [ ] Scatta foto di sneaker/t-shirt/jeans (categorie comuni)
- [ ] **Verifica**: Classificazione rapida (<2s)
- [ ] **Verifica**: Status mostra "Classificato localmente ✓"
- [ ] **Cloud Functions Console**: 0 nuove invocations (on-device success)

### Aggiungi Item con Categoria Rara
- [ ] Scatta foto di item raro/complesso
- [ ] **Verifica**: Status mostra "Analisi cloud in corso..."
- [ ] **Verifica**: Gemini fornisce metadati dettagliati
- [ ] **Cloud Functions Console**: +1 invocation (fallback corretto)

**Risultato Atteso**:
- 70-80% items classificati on-device
- Fallback cloud solo quando necessario
- Functions invocations ridotte dell'80%

## 📈 Metriche Finali (Firebase Console)

### Dopo 1 Ora di Uso Intensivo
Registra le metriche finali:

**Firestore**:
- Reads totali: _______ (target: <200)
- Writes totali: _______ (1 per nuovo item)

**Storage**:
- Space usato: _______ MB (check: thumbnails presenti)
- Downloads: _______ (check: pochi re-downloads)
- Uploads: _______ (2× numero nuovi items)

**Cloud Functions**:
- analyzeImage invocations: _______ (target: <30% nuovi items)
- generateOutfit invocations: _______ (1 per outfit generato)

## ✅ Success Criteria

### PASS se:
- ✅ Firestore reads <200 per 1h uso intensivo (vs ~1000+ prima)
- ✅ Storage downloads minimi dopo primo load
- ✅ Thumbnails presenti per tutti items
- ✅ Cache funziona (re-apertura istantanea)
- ✅ Cleanup elimina entrambi i files
- ✅ On-device ML gestisce 70%+ categorie comuni
- ✅ UX fluida e veloce

### FAIL se:
- ❌ Firestore reads >500 (cache non funziona)
- ❌ Storage downloads alti su ogni apertura (FastImage broken)
- ❌ Thumbnails mancanti (upload fallito)
- ❌ File orfani dopo delete (cleanup broken)
- ❌ Tutti items vanno a cloud (on-device ML non attivo)

## 🐛 Issues Tracking

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
|       |          |        |       |

## 📝 Notes Aggiuntive

_Annota qui eventuali osservazioni durante il test_

---

**Tester**: _______________________  
**Data**: 2025-11-16  
**Build**: _______________________  
**Dispositivo**: _______________________
