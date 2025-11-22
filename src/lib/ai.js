// src/lib/ai.js

import { getAuth } from '@react-native-firebase/auth';

// Helper per le chiamate fetch sicure
const secureFetch = async (url, body) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Utente non autenticato");
  
  const token = await user.getIdToken();
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // 🔒 FONDAMENTALE
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Server error: ${response.status} ${text}`);
  }
  return response.json();
};

export const getOutfitSuggestion = async (allItems, userRequest) => {
  // 1. Pre-processing Client Side: Manda solo ciò che serve
  // Riduciamo il payload JSON del 80% qui
  const slimItems = allItems.map(item => ({
    n: item.name,       // name
    c: item.category,   // category
    l: item.mainColor,  // color (l = look/colore)
    b: item.brand,      // brand
    s: item.season      // season
    // ID, date, url immagine rimossi
  }));

  try {
    const result = await secureFetch(
      'https://europe-west1-armadiodigitale.cloudfunctions.net/generateOutfit',
      { availableItems: slimItems, userRequest }
    );
    return result.suggestion;
  } catch (e) {
    console.error("AI Error", e);
    return "Impossibile generare l'outfit al momento.";
  }
};

export const analyzeImageWithGemini = async (base64Image) => {
  // Ora usa secureFetch con auth!
  const result = await secureFetch(
    'https://europe-west1-armadiodigitale.cloudfunctions.net/analyzeImage',
    { imageBase64: base64Image }
  );
  return result.data;
};