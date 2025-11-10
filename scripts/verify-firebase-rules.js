#!/usr/bin/env node

/**
 * Firebase Security Rules Verification Script
 * Verifica che le regole Firestore e Storage siano deployate correttamente
 */

console.log('🔥 Firebase Security Rules Verification\n');
console.log('═══════════════════════════════════════════════════════');
console.log('📋 CHECKLIST VERIFICA FIRESTORE RULES');
console.log('═══════════════════════════════════════════════════════\n');

const firestoreChecks = [
  {
    id: 1,
    test: 'Blocco accesso non autenticato',
    location: '/artifacts/armadiodigitale/users/testUser/items/item1',
    auth: 'None',
    operation: 'Read',
    expected: '❌ Permission Denied',
    instructions: `
      1. Vai su: Firebase Console → Firestore Database → Regole
      2. Clicca tab "Playground" (Simulatore)
      3. Location: /artifacts/armadiodigitale/users/testUser/items/item1
      4. Access: Read
      5. Authentication: None (lascia vuoto)
      6. Clicca "Run"
      7. Risultato atteso: ❌ Simulated read denied
    `
  },
  {
    id: 2,
    test: 'Permetti accesso a propri dati',
    location: '/artifacts/armadiodigitale/users/user123/items/item1',
    auth: 'Custom - UID: user123',
    operation: 'Read',
    expected: '✅ Permission Granted',
    instructions: `
      1. Location: /artifacts/armadiodigitale/users/user123/items/item1
      2. Access: Read
      3. Authentication:
         - Provider: Custom
         - UID: user123
      4. Clicca "Run"
      5. Risultato atteso: ✅ Simulated read allowed
    `
  },
  {
    id: 3,
    test: 'Blocco accesso a dati altrui',
    location: '/artifacts/armadiodigitale/users/otherUser/items/item1',
    auth: 'Custom - UID: user123',
    operation: 'Read',
    expected: '❌ Permission Denied',
    instructions: `
      1. Location: /artifacts/armadiodigitale/users/otherUser/items/item1
      2. Access: Read
      3. Authentication:
         - Provider: Custom
         - UID: user123 (diverso da otherUser!)
      4. Clicca "Run"
      5. Risultato atteso: ❌ Simulated read denied
    `
  },
  {
    id: 4,
    test: 'Validazione campi obbligatori su create',
    location: '/artifacts/armadiodigitale/users/user123/items/newItem',
    auth: 'Custom - UID: user123',
    operation: 'Create',
    expected: '✅ Con name+createdAt, ❌ Senza',
    instructions: `
      1. Location: /artifacts/armadiodigitale/users/user123/items/newItem
      2. Access: Create
      3. Authentication: Custom - UID: user123
      4. Request Data (JSON):
         {
           "name": "Test Item",
           "createdAt": {"_seconds": 1699635600, "_nanoseconds": 0}
         }
      5. Clicca "Run"
      6. Risultato atteso: ✅ Simulated create allowed
      
      7. Riprova SENZA createdAt → deve fallire ❌
    `
  }
];

firestoreChecks.forEach(check => {
  console.log(`\n✓ Test ${check.id}: ${check.test}`);
  console.log(`  Location: ${check.location}`);
  console.log(`  Auth: ${check.auth}`);
  console.log(`  Operation: ${check.operation}`);
  console.log(`  Expected: ${check.expected}`);
  console.log(`  ${check.instructions.trim().split('\n').join('\n  ')}`);
  console.log('\n' + '─'.repeat(60));
});

console.log('\n═══════════════════════════════════════════════════════');
console.log('📋 CHECKLIST VERIFICA STORAGE RULES');
console.log('═══════════════════════════════════════════════════════\n');

const storageChecks = [
  {
    id: 1,
    test: 'Blocco accesso non autenticato',
    path: 'artifacts/armadiodigitale/users/testUser/image.jpg',
    auth: 'None',
    operation: 'Read',
    expected: '❌ Permission Denied',
    instructions: `
      1. Vai su: Firebase Console → Storage → Regole
      2. Clicca tab "Playground" (Simulatore)
      3. Path: artifacts/armadiodigitale/users/testUser/image.jpg
      4. Access: Read
      5. Authentication: None
      6. Clicca "Run"
      7. Risultato atteso: ❌ Simulated read denied
    `
  },
  {
    id: 2,
    test: 'Permetti accesso a proprie immagini',
    path: 'artifacts/armadiodigitale/users/user123/photos/item.jpg',
    auth: 'Custom - UID: user123',
    operation: 'Read',
    expected: '✅ Permission Granted',
    instructions: `
      1. Path: artifacts/armadiodigitale/users/user123/photos/item.jpg
      2. Access: Read
      3. Authentication: Custom - UID: user123
      4. Clicca "Run"
      5. Risultato atteso: ✅ Simulated read allowed
    `
  },
  {
    id: 3,
    test: 'Validazione tipo file (solo immagini)',
    path: 'artifacts/armadiodigitale/users/user123/file.pdf',
    auth: 'Custom - UID: user123',
    operation: 'Write',
    fileType: 'application/pdf',
    expected: '❌ Permission Denied',
    instructions: `
      1. Path: artifacts/armadiodigitale/users/user123/file.pdf
      2. Access: Write
      3. Authentication: Custom - UID: user123
      4. Content Type: application/pdf
      5. Size: 1048576 (1MB)
      6. Clicca "Run"
      7. Risultato atteso: ❌ Simulated write denied (tipo non valido)
      
      8. Cambia Content Type: image/jpeg → deve funzionare ✅
    `
  },
  {
    id: 4,
    test: 'Validazione dimensione file (max 10MB)',
    path: 'artifacts/armadiodigitale/users/user123/large.jpg',
    auth: 'Custom - UID: user123',
    operation: 'Write',
    fileSize: '11MB',
    expected: '❌ Permission Denied',
    instructions: `
      1. Path: artifacts/armadiodigitale/users/user123/large.jpg
      2. Access: Write
      3. Authentication: Custom - UID: user123
      4. Content Type: image/jpeg
      5. Size: 11534336 (11MB)
      6. Clicca "Run"
      7. Risultato atteso: ❌ Simulated write denied (troppo grande)
      
      8. Cambia Size: 5242880 (5MB) → deve funzionare ✅
    `
  }
];

