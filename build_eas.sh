#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHECK_SCRIPT="$ROOT_DIR/scripts/check_firebase.js"

echo "1/2 - Verifica file Firebase nativi..."
if ! node "$CHECK_SCRIPT"; then
  echo "Errore: verifica Firebase fallita. Sostituisci i file placeholder e riprova."
  exit 1
fi

echo "2/2 - Avvio build EAS (Android, profile: production)"
echo "Nota: assicurati di aver effettuato login con 'eas login' e di avere eas-cli installato."
eas build -p android --profile production

echo "Build lanciata. Controlla il log EAS o la dashboard per lo stato della build."
echo "Se vuoi inviare automaticamente a Play Console (opzionale):"
echo "  eas submit -p android --platform android"
