# Promemoria Monitoraggio Cache

## Comandi Utili

### Monitor Giornaliero (Consigliato per prima settimana)
```powershell
./scripts/monitor-cache.ps1 -Project armadiodigitale -Function analyzeimage -Minutes 1440  # ultime 24h
```

### Monitor Settimanale
```powershell
./scripts/monitor-cache.ps1 -Project armadiodigitale -Function analyzeimage -Minutes 10080  # ultima settimana
```

### Test Rapido Funzione
```powershell
./scripts/test-function.ps1
```

### Query Log Manuale (ultimi eventi cache)
```powershell
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=analyzeimage AND jsonPayload.cache:*" --project=armadiodigitale --limit=20
```

## Metriche Target

### Settimana 1
- **Hit Rate**: 20-30% (la cache si sta riempiendo)
- **Cloud fallbacks**: Alti inizialmente, normali

### Settimana 2-3
- **Hit Rate**: 40-60% (stabile)
- **Cloud fallbacks**: Diminuiscono progressivamente

### Alert (da verificare)
- Hit Rate < 20% dopo 7 giorni → Investigare (immagini troppo uniche?)
- Errori READ_ERROR o WRITE_ERROR → Verificare permessi Firestore

## Quando Eseguire Teardown Redis

✅ **Condizioni per procedere:**
1. Hit Rate stabile > 40% per almeno 3-5 giorni
2. Nessun errore cache nei log
3. Performance soddisfacente (tempi risposta bassi per HIT)

⚠️ **Se una condizione non è soddisfatta:**
- Aspetta ancora qualche giorno
- Rivedi configurazione cache o threshold

## Teardown Redis (dopo validazione)
```powershell
# SOLO dopo aver confermato che cache funziona bene!
./scripts/teardown-redis.ps1 -Project armadiodigitale -Region europe-west1 -Instance armadio-redis
```

## Costi Monitoraggio

### Firestore (stimato)
- Letture: ~1000-5000/giorno → €0.01-0.05/mese
- Scritture: ~100-500/giorno → €0.01-0.02/mese
- Storage: trascurabile (TTL pulisce automaticamente)

### Gemini API
- Monitorare spesa nel Billing Console
- Atteso: 40-60% riduzione dopo cache a regime
- Prima: ~€0.10-0.50/mese → Dopo: ~€0.05-0.25/mese

## Link Utili

- **Firestore Console**: https://console.firebase.google.com/project/armadiodigitale/firestore
- **Cloud Functions Console**: https://console.cloud.google.com/functions/list?project=armadiodigitale
- **Logs Console**: https://console.cloud.google.com/logs?project=armadiodigitale
- **Billing Console**: https://console.cloud.google.com/billing?project=armadiodigitale

## Supporto

Documentazione completa:
- `docs/MONITORING_GUIDE.md` - Query e dashboard
- `docs/FIRESTORE_TTL_SETUP.md` - Setup TTL
- `docs/DEPLOYMENT_SUMMARY.md` - Riepilogo completo