storageChecks.forEach(check => {
  console.log(`\n✓ Test ${check.id}: ${check.test}`);
  console.log(`  Path: ${check.path}`);
  console.log(`  Auth: ${check.auth}`);
  console.log(`  Operation: ${check.operation}`);
  if (check.fileType) console.log(`  File Type: ${check.fileType}`);
  if (check.fileSize) console.log(`  File Size: ${check.fileSize}`);
  console.log(`  Expected: ${check.expected}`);
  console.log(`  ${check.instructions.trim().split('\n').join('\n  ')}`);
  console.log('\n' + '─'.repeat(60));
});

console.log('\n═══════════════════════════════════════════════════════');
console.log('🔍 VERIFICA CONTENUTO REGOLE');
console.log('═══════════════════════════════════════════════════════\n');

console.log('✓ Controlla che le regole contengano:');
console.log('\n📝 FIRESTORE RULES - Elementi chiave:\n');
console.log('  ✓ rules_version = \'2\';');
console.log('  ✓ function isAuthenticated()');
console.log('  ✓ function isOwner(userId)');
console.log('  ✓ match /artifacts/{appId}/users/{userId}');
console.log('  ✓ match /items/{itemId}');
console.log('  ✓ allow read: if isOwner(userId)');
console.log('  ✓ allow create: if isOwner(userId) && request.resource.data.keys().hasAll([\'name\', \'createdAt\'])');
console.log('  ✓ match /{document=**} { allow read, write: if false; }');

console.log('\n🗂️  STORAGE RULES - Elementi chiave:\n');
console.log('  ✓ rules_version = \'2\';');
console.log('  ✓ function isAuthenticated()');
console.log('  ✓ function isOwner(userId)');
console.log('  ✓ function isValidImageSize() // < 10MB');
console.log('  ✓ function isValidImageType() // image/.*');
console.log('  ✓ match /artifacts/{appId}/users/{userId}/{allPaths=**}');
console.log('  ✓ allow write: if isOwner(userId) && isValidImageSize() && isValidImageType()');
console.log('  ✓ match /{allPaths=**} { allow read, write: if false; }');

console.log('\n═══════════════════════════════════════════════════════');
console.log('📊 MONITORING DEPLOYMENT');
console.log('═══════════════════════════════════════════════════════\n');

console.log('1️⃣  Verifica stato deployment:');
console.log('   Firebase Console → Firestore Database → Regole');
console.log('   Cerca il timestamp "Pubblicato il: [data]"');
console.log('   Dovrebbe essere oggi/ora recente\n');

console.log('2️⃣  Monitora richieste bloccate:');
console.log('   Firebase Console → Firestore Database → Utilizzo');
console.log('   Grafico "Richieste bloccate da regole di sicurezza"');
console.log('   Se vedi attività, le regole stanno funzionando!\n');

console.log('3️⃣  Testa con app reale:');
console.log('   - Apri app su dispositivo/emulatore');
console.log('   - Login con utente test');
console.log('   - Aggiungi un capo → deve funzionare ✅');
console.log('   - Controlla logs Firebase per errori permissions\n');

console.log('═══════════════════════════════════════════════════════');
console.log('✅ VERIFICA RAPIDA');
console.log('═══════════════════════════════════════════════════════\n');

console.log('Rispondi a queste domande:\n');
console.log('[ ] Hai visto il messaggio "Regole pubblicate" nella Console?');
console.log('[ ] Il timestamp pubblicazione è recente (oggi)?');
console.log('[ ] Playground test "accesso non autenticato" è ❌ DENIED?');
console.log('[ ] Playground test "accesso a propri dati" è ✅ ALLOWED?');
console.log('[ ] Le regole contengono "isOwner(userId)" function?');
console.log('[ ] Le regole bloccano path sconosciuti (match /{document=**})?');
console.log('[ ] Storage rules validano dimensione file (10MB)?');
console.log('[ ] Storage rules validano tipo file (image/.*)?');

console.log('\n═══════════════════════════════════════════════════════');
console.log('🎯 CONCLUSIONE');
console.log('═══════════════════════════════════════════════════════\n');

console.log('Se tutti i test Playground sono passati ✅:');
console.log('  → Le regole sono deployate correttamente!');
console.log('  → La sicurezza è attiva');
console.log('  → Utenti isolati (nessun accesso cross-user)\n');

console.log('Se alcuni test falliscono ❌:');
console.log('  → Ricontrolla che hai copiato TUTTE le regole');
console.log('  → Verifica che non ci siano errori sintassi');
console.log('  → Ricarica la pagina Console e riprova');
console.log('  → Contatta per assistenza debugging\n');

console.log('═══════════════════════════════════════════════════════\n');
