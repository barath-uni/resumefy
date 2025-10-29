# Supabase Storage Setup for Resumes

## Step 1: Create Storage Bucket

Go to your Supabase Dashboard → Storage → Create a new bucket

**Bucket Settings:**
- **Name**: `resumes`
- **Public**: ❌ **PRIVATE** (important for user privacy)
- **File size limit**: 5242880 bytes (5MB)
- **Allowed MIME types**:
  - `application/pdf`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `application/msword`

## Step 2: Configure Storage Policies

**EASIEST METHOD: Use Supabase Dashboard UI** (Recommended)

1. Go to **Storage** → Click on **`resumes`** bucket → **Policies** tab
2. Click **"New Policy"**
3. Create 3 policies using the UI:

### Policy 1: INSERT (Upload)
- Click **"New Policy"** → **"For full customization"**
- Policy name: `Users can upload own resumes`
- Allowed operation: **INSERT** ✅
- Target roles: **authenticated**
- WITH CHECK expression:
```sql
bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text
```

### Policy 2: SELECT (Read)
- Click **"New Policy"** → **"For full customization"**
- Policy name: `Users can read own resumes`
- Allowed operation: **SELECT** ✅
- Target roles: **authenticated**
- USING expression:
```sql
bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text
```

### Policy 3: DELETE
- Click **"New Policy"** → **"For full customization"**
- Policy name: `Users can delete own resumes`
- Allowed operation: **DELETE** ✅
- Target roles: **authenticated**
- USING expression:
```sql
bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text
```

---

## Alternative: SQL Method (Run ONE AT A TIME)

If you prefer SQL, run each statement separately:

**Step 1:**
```sql
CREATE POLICY "Users can upload own resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Step 2:**
```sql
CREATE POLICY "Users can read own resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Step 3:**
```sql
CREATE POLICY "Users can delete own resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Step 3: Verify Setup

Test the upload flow in your app. Files should be stored in this structure:

```
resumes/
├── {user_id}/
│   ├── {timestamp}.pdf
│   ├── {timestamp}.docx
│   └── ...
```

## Troubleshooting

### Upload fails with "new row violates row-level security policy"
- Check that RLS policies are created
- Verify user is authenticated
- Check file path starts with user's UUID

### Files not accessible after upload
- Verify bucket is set to PRIVATE (not public)
- Check `getPublicUrl` is being used correctly (it returns a signed URL for private buckets)

### File size errors
- Confirm 5MB limit in bucket settings
- Check file validation in `uploadResume.ts`
