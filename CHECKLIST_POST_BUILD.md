# 📱 Checklist Post-Development Build

## ⏳ **FASE 1: Download APK** 
- [ ] ✅ Build completato da EAS
- [ ] 📥 Scarica APK dal link EAS 
- [ ] 💾 Salva APK in cartella sicura
- [ ] 🔗 Copia link di download per backup

**Link Dashboard**: https://expo.dev/accounts/xh00k/projects/armadio-digitale/builds

---

## 📲 **FASE 2: Installazione**
- [ ] 🔧 Abilita "Sorgenti sconosciute" su Android
- [ ] 📱 Trasferisci APK su dispositivo
- [ ] ⚡ Installa APK (sostituirà Expo Go per questo progetto)
- [ ] 🚀 Avvia "Armadio Digitale" dall'home screen

---

## 🧪 **FASE 3: Test Firebase**
### Test Base
- [ ] 🎯 App si avvia senza errori
- [ ] 🔥 Pulsante "Test Firebase" funziona
- [ ] ✅ Nessun errore "Component auth has not been registered yet"
- [ ] 📝 Log mostrano: "Firebase caricato: true true true"

### Test Autenticazione
- [ ] 👤 Registrazione nuovo utente funziona
- [ ] 🔐 Login utente esistente funziona  
- [ ] 📧 Email: `test@armadio.com` / Password: `testpass123`
- [ ] ✅ Messaggio conferma autenticazione

### Test Firestore
- [ ] 💾 Salvataggio dati nell'app
- [ ] 🔄 Sincronizzazione cloud visibile
- [ ] 📊 Dati persistenti tra riavvii

### Test Storage
- [ ] 📸 Upload immagini funziona
- [ ] 🖼️ Visualizzazione immagini da cloud
- [ ] 📁 URL download generati correttamente

---

## 🎯 **FASE 4: Test Funzionalità App**
### Gestione Armadio
- [ ] ➕ Aggiunta nuovo capo
- [ ] 📷 Scatto foto capo
- [ ] 🏷️ Inserimento categoria/colore
- [ ] 💾 Salvataggio capo in cloud

### Visualizzazione
- [ ] 📋 Lista capi salvati
- [ ] 🔍 Ricerca per categoria
- [ ] 🎨 Filtro per colore
- [ ] ❌ Eliminazione capo

### Outfit Builder (se implementato)
- [ ] 🧥 Combinazione capi
- [ ] 💾 Salvataggio outfit
- [ ] 👔 Visualizzazione outfit salvati

---

## 🔍 **FASE 5: Verifica Finale**
- [ ] 🔄 Riavvio app (dati persistenti?)
- [ ] 📊 Controllo dashboard Firebase per dati
- [ ] 🖼️ Controllo Storage per immagini
- [ ] ✅ App stabile senza crash

---

## ❗ **In Caso di Problemi**

### Build Fallito
```bash
# Riprova build con cache pulita
npx expo install --fix
eas build --platform android --clear-cache
```

### APK Non Si Installa
- Controlla spazio disponibile (>100MB)
- Verifica "Sorgenti sconosciute" abilitato
- Prova a disinstallare app precedenti

### Firebase Non Funziona
- Controlla log console con `adb logcat`
- Verifica connessione internet
- Controlla configurazione Firebase

### Crash App
```bash
# Debug con adb
adb logcat | grep -i armadio
```

---

## 📊 **Report Finale**
Una volta completati i test, aggiorna:
- [ ] 📝 `FIREBASE_REPORT_UPDATED.md` con risultati
- [ ] ✅ Cambia stato da "IN DEVELOPMENT BUILD" a "OPERATIVO"
- [ ] 🎯 Documenta eventuali problemi risolti

---

## 🏆 **Obiettivo Finale**
**✅ App Armadio Digitale completamente funzionante con:**
- Autenticazione Firebase
- Sincronizzazione cloud Firestore  
- Upload immagini Storage
- Gestione armadio completa
- Persistenza dati offline