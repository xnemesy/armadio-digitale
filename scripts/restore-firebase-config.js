#!/usr/bin/env node
/**
 * Rigenera i file Firebase da variabili d'ambiente (EAS secrets) prima della build.
 * Richiede che siano impostate:
 *  ANDROID_GOOGLE_JSON_B64 (contenuto base64 di google-services.json)
 *  IOS_GOOGLE_PLIST_B64 (contenuto base64 di GoogleService-Info.plist)
 */
const fs = require('fs');
const path = require('path');

function writeIfPresent(envName, outputPath) {
  const b64 = process.env[envName];
  if (!b64) {
    console.log(`[restore-firebase-config] Variabile ${envName} non impostata, skip.`);
    return;
  }
  try {
    const buffer = Buffer.from(b64, 'base64');
    fs.writeFileSync(outputPath, buffer);
    console.log(`[restore-firebase-config] Creato ${outputPath} da ${envName}`);
  } catch (e) {
    console.error(`[restore-firebase-config] Errore scrivendo ${outputPath}:`, e);
    process.exitCode = 1;
  }
}

// Percorsi relativi root progetto
writeIfPresent('ANDROID_GOOGLE_JSON_B64', path.join(process.cwd(), 'google-services.json'));
writeIfPresent('IOS_GOOGLE_PLIST_B64', path.join(process.cwd(), 'GoogleService-Info.plist'));

console.log('[restore-firebase-config] Completato.');
