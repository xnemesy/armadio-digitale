import Constants from 'expo-constants';
import auth from '@react-native-firebase/auth';

export const analyzeImageWithGemini = async (base64Image) => {
  const cloudFunctionUrl = 'https://europe-west1-armadiodigitale.cloudfunctions.net/analyzeImage';
  const payload = { imageBase64: base64Image, mimeType: 'image/jpeg' };
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await fetch(cloudFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return {
            name: result.data.name || result.data.category || '',
            category: result.data.category || '',
            mainColor: result.data.color || '',
            brand: result.data.brand || 'Generic',
            size: result.data.size || '',
          };
        }
        // Application-level error: do not retry
        const err = new Error(result.error || 'Errore analisi immagine');
        // mark to skip retry loop
        err.noRetry = true;
        throw err;
      } else if (response.status === 429 && attempt < 4) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      const text = await response.text();
      throw new Error(`Cloud Function error: ${response.status} ${text}`);
    } catch (e) {
      if (e && e.noRetry) throw e; // do not retry on application-level errors
      if (attempt === 4) throw e;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

export const getShoppingRecommendations = async (itemDescription) => {
  const cloudFunctionUrl = 'https://europe-west1-armadiodigitale.cloudfunctions.net/getShoppingRecommendations';
  try {
    const response = await fetch(cloudFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemDescription }),
    });
    if (!response.ok) return [];
    const result = await response.json();
    return result?.recommendations || [];
  } catch {
    return [];
  }
};

export const getOutfitSuggestion = async (availableItems, userRequest) => {
  const cloudFunctionUrl = 'https://europe-west1-armadiodigitale.cloudfunctions.net/generateOutfit';
  const payload = { availableItems, userRequest };
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      // Recupera ID token Firebase se utente autenticato
      let idToken = null;
      try {
        const currentUser = auth().currentUser;
        if (currentUser) idToken = await currentUser.getIdToken();
      } catch {}

      const response = await fetch(cloudFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && typeof result.suggestion === 'string') {
          return result.suggestion || 'Nessun suggerimento generato.';
        }
        const err = new Error(result.error || 'Errore generazione outfit');
        err.noRetry = true;
        throw err;
      } else if (response.status === 429 && attempt < 4) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      const text = await response.text();
      throw new Error(`Cloud Function error: ${response.status} ${text}`);
    } catch (e) {
      if (e && e.noRetry) return e.message || 'Errore generazione outfit';
      if (attempt === 4) return 'Errore nella comunicazione con l\'AI. Riprova più tardi.';
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
};
