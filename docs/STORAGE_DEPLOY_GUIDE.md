# Storage Optimization - Quick Deploy Guide

Guida rapida per applicare le ottimizzazioni Storage in produzione.

## ✅ Pre-Deploy Checklist

- [ ] Build completato: `npm run build:release` (Exit Code: 0)
- [ ] App funzionante con autenticazione Firebase
- [ ] Test upload immagini con nuovo codice
- [ ] Firebase CLI installato: `npm install -g firebase-tools`
- [ ] Login Firebase: `firebase login`

## 🚀 Step-by-Step Deployment

### 1. Deploy Storage Rules (5 min)

```bash
# Verifica regole sintatticamente corrette
firebase deploy --only storage --project armadiodigitale --dry-run

# Deploy regole Storage
firebase deploy --only storage --project armadiodigitale
```

**Cosa fa**: Applica le nuove regole con validazione separata per thumbnail/full-size.

**Rollback**: Se problemi, ripristina vecchie regole da Console > Storage > Rules > History

### 2. Test Upload con Metadati Cache (10 min)

```bash
# 1. Installa app aggiornata su device
npm run android:installRelease

# 2. Apri app → Aggiungi Nuovo Capo
# 3. Scatta/seleziona foto → Salva

# 4. Verifica su Firebase Console > Storage:
#    - artifacts/armadio-digitale/users/YOUR_UID/items/ITEM_ID_thumb.jpg
#    - artifacts/armadio-digitale/users/YOUR_UID/items/ITEM_ID.jpg
#    
# 5. Click su file → Metadata tab → Verifica:
#    Cache-Control: public, max-age=31536000, immutable ✅
#    Content-Type: image/jpeg ✅
```

### 3. Test Monitor Firebase (5 min)

```bash
# Apri app → Tab Profilo → "Monitor Firebase"
# Verifica che mostri:
# - Total items: 1
# - Thumbnails: 1
# - Full-size: 1
# - Ottimizzazione: 100%
```

### 4. Verifica Performance (15 min)

```bash
# 1. Chiudi completamente app
# 2. Riapri app → Home screen

# ATTESO:
# - Prima apertura: Download thumbnails (~5-10KB ciascuna) - veloce
# - Seconda apertura: Caricamento ISTANTANEO (cache FastImage)
# - Apri dettaglio item: Download full-size (~500KB-2MB) - 1-2s
# - Chiudi e riapri dettaglio: Caricamento ISTANTANEO

# 3. Verifica con adb logcat
adb logcat | grep -i "fastimage\|cache"
# Dovresti vedere "Cache hit" dopo primo caricamento
```

### 5. Monitor Firebase Console (continuativo)

```bash
# Firebase Console > Storage > Usage
# Monitora per 24-48h:

# METRICHE SANE:
# - Storage totale: ~40MB per 50 items (800KB full + 7KB thumb)
# - Bandwidth: <5MB/giorno con cache attiva
# - Denied requests: 0 (se > 0, problema rules!)

# METRICHE ANOMALE:
# - Bandwidth > 100MB/giorno con pochi utenti = cache non funziona
# - Storage growth > 10MB/giorno senza nuovi upload = possibile leak
# - Denied > 10 = problema autenticazione o rules
```

## 🔧 Troubleshooting

### Problema: "storage/unauthorized" persiste

**Causa**: App usa vecchio codice (route.params invece di useAuth)

**Fix**:
```bash
# 1. Verifica che build includa modifiche
grep -n "useAuth" src/screens/AddItemScreen.js
# Deve mostrare: import { useAuth } from '../contexts/AuthContext';

# 2. Rebuild se necessario
npm run build:release

# 3. Verifica user autenticato nell'app
# Apri Firebase Console > Authentication > Users
# Verifica che il tuo UID esista
```

### Problema: Metadati cache non impostati

**Causa**: `putFile` non accetta metadata nel formato corretto

**Fix**:
```javascript
// WRONG:
await ref.putFile(uri, { metadata: { cacheControl: '...' } });

// RIGHT:
await ref.putFile(uri, { 
  metadata: { 
    cacheControl: 'public, max-age=31536000, immutable',
    contentType: 'image/jpeg'
  } 
});
```

### Problema: Cache FastImage non funziona

