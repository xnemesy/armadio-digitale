import { Asset } from 'expo-asset';
import { Image } from 'react-native';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

let model = null;

// Carica il modello una volta sola (Singleton pattern)
export const initSegmentationModel = async () => {
  if (model) return model;

  try {
    console.log('🧠 Caricamento modello TFLite...');
    // Carica l'asset dal bundle
    const modelAsset = Asset.fromModule(require('../../assets/models/segmentation.tflite'));
    await modelAsset.downloadAsync();
    
    // Carica in memoria (Fast TFLite usa il percorso file)
    model = await loadTensorflowModel(modelAsset.localUri);
    console.log('✅ Modello caricato con successo!');
    return model;
  } catch (e) {
    console.error('❌ Errore caricamento modello:', e);
    throw e;
  }
};

export const removeBackground = async (imageUri) => {
  if (!model) await initSegmentationModel();

  const INPUT_SIZE = 257; // Dimensione richiesta da DeepLabV3
  
  try {
    // 1. Ridimensiona l'immagine per il modello (257x257)
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: INPUT_SIZE, height: INPUT_SIZE } }],
      { format: ImageManipulator.SaveFormat.JPEG } // Usa JPEG temporaneo
    );

    // 2. Leggi i raw bytes (RGB)
    // Nota: In produzione userei una lib C++ per questo, ma per ora usiamo base64
    const base64 = await FileSystem.readAsStringAsync(resized.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const binaryData = base64ToFloat32Tensor(base64, INPUT_SIZE);

    // 3. Inferenza (Il momento magico)
    // DeepLabV3 output: [1, 257, 257, 21] (21 classi, index 15 è "Person")
    const output = await model.run([binaryData]);
    const rawOutput = output[0]; // Float32Array

    // 4. Processa la maschera (Trova i pixel "Person")
    // Qui dobbiamo essere veloci. Iterare in JS è lento, ma per 257x257 è fattibile (< 65k pixel)
    const { maskUri, bounds } = await processOutputToMask(rawOutput, INPUT_SIZE, imageUri);

    return { 
        maskedUri: maskUri, // Immagine ritagliata
        originalUri: imageUri,
        bounds 
    };

  } catch (error) {
    console.error("Seg Error:", error);
    return null;
  }
};

// --- HELPERS DI BASSO LIVELLO ---

// Converte Base64 JPEG in Float32 normalizzato (-1 a 1) per DeepLab
function base64ToFloat32Tensor(base64, size) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // ATTENZIONE: Questo è un mock. Decodificare JPEG raw in JS è complesso.
  // Per MVP veloce, usiamo un trick: passiamo un array vuoto se non abbiamo un decoder JPEG JS veloce.
  // In un app reale PRO, useremmo 'react-native-image-editor' o codice nativo per ottenere i pixel array.
  // Dato che non voglio farti installare altre 3 librerie che rompono la build:
  
  // TODO URGENTE: Per far funzionare l'inferenza REALE, serve l'array dei pixel RGB.
  // Expo non dà accesso diretto ai pixel facilmente. 
  // SOLUZIONE TATTICA: Per ora restituisco un tensore dummy per testare il flow TFLite.
  // Se l'app non crasha, implementiamo il pixel decoding vero.
  
  const tensor = new Float32Array(1 * size * size * 3);
  // Riempimento dummy (normalizzato -1..1)
  for(let i=0; i<tensor.length; i++) tensor[i] = (Math.random() * 2) - 1; 
  
  return tensor;
}

// Mock temporaneo per non bloccarti sulla logica di maschera complessa ora
async function processOutputToMask(rawOutput, size, originalUri) {
    // Qui dovremmo leggere l'argmax del tensore [257,257,21]
    // Indice 15 = Persona.
    // Se output[pixel_index + 15] è il valore massimo, allora è una persona.
    
    console.log(`Output size: ${rawOutput.length}`); // Dovrebbe essere 257*257*21 (~1.3M)
    
    // Ritorna l'originale per ora finché non scriviamo il post-processor Skia
    return { maskUri: originalUri, bounds: { x:0, y:0, w:size, h:size } };
}

// Polyfill per atob in RN se manca
const atob = (input) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';
  if (str.length % 4 == 1) throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  for (let bc = 0, bs = 0, buffer, i = 0;
    buffer = str.charAt(i++);
    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}