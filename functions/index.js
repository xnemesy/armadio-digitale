const functions = require('@google-cloud/functions-framework');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inizializza Secret Manager client
const secretClient = new SecretManagerServiceClient();

// Cache per l'API key (evita chiamate ripetute a Secret Manager)
let cachedApiKey = null;

/**
 * Recupera la Gemini API key da Secret Manager
 */
async function getGeminiApiKey() {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  const projectId = process.env.GCP_PROJECT || 'armadiodigitale';
  const secretName = `projects/${projectId}/secrets/gemini-api-key/versions/latest`;

  try {
    const [version] = await secretClient.accessSecretVersion({ name: secretName });
    cachedApiKey = version.payload.data.toString('utf8');
    console.log('✅ Gemini API key recuperata da Secret Manager');
    return cachedApiKey;
  } catch (error) {
    console.error('❌ Errore recupero secret:', error);
    throw new Error('Impossibile recuperare la Gemini API key');
  }
}

/**
 * Cloud Function HTTP endpoint per analisi immagini con Gemini
 * 
 * Request Body:
 * {
 *   "imageBase64": "base64_encoded_image_data",
 *   "mimeType": "image/jpeg"  // opzionale, default: image/jpeg
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "category": "...",
 *     "color": "...",
 *     "season": "...",
 *     "brand": "...",
 *     "material": "..."
 *   }
 * }
 */
functions.http('analyzeImage', async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  // Validazione metodo HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Metodo non consentito. Usa POST.'
    });
  }

  try {
    // Validazione input
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Parametro imageBase64 mancante'
      });
    }

    console.log(`📸 Richiesta analisi immagine (${mimeType})`);

    // Recupera API key da Secret Manager
    const apiKey = await getGeminiApiKey();

    // Inizializza Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Prompt ottimizzato per Armadio Digitale
    const prompt = `Analizza questo capo d'abbigliamento e restituisci SOLO un oggetto JSON valido con questa struttura esatta:
{
  "category": "tipo di capo (es: T-Shirt, Jeans, Giacca, Scarpe, ecc.)",
  "color": "colore principale (es: Nero, Bianco, Blu Navy, ecc.)",
  "season": "stagione (Primavera/Estate/Autunno/Inverno/Tutte le stagioni)",
  "brand": "marca se visibile (altrimenti 'Non specificato')",
  "material": "materiale principale (es: Cotone, Denim, Pelle, ecc.)"
}

Rispondi SOLO con il JSON, senza testo aggiuntivo.`;

    // Chiamata a Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    console.log('🤖 Risposta Gemini:', text);

    // Parse JSON dalla risposta
    let parsedData;
    try {
      // Rimuovi eventuali code blocks markdown
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ Errore parsing JSON:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Risposta Gemini non valida',
        rawResponse: text
      });
    }

    // Validazione campi obbligatori
    const requiredFields = ['category', 'color', 'season', 'brand', 'material'];
    const missingFields = requiredFields.filter(field => !parsedData[field]);

    if (missingFields.length > 0) {
      console.warn('⚠️ Campi mancanti:', missingFields);
      // Aggiungi valori di default per campi mancanti
      missingFields.forEach(field => {
        parsedData[field] = 'Non specificato';
      });
    }

    console.log('✅ Analisi completata:', parsedData);

    // Risposta di successo
    return res.status(200).json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error('❌ Errore Cloud Function:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Errore interno del server',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
