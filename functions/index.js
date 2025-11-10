const functions = require('@google-cloud/functions-framework');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { GoogleGenerativeAI } = require('@google/generative-ai');
// Firestore will replace Redis for caching to reduce cost and simplify infra
const { Firestore, Timestamp } = require('@google-cloud/firestore');
// (Redis left temporarily in dependencies for graceful teardown; code path removed)

// Initialize Firestore client (auto uses GOOGLE_APPLICATION_CREDENTIALS / metadata credentials)
const firestore = new Firestore();

// Inizializza Secret Manager client
const secretClient = new SecretManagerServiceClient();

// Cache per l'API key (evita chiamate ripetute a Secret Manager)
let cachedApiKey = null;

// Firestore cache settings
const IMAGE_CACHE_COLLECTION = process.env.IMAGE_CACHE_COLLECTION || 'imageAnalysisCache';
const IMAGE_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 giorni

// Rate limiting: mappa IP -> array di timestamp
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 richieste al minuto per IP

/**
 * Rate limiter middleware
 */
function checkRateLimit(clientIp) {
  const now = Date.now();
  
  if (!rateLimitMap.has(clientIp)) {
    rateLimitMap.set(clientIp, []);
  }
  
  const timestamps = rateLimitMap.get(clientIp);
  
  // Rimuovi timestamp più vecchi della finestra
  const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestTimestamp = Math.min(...recentTimestamps);
    const retryAfterSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldestTimestamp)) / 1000);
    
    console.warn(`⚠️ Rate limit exceeded for IP: ${clientIp}`);
    return {
      limited: true,
      retryAfter: retryAfterSeconds
    };
  }
  
  // Aggiungi timestamp corrente
  recentTimestamps.push(now);
  rateLimitMap.set(clientIp, recentTimestamps);
  
  return { limited: false };
}

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
  const startTime = Date.now();
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  
  // Structured logging
  const logContext = {
    clientIp,
    method: req.method,
    userAgent: req.headers['user-agent'] || 'unknown',
    timestamp: new Date().toISOString()
  };

  console.log('📥 Incoming request:', JSON.stringify(logContext));

  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return res.status(204).send('');
  }

  // Rate limiting check
  const rateLimitResult = checkRateLimit(clientIp);
  if (rateLimitResult.limited) {
    console.error('🚫 Rate limit exceeded:', JSON.stringify({ 
      clientIp, 
      retryAfter: rateLimitResult.retryAfter 
    }));
    
    res.set('Retry-After', rateLimitResult.retryAfter.toString());
    return res.status(429).json({
      success: false,
      error: 'Troppe richieste. Riprova tra qualche secondo.',
      retryAfter: rateLimitResult.retryAfter
    });
  }

  // Validazione metodo HTTP
  if (req.method !== 'POST') {
    console.warn('⚠️ Invalid method:', req.method);
    return res.status(405).json({
      success: false,
      error: 'Metodo non consentito. Usa POST.'
    });
  }

  try {
    // Validazione input
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      console.error('❌ Missing imageBase64 parameter');
      return res.status(400).json({
        success: false,
        error: 'Parametro imageBase64 mancante'
      });
    }

    // Genera cache key (hash dell'immagine per evitare duplicati)
    const crypto = require('crypto');
    const imageHash = crypto.createHash('sha256').update(imageBase64).digest('hex');
    const cacheDocRef = firestore.collection(IMAGE_CACHE_COLLECTION).doc(imageHash);
    let cacheHit = false;
    let cachedResult = null;
    try {
      const cacheSnap = await cacheDocRef.get();
      if (cacheSnap.exists) {
        const cacheData = cacheSnap.data();
        const expiresAt = cacheData.expiresAt instanceof Timestamp ? cacheData.expiresAt.toMillis() : 0;
        if (expiresAt > Date.now() && cacheData.data) {
          cachedResult = cacheData.data;
          cacheHit = true;
          // Aggiorna hits async (non blocca risposta)
          cacheDocRef.update({ hits: (cacheData.hits || 0) + 1 }).catch(()=>{});
          console.log(JSON.stringify({ level: 'INFO', cache: 'HIT', key: imageHash.substring(0,16), collection: IMAGE_CACHE_COLLECTION }));
        } else {
          console.log(JSON.stringify({ level: 'INFO', cache: 'EXPIRED', key: imageHash.substring(0,16), collection: IMAGE_CACHE_COLLECTION }));
        }
      } else {
        console.log(JSON.stringify({ level: 'INFO', cache: 'MISS', key: imageHash.substring(0,16), collection: IMAGE_CACHE_COLLECTION }));
      }
    } catch (fsCacheErr) {
      console.warn(JSON.stringify({ level: 'WARN', cache: 'READ_ERROR', error: fsCacheErr.message }));
    }

    // Se cache hit, restituisci immediatamente
    if (cacheHit && cachedResult) {
      const totalDuration = Date.now() - startTime;
      console.log('🚀 Cache response:', JSON.stringify({ duration: totalDuration }));
      
      return res.status(200).json({
        success: true,
        data: cachedResult,
        metadata: {
          processingTime: totalDuration,
          cached: true
        }
      });
    }

    // Validazione dimensione (max 10MB base64 = ~7.5MB immagine)
    const imageSizeBytes = Buffer.byteLength(imageBase64, 'base64');
    const imageSizeMB = (imageSizeBytes / 1024 / 1024).toFixed(2);
    
    console.log(`📸 Richiesta analisi immagine:`, JSON.stringify({
      mimeType,
      sizeBytes: imageSizeBytes,
      sizeMB: imageSizeMB
    }));

    if (imageSizeBytes > 10 * 1024 * 1024) {
      console.error('❌ Image too large:', imageSizeMB, 'MB');
      return res.status(413).json({
        success: false,
        error: `Immagine troppo grande (${imageSizeMB}MB). Max 10MB.`
      });
    }

    // Recupera API key da Secret Manager
    const apiKey = await getGeminiApiKey();

    // Inizializza Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Log Gemini API call (for fallback tracking)
    console.log(JSON.stringify({ level: 'INFO', gemini: 'CALL', key: imageHash.substring(0,16) }));

    // Prompt ottimizzato per Armadio Digitale - analisi dettagliata per Name e Brand
    const prompt = `Sei un analista di capi d'abbigliamento esperto e preciso, specializzato nella moda, dallo streetwear al classico. 
La tua missione è analizzare l'immagine allegata di un articolo e generare i metadati più specifici possibili per popolare un catalogo.

Concentrati sull'identificazione del prodotto per compilare i campi 'name' e 'brand' in modo specifico.

Analisi dell'immagine: Identifica marca, modello, colorway, materiali e caratteristiche distintive.

Output Richiesto: Fornisci la tua analisi in un formato strutturato e pronto per l'uso, seguendo rigorosamente i campi sottostanti.

Restituisci SOLO un oggetto JSON valido con questa struttura esatta:
{
  "name": "Nome del modello e colorway più specifico possibile (es: 'Air Jordan 4 Retro Bred Reimagined', 'Maglione Oversize a Coste', 'T-Shirt Logo Box Bianca')",
  "category": "Categoria di abbigliamento (es: 'Scarpe Sportive/Sneakers', 'Maglione', 'T-Shirt')",
  "color": "Colore primario con sfumature se rilevanti (es: 'Nero/Rosso', 'Blu Navy', 'Grigio Chiaro')",
  "brand": "Marca e Sotto-marca se applicabile (es: 'Nike Jordan', 'Adidas Originals', 'Zara', 'H&M Divided'). Se non riconoscibile: 'Non specificato'",
  "material": "Materiale principale visibile (es: 'Pelle', 'Cotone', 'Denim', 'Sintetico'). Se non chiaro: 'Non specificato'",
  "season": "Stagione appropriata (Primavera/Estate/Autunno/Inverno/Tutte le stagioni)"
}

IMPORTANTE:
- Il campo "name" deve essere il più specifico possibile: include modello, variante, colorway
- Il campo "brand" deve includere sotto-marche (es: Nike Jordan, non solo Nike)
- Rispondi SOLO con il JSON, nessun altro testo.`;

    // Chiamata a Gemini con timeout
    const geminiStartTime = Date.now();
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ]);
    const geminiDuration = Date.now() - geminiStartTime;

    const response = await result.response;
    const text = response.text();

    console.log('🤖 Gemini response:', JSON.stringify({
      duration: geminiDuration,
      responseLength: text.length
    }));

    // Parse JSON dalla risposta
    let parsedData;
    try {
      // Rimuovi eventuali code blocks markdown
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      return res.status(500).json({
        success: false,
        error: 'Risposta Gemini non valida',
        rawResponse: text.substring(0, 200) // Solo primi 200 caratteri per sicurezza
      });
    }

    // Validazione campi obbligatori
    const requiredFields = ['name', 'category', 'color', 'season', 'brand', 'material'];
    const missingFields = requiredFields.filter(field => !parsedData[field]);

    if (missingFields.length > 0) {
      console.warn('⚠️ Campi mancanti:', JSON.stringify(missingFields));
      // Aggiungi valori di default per campi mancanti
      missingFields.forEach(field => {
        parsedData[field] = 'Non specificato';
      });
    }

    const totalDuration = Date.now() - startTime;
    
    console.log('✅ Analisi completata:', JSON.stringify({
      duration: totalDuration,
      geminiDuration,
      data: parsedData
    }));

    // Salva in cache Firestore (fire-and-forget)
    cacheDocRef.set({
      data: parsedData,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + IMAGE_CACHE_TTL_MS),
      hits: 0
    }).then(() => console.log(JSON.stringify({ level: 'INFO', cache: 'WRITE', key: imageHash.substring(0,16) })))
      .catch(err => console.warn(JSON.stringify({ level: 'WARN', cache: 'WRITE_ERROR', error: err.message })));

    // Risposta di successo
    return res.status(200).json({
      success: true,
      data: parsedData,
      metadata: {
        processingTime: totalDuration,
        imageSize: imageSizeMB,
        cached: false
      }
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    
    console.error('❌ Cloud Function error:', JSON.stringify({
      error: error.message,
      stack: error.stack?.split('\n')[0], // Solo prima linea dello stack
      duration: totalDuration,
      clientIp
    }));

    return res.status(500).json({
      success: false,
      error: error.message || 'Errore interno del server',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Cloud Function HTTP endpoint per suggerimenti shopping con Gemini + Google Search
 * 
 * Request Body:
 * {
 *   "itemDescription": "Stivali marrone chiaro in pelle"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "recommendations": [
 *     {
 *       "title": "Stivali in pelle marrone - Amazon",
 *       "url": "https://..."
 *     }
 *   ]
 * }
 */
functions.http('getShoppingRecommendations', async (req, res) => {
  const startTime = Date.now();
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  
  const logContext = {
    clientIp,
    method: req.method,
    userAgent: req.headers['user-agent'] || 'unknown',
    timestamp: new Date().toISOString()
  };

  console.log('🛍️ Incoming shopping request:', JSON.stringify(logContext));

  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  const rateLimitResult = checkRateLimit(clientIp);
  if (rateLimitResult.limited) {
    res.set('Retry-After', rateLimitResult.retryAfter.toString());
    return res.status(429).json({
      success: false,
      error: 'Troppe richieste',
      retryAfter: rateLimitResult.retryAfter
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Metodo non consentito. Usa POST.'
    });
  }

  try {
    const { itemDescription } = req.body;

    if (!itemDescription || typeof itemDescription !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Parametro itemDescription mancante'
      });
    }

    console.log('🛍️ Shopping query:', itemDescription);

    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp'
    });

    // Nuovo approccio: genera query di ricerca specifiche invece di cercare link diretti
    const userQuery = `Sei un esperto di moda e shopping online. 
    
Per l'articolo: "${itemDescription}"

Genera 3 suggerimenti di ricerca per trovare articoli simili online. Ogni suggerimento deve essere:
- Una query di ricerca ottimizzata per Google Shopping
- Include brand popolari o alternative
- Specifica caratteristiche distintive

Rispondi SOLO con un JSON array in questo formato:
[
  {"title": "Descrizione breve articolo", "searchQuery": "query ottimizzata per shopping"},
  {"title": "Descrizione alternativa", "searchQuery": "altra query"},
  {"title": "Terza opzione", "searchQuery": "terza query"}
]

IMPORTANTE: Rispondi SOLO con il JSON, nessun altro testo.`;

    const geminiStartTime = Date.now();
    const result = await model.generateContent(userQuery);
    const geminiDuration = Date.now() - geminiStartTime;

    const response = await result.response;
    const text = response.text();

    console.log('🤖 Shopping response:', JSON.stringify({
      duration: geminiDuration,
      length: text.length,
      preview: text.substring(0, 200)
    }));

    let recommendations = [];
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      if (Array.isArray(parsed)) {
        // Converti le query in URL Google Shopping
        recommendations = parsed
          .filter(item => item && item.title && item.searchQuery)
          .map(item => ({
            title: item.title,
            url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.searchQuery)}`
          }))
          .slice(0, 3);
      }
    } catch (parseError) {
      console.warn('⚠️ Parse warning:', parseError.message);
      console.warn('Raw text:', text);
      recommendations = [];
    }

    const totalDuration = Date.now() - startTime;
    
    console.log('✅ Shopping done:', recommendations.length, 'items');

    return res.status(200).json({
      success: true,
      recommendations,
      metadata: {
        processingTime: totalDuration,
        count: recommendations.length
      }
    });

  } catch (error) {
    console.error('❌ Shopping error:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
      recommendations: []
    });
  }
});
