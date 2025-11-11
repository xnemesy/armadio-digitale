// AI utilities for Gemini integration

export interface ItemMetadata {
  name: string;
  category: string;
  mainColor: string;
  brand: string;
  size?: string;
}

export interface ShoppingRecommendation {
  title: string;
  url: string;
}

/**
 * Analyze image with Gemini AI via Cloud Function
 */
export async function analyzeImageWithGemini(base64Image: string): Promise<ItemMetadata> {
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
        throw new Error(result.error || 'Errore analisi immagine');
      } else if (response.status === 429 && attempt < 4) {
        // Rate limit - exponential backoff
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const text = await response.text();
      throw new Error(`Cloud Function error: ${response.status} ${text}`);
    } catch (e) {
      if (attempt === 4) throw e;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw new Error('Failed to analyze image after 5 attempts');
}

/**
 * Get shopping recommendations for an item
 */
export async function getShoppingRecommendations(itemDescription: string): Promise<ShoppingRecommendation[]> {
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
}

/**
 * Get outfit suggestions based on available items
 */
export async function getOutfitSuggestion(availableItems: any[], userRequest: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return 'Gemini API key non configurata.';
  }

  const inventory = availableItems
    .map(item => `[${item.name} ${item.category} ${item.mainColor}]`)
    .join('; ');
  
  const systemPrompt = 'Sei un fashion stylist personale. Crea outfit coerenti solo con i capi forniti.';
  const userPrompt = `Occasione: ${userRequest}\nInventario: ${inventory}`;
  
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
  };

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

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

  return 'Errore nella comunicazione con l\'AI. Riprova più tardi.';
}
