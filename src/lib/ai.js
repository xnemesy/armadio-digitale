import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || '';

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
  const inventory = availableItems.map(item => `[${item.name} ${item.category} ${item.mainColor}]`).join('; ');
  const systemPrompt = 'Sei un fashion stylist personale. Crea outfit coerenti solo con i capi forniti.';
  const userPrompt = `Occasione: ${userRequest}\nInventario: ${inventory}`;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: userPrompt }] }], systemInstruction: { parts: [{ text: systemPrompt }] } };
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const result = await res.json();
        return result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Nessun suggerimento generato.';
      } else if (res.status === 429 && attempt < 4) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      const text = await res.text();
      throw new Error(text);
    } catch (e) {
      if (attempt === 4) return 'Errore nella comunicazione con l\'AI. Riprova più tardi.';
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
};
