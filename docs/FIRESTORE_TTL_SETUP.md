# Firestore TTL Configuration Guide

## Overview
Time-to-Live (TTL) policies automatically delete expired documents from Firestore, reducing storage costs and keeping collections clean.

## Enable TTL Policy for imageAnalysisCache

### Via Firebase Console (Recommended)

1. **Navigate to Firestore Console**
   - Open: https://console.firebase.google.com/project/armadiodigitale/firestore
   - Select "Databases" → Your database instance

2. **Access TTL Settings**
   - Click the ⚙️ (Settings) icon in the top right
   - Select "Time to live" tab

3. **Create TTL Policy**
   - Click "Create policy" or "Add policy"
   - **Collection ID**: `imageAnalysisCache`
   - **Field name**: `expiresAt`
   - **Field type**: Timestamp
   - Click "Create"

4. **Verify Policy**
   - Policy should appear in the list
   - Status: "Active" (may take a few minutes to activate)

### Via gcloud CLI (Alternative)

Currently, TTL policies are best managed via the Firebase Console. The gcloud Firestore API for TTL is still in beta and may not be fully stable.

For advanced users with beta features enabled:

```powershell
# This is experimental - use Console method if this fails
gcloud firestore databases update --database='(default)' --enable-ttl
gcloud alpha firestore fields ttls update expiresAt --collection-group=imageAnalysisCache --enable-ttl
```

**Note**: If the above commands fail, use the Console method.

## How TTL Works

- **Application Logic**: The Cloud Function checks `expiresAt` before returning cached data
- **Firestore Cleanup**: Native TTL policy deletes expired documents automatically
- **Timing**: Firestore processes deletions in batches, typically within 24-48 hours after expiration
- **Cost**: Deletions are free, do not count towards read/write quotas

## Verify TTL is Working

After 7+ days (TTL duration), check collection size:

```powershell
# Query expired documents that should be cleaned
gcloud firestore documents list --collection-ids=imageAnalysisCache --project=armadiodigitale --limit=10
```

Expected behavior:
- Newly cached items appear with recent `expiresAt`
- Documents older than 7 days gradually disappear

## Monitoring TTL Performance

### Console Method
1. Firestore Console → "Usage" tab
2. Look for "Document deletes" metric
3. Check if auto-deletes are happening

### Via Monitoring
```powershell
# Check for TTL-related logs (internal Firestore operations)
gcloud logging read "resource.type=cloud_firestore_database AND protoPayload.methodName:batchWrite" --project=armadiodigitale --limit=20
```

## Troubleshooting

### TTL Policy Not Appearing
- Refresh console page
- Ensure you have `firebase.admin` or `datastore.owner` role
- Check that collection exists with at least one document

### Documents Not Being Deleted
- TTL deletion is eventually consistent (not immediate)
- First deletion batch may take 48-72 hours to process
- Verify `expiresAt` field is a Firestore Timestamp type (not string)

### Manual Cleanup (if needed)
```powershell
# List expired documents
gcloud firestore documents list --collection-ids=imageAnalysisCache --project=armadiodigitale --filter="expiresAt<$(Get-Date -Format 'o')" --limit=50
```

## Additional Resources
- [Firestore TTL Documentation](https://firebase.google.com/docs/firestore/ttl)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

## Summary
✅ TTL policy automates cache cleanup
✅ Reduces manual maintenance
✅ Keeps storage costs predictable
✅ No performance impact on reads/writes
