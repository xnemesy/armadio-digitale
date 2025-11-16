#!/usr/bin/env node
/**
 * Migration script: Generate thumbnails for existing items
 * Run: node scripts/migrate-thumbnails.js
 * 
 * This script:
 * 1. Fetches all items without thumbnails
 * 2. Downloads full-size images
 * 3. Generates 150x200px thumbnails
 * 4. Uploads to Firebase Storage
 * 5. Updates Firestore documents
 */

const admin = require('firebase-admin');
const https = require('https');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'armadiodigitale.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();
const APP_ID = process.env.APP_ID || 'armadio-digitale';

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function generateThumbnail(inputPath, outputPath) {
  await sharp(inputPath)
    .resize(150, null, { fit: 'contain' })
    .jpeg({ quality: 70 })
    .toFile(outputPath);
}

async function migrateItem(userId, itemId, itemData) {
  const tempDir = path.join(__dirname, '../.temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const fullPath = path.join(tempDir, `${itemId}_full.jpg`);
  const thumbPath = path.join(tempDir, `${itemId}_thumb.jpg`);

  try {
    console.log(`Processing ${itemId}...`);
    
    // Download full-size image
    const fullUrl = itemData.thumbnailUrl || itemData.fullSizeUrl;
    if (!fullUrl) {
      console.log(`  ⚠️  No image URL found, skipping`);
      return { skipped: true };
    }

    console.log(`  Downloading...`);
    await downloadImage(fullUrl, fullPath);

    // Generate thumbnail
    console.log(`  Generating thumbnail...`);
    await generateThumbnail(fullPath, thumbPath);

    // Upload thumbnail to Storage
    const storagePath = `artifacts/${APP_ID}/users/${userId}/items/${itemId}_thumb.jpg`;
    console.log(`  Uploading to ${storagePath}...`);
    await bucket.upload(thumbPath, {
      destination: storagePath,
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000, immutable'
      }
    });

    // Get public URL
    const [thumbnailUrl] = await bucket.file(storagePath).getSignedUrl({
      action: 'read',
      expires: '03-01-2500'
    });

    // Update Firestore
    console.log(`  Updating Firestore...`);
    await db.doc(`artifacts/${APP_ID}/users/${userId}/items/${itemId}`).update({
      thumbnailUrl,
      fullSizeUrl: fullUrl,
      migratedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Cleanup
    fs.unlinkSync(fullPath);
    fs.unlinkSync(thumbPath);

    console.log(`  ✅ Success!`);
    return { success: true };
  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
    // Cleanup on error
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    return { error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting thumbnail migration...\n');

  const usersSnapshot = await db.collection(`artifacts/${APP_ID}/users`).get();
  let totalItems = 0;
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    console.log(`\n📁 Processing user: ${userId}`);

    const itemsSnapshot = await db
      .collection(`artifacts/${APP_ID}/users/${userId}/items`)
      .where('thumbnailUrl', '==', null)
      .get();

    if (itemsSnapshot.empty) {
      console.log(`  No items to migrate`);
      continue;
    }

    totalItems += itemsSnapshot.size;
    console.log(`  Found ${itemsSnapshot.size} items to migrate`);

    for (const itemDoc of itemsSnapshot.docs) {
      const result = await migrateItem(userId, itemDoc.id, itemDoc.data());
      if (result.success) migrated++;
      else if (result.skipped) skipped++;
      else errors++;
    }
  }

  console.log(`\n✨ Migration complete!`);
  console.log(`   Total items: ${totalItems}`);
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);

  // Cleanup temp directory
  const tempDir = path.join(__dirname, '../.temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }

  process.exit(0);
}

main().catch(console.error);
