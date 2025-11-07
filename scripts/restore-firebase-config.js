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

// Copie nei percorsi nativi (bare) se i file root esistono
try {
  const iosRoot = path.join(process.cwd(), 'GoogleService-Info.plist');
  const iosDestDir = path.join(process.cwd(), 'ios', 'ArmadioDigitale');
  const iosDest = path.join(iosDestDir, 'GoogleService-Info.plist');
  if (fs.existsSync(iosRoot)) {
    fs.mkdirSync(iosDestDir, { recursive: true });
    fs.copyFileSync(iosRoot, iosDest);
    console.log(`[restore-firebase-config] Copiato iOS plist in ${iosDest}`);
  } else {
    console.log('[restore-firebase-config] iOS plist non trovato in root, skip copia in ios/.');
  }
} catch (e) {
  console.error('[restore-firebase-config] Errore copia iOS plist:', e);
  process.exitCode = 1;
}

try {
  const andRoot = path.join(process.cwd(), 'google-services.json');
  const andDestDir = path.join(process.cwd(), 'android', 'app');
  const andDest = path.join(andDestDir, 'google-services.json');
  if (fs.existsSync(andRoot)) {
    fs.mkdirSync(andDestDir, { recursive: true });
    fs.copyFileSync(andRoot, andDest);
    console.log(`[restore-firebase-config] Copiato Android google-services.json in ${andDest}`);
  } else {
    console.log('[restore-firebase-config] Android google-services.json non trovato in root, skip copia in android/app.');
  }
} catch (e) {
  console.error('[restore-firebase-config] Errore copia Android json:', e);
  process.exitCode = 1;
}

console.log('[restore-firebase-config] Completato.');