**Verifica**:
```bash
# 1. Check che FastImage sia nel build
grep -r "react-native-fast-image" node_modules/

# 2. Check che ItemCard usi FastImage
grep -n "FastImage" src/components/ItemCard.js

# 3. Test cache programmaticamente
# In app, aggiungi debug log:
FastImage.getCacheSize().then(size => console.log('Cache size:', size));
```

### Problema: Regole Storage bloccano upload

**Debug**:
```bash
# 1. Testa regole nel Simulator (Firebase Console > Storage > Rules)
# Path: artifacts/armadio-digitale/users/TEST_UID/items/123_thumb.jpg
# Auth: { uid: 'TEST_UID' }
# Operation: write
# Size: 8192 (8KB)

# 2. Check logs realtime
firebase functions:log --project armadiodigitale | grep storage

# 3. Verifica path esatto usato dall'app
console.log('Uploading to:', thumbPath);
// Deve essere: artifacts/armadio-digitale/users/YOUR_UID/items/TIMESTAMP_thumb.jpg
```

## 📊 Success Metrics

### Immediate (entro 1h deploy)
- ✅ Upload funziona senza errori
- ✅ Dual storage (thumb + full) visibile su Storage Console
- ✅ Metadati cache `immutable` impostati
- ✅ Monitor Firebase mostra stats corrette

### Short-term (entro 1 giorno)
- ✅ Cache hit rate > 90% (seconda apertura app istantanea)
- ✅ Bandwidth < 10% rispetto a prima ottimizzazione
- ✅ Zero denied requests su Storage
- ✅ App responsiva su liste con 20+ items

### Long-term (entro 1 settimana)
- ✅ Storage growth lineare (nuovo upload = +~800KB)
- ✅ Bandwidth stabile anche con più utenti
- ✅ Nessun crash o memory leak da FastImage
- ✅ Feedback utenti positivo su velocità

## 🔄 Rollback Plan

Se problemi critici:

### 1. Rollback Storage Rules
```bash
# Firebase Console > Storage > Rules > History
# Click su versione precedente → "Restore"
```

### 2. Rollback App Code
```bash
# Reinstalla APK precedente
adb install -r android/app/build/outputs/apk/release/app-release-OLD.apk

# O rebuild da commit precedente
git checkout PREVIOUS_COMMIT
npm run build:release
```

### 3. Hotfix Upload
```javascript
// Se upload blocca utenti, temporary fix:
// Rimuovi metadata da putFile (degrada cache ma funziona)
await ref.putFile(uri); // Senza { metadata: {...} }
```

## 📈 Next Steps (Post-Deploy)

### Immediate
- [ ] Monitor Firebase Console per 24h
- [ ] Collect user feedback su performance
- [ ] Test su connessioni lente (3G simulator)

### This Week
- [ ] Run migration script per items esistenti: `node scripts/migrate-thumbnails.js`
- [ ] Setup Cloud Monitoring alerts (bandwidth spike, error rate)
- [ ] Document learnings in team wiki

### This Month
- [ ] Implement Storage triggers per auto-analisi (opzionale)
- [ ] Consider Cloud CDN custom domain se traffic > 1TB/mese
- [ ] A/B test different thumbnail sizes (100px vs 150px vs 200px)

## 💡 Tips

1. **Test su connessioni lente**: 
   ```bash
   # Chrome DevTools > Network > Slow 3G
   # O su device: Developer Options > Mobile network settings > Force 3G
   ```

2. **Clear cache per test**:
   ```javascript
   // In app, add debug button:
   FastImage.clearMemoryCache();
   FastImage.clearDiskCache();
   ```

3. **Monitor real-time**:
   ```bash
   # Terminal 1: Storage logs
   firebase functions:log --project armadiodigitale
   
   # Terminal 2: App logs
   adb logcat | grep "ArmadioDigitale\|ReactNative"
   ```

4. **Backup prima del deploy**:
   ```bash
   # Snapshot regole correnti
   firebase deploy --only storage --project armadiodigitale --debug > storage-rules-backup.txt
   ```

## 📞 Support

- **Firebase Status**: https://status.firebase.google.com/
- **Storage Docs**: https://firebase.google.com/docs/storage
- **Community**: https://stackoverflow.com/questions/tagged/firebase-storage

---

**Last Updated**: Nov 16, 2025
**Version**: 1.0.0
**Status**: ✅ Ready for Production
