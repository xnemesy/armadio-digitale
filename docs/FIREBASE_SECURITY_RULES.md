# Firebase Security Rules (Production)

## Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Artifacts collection (multi-tenancy support)
    match /artifacts/{appId}/users/{userId} {
      // User metadata document
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
      
      // User items subcollection
      match /items/{itemId} {
        // Only authenticated user can access their own items
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) 
                      && request.resource.data.keys().hasAll(['name', 'createdAt'])
                      && request.resource.data.createdAt is timestamp;
        allow update: if isOwner(userId);
        allow delete: if isOwner(userId);
      }
      
      // User outfits subcollection (future feature)
      match /outfits/{outfitId} {
        allow read, write: if isOwner(userId);
      }
      
      // User preferences subcollection
      match /preferences/{docId} {
        allow read, write: if isOwner(userId);
      }
    }
    
    // Block all other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidImageSize() {
      // Max 10MB per image
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    function isValidImageType() {
      return request.resource.contentType.matches('image/.*');
    }
    
    // User images path
    match /artifacts/{appId}/users/{userId}/{allPaths=**} {
      // Only owner can read/write their images
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) 
                   && isValidImageSize() 
                   && isValidImageType();
      allow delete: if isOwner(userId);
    }
    
    // Block all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Deployment Instructions

### 1. Deploy via Firebase Console (Recommended for first time)

#### Firestore Rules:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **armadiodigitale**
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the Firestore rules above
5. Click **Publish**

#### Storage Rules:
1. Navigate to **Storage** → **Rules** tab
2. Copy the Storage rules above
3. Click **Publish**

### 2. Deploy via Firebase CLI (Advanced)

#### Setup:
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize Firebase (if not already done)
firebase init firestore
firebase init storage
```

#### Create Rules Files:

**firestore.rules** (create in project root):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    match /artifacts/{appId}/users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
      
      match /items/{itemId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) 
                      && request.resource.data.keys().hasAll(['name', 'createdAt'])
                      && request.resource.data.createdAt is timestamp;
        allow update: if isOwner(userId);
        allow delete: if isOwner(userId);
      }
      
      match /outfits/{outfitId} {
        allow read, write: if isOwner(userId);
      }
      
      match /preferences/{docId} {
        allow read, write: if isOwner(userId);
      }
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**storage.rules** (create in project root):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidImageSize() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    function isValidImageType() {
      return request.resource.contentType.matches('image/.*');
    }
    
    match /artifacts/{appId}/users/{userId}/{allPaths=**} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) 
                   && isValidImageSize() 
                   && isValidImageType();
      allow delete: if isOwner(userId);
    }
    
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

#### Deploy:
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy both
firebase deploy --only firestore:rules,storage:rules
```

### 3. Testing Rules

#### Test Firestore Rules (Firebase Console):
1. Go to **Firestore Database** → **Rules** → **Rules Playground**
2. Test scenarios:
   - ✅ Authenticated user reads own items: `/artifacts/armadio-digitale/users/{uid}/items/item1`
   - ❌ Authenticated user reads other user's items: `/artifacts/armadio-digitale/users/other-uid/items/item1`
   - ❌ Unauthenticated access: Should fail

#### Test Storage Rules:
1. Go to **Storage** → **Rules** → **Rules Playground**
2. Test scenarios:
   - ✅ Owner uploads image < 10MB
   - ❌ Non-owner uploads to other user's path
   - ❌ File > 10MB (should fail)

### 4. Verify Rules are Active

#### Check Current Rules:
```bash
# View current Firestore rules
firebase firestore:rules:get

# View current Storage rules
firebase storage:rules:get
```

#### Monitor Rule Violations:
1. Firebase Console → **Firestore/Storage** → **Usage** tab
2. Look for "Security rules blocked request" metrics

## Key Security Features

### ✅ Implemented Protections:
- User isolation (can only access own data)
- Authentication required
- Size limits (10MB per image)
- Content type validation (images only)
- Timestamp validation on creation
- Multi-tenancy support (APP_ID isolation)

### ⚠️ Important Notes:
- **Never use `allow read, write: if true;` in production**
- Test rules thoroughly before deploying
- Monitor Firebase Usage dashboard for unauthorized access attempts
- Rules apply to both mobile apps and web clients
- Cloud Functions bypass security rules (use Admin SDK)

### 🔒 Best Practices:
1. Always require authentication
2. Validate data structure on write
3. Use helper functions for readability
4. Limit file sizes and types
5. Block access to root paths
6. Use granular permissions (read/create/update/delete)
7. Regular security audits

## Troubleshooting

### Issue: "Permission denied" after deploying rules
**Solution**: Verify user is authenticated and accessing correct path (`/artifacts/{APP_ID}/users/{uid}/...`)

### Issue: Images not uploading
**Solution**: 
- Check file size < 10MB
- Verify content type is `image/*`
- Ensure Storage path matches pattern

### Issue: Rules not taking effect
**Solution**: 
- Wait 1-2 minutes for propagation
- Clear app cache
- Force quit and restart app

## Next Steps

After deploying rules:
1. ✅ Remove test mode warnings from Firebase Console
2. ✅ Test with actual user accounts
3. ✅ Monitor Firebase Usage tab for issues
4. ✅ Set up alerts for rule violations (Firebase Console → Project Settings → Integrations)
