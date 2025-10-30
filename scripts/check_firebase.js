const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const androidPath = path.join(projectRoot, 'android', 'app', 'google-services.json');
const iosPath = path.join(projectRoot, 'ios', 'GoogleService-Info.plist');

function checkAndroid() {
  if (!fs.existsSync(androidPath)) {
    console.error(`[ERROR] File mancante: ${androidPath}`);
    return false;
  }
  try {
    const raw = fs.readFileSync(androidPath, 'utf8');
    const json = JSON.parse(raw);
    const projectId = json?.project_info?.project_id;
    const client = Array.isArray(json.client) && json.client[0];
    const packageName = client?.client_info?.android_client_info?.package_name;
    const hasApiKey = Array.isArray(client?.api_key) && !!client.api_key[0]?.current_key;
    if (!projectId || !packageName || !hasApiKey) {
      console.error('[ERROR] google-services.json sembra incompleto. Verifica project_id, package_name e api_key.');
      return false;
    }
    console.log('[OK] google-services.json presente e contiene i campi essenziali.');
    return true;
  } catch (e) {
    console.error('[ERROR] Impossibile leggere o parsare google-services.json:', e.message);
    return false;
  }
}

function checkIos() {
  if (!fs.existsSync(iosPath)) {
    console.error(`[ERROR] File mancante: ${iosPath}`);
    return false;
  }
  try {
    const raw = fs.readFileSync(iosPath, 'utf8');
    if (!raw.includes('GOOGLE_APP_ID')) {
      console.error('[ERROR] GoogleService-Info.plist non contiene la chiave GOOGLE_APP_ID. Verifica il file.');
      return false;
    }
    console.log('[OK] GoogleService-Info.plist presente e contiene GOOGLE_APP_ID.');
    return true;
  } catch (e) {
    console.error('[ERROR] Impossibile leggere GoogleService-Info.plist:', e.message);
    return false;
  }
}

(async () => {
  console.log('Verifica file Firebase nativi...');
  const a = checkAndroid();
  const i = checkIos();
  if (a && i) {
    console.log('Tutti i file Firebase nativi sono presenti e appaiono validi.');
    process.exit(0);
  } else {
    console.error('Verifica fallita. Sostituisci i placeholder con i file scaricati dalla Firebase Console (Android e iOS).');
    process.exit(1);
  }
})();
