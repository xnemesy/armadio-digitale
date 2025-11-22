import { Asset } from 'expo-asset';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Skia } from '@shopify/react-native-skia';

let model = null;

// Caricamento Singleton del modello
export const initSegmentationModel = async () => {
  if (model) return model;
  try {
    console.log('🧠 Caricamento modello TFLite...');
    const modelAsset = Asset.fromModule(require('../../assets/models/segmentation.tflite'));
    await modelAsset.downloadAsync();
    model = await loadTensorflowModel(modelAsset.localUri);
    console.log('✅ Modello caricato!');
    return model;
  } catch (e) {
    console.error('❌ Errore caricamento modello:', e);
    throw e;
  }
};

export const removeBackground = async (imageUri) => {
  if (!model) await initSegmentationModel();

  const INPUT_SIZE = 257; 

  try {
    console.log('🖼️ Pre-processing immagine...');
    // 1. Ridimensiona a 257x257 (formato richiesto da DeepLabV3)
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: INPUT_SIZE, height: INPUT_SIZE } }],
      { format: ImageManipulator.SaveFormat.PNG } // Usa PNG per evitare artefatti JPEG
    );

    // 2. Leggi il file come Base64
    const base64 = await FileSystem.readAsStringAsync(resized.uri, {
      encoding: 'base64', // FIX: Usa stringa 'base64', non la costante che dava errore
    });

    // 3. Decodifica i pixel REALI usando Skia (La magia che mancava)
    const data = Skia.Data.fromBase64(base64);
    const image = Skia.Image.MakeImageFromEncoded(data);
    
    if (!image) throw new Error("Impossibile decodificare l'immagine con Skia");

    // Ottieni i pixel come Uint8Array (RGBA: 4 bytes per pixel)
    const pixels = image.readPixels(0, 0, {
      width: INPUT_SIZE,
      height: INPUT_SIZE,
      colorType: 4, // RGBA_8888 (Skia standard)
      alphaType: 1, // Premul
    });

    // 4. Prepara il tensore per TFLite (Float32, normalizzato -1 a 1, RGB)
    // DeepLab vuole: [1, 257, 257, 3] -> RGB planare o interleaved? Solitamente interleaved RGB.
    const inputTensor = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
    
    for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
      const r = pixels[i * 4 + 0];
      const g = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      // Skip alpha [i*4 + 3]

      // Normalizzazione Mean/Std per MobileNet (valori tra -1 e 1)
      inputTensor[i * 3 + 0] = (r - 127.5) / 127.5;
      inputTensor[i * 3 + 1] = (g - 127.5) / 127.5;
      inputTensor[i * 3 + 2] = (b - 127.5) / 127.5;
    }

    console.log('⚡ Esecuzione inferenza...');
    // 5. Esegui il modello
    const output = await model.run([inputTensor]);
    const rawOutput = output[0]; // Float32Array [1, 257, 257, 21]

    console.log(`🧠 Output ricevuto. Dimensione: ${rawOutput.length}`);
    
    // TODO: Qui avverrà la post-elaborazione (creazione della maschera trasparente)
    // Per ora restituiamo l'originale per confermare che l'inferenza funziona senza crash.
    return { 
        maskedUri: imageUri, 
        originalUri: imageUri,
        debugInfo: "Inference Success" 
    };

  } catch (error) {
    console.error("Seg Error:", error);
    return null;
  }
};