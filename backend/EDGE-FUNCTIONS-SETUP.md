# Supabase Edge Functions Setup Guide

## What are Edge Functions?

Supabase Edge Functions are serverless TypeScript/Deno functions that run at the edge, close to your users. They're perfect for:
- Keeping API keys secure (server-side only)
- Running AI/LLM operations without exposing credentials
- Processing files and data transformations
- **FREE tier: 500,000 invocations per month**

---

## Prerequisites

1. **Supabase Project** - You already have this set up
2. **Supabase CLI** - Install globally:
   ```bash
   npm install -g supabase
   ```

3. **Docker** (required for local testing) - Install from [docker.com](https://www.docker.com/products/docker-desktop/)

---

## Initial Setup

### 1. Login to Supabase CLI

```bash
supabase login
```

This will open your browser to authenticate.

### 2. Link Your Project

First, get your project reference ID from your Supabase dashboard URL:
- URL format: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

Then link:
```bash
cd /Users/baradwajvaradharajan/playground/resumefy
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Verify Setup

```bash
supabase status
```

You should see your project details.

---

## Creating Edge Functions

### For Resumefy V2, we'll create 2 Edge Functions:

1. **parse-resume** - Extract structured data from uploaded resumes
2. **tailor-resume** - AI-powered resume optimization

### Create Functions

```bash
# From project root
supabase functions new parse-resume
supabase functions new tailor-resume
```

This creates:
```
supabase/
  functions/
    parse-resume/
      index.ts
    tailor-resume/
      index.ts
```

---

## Setting Up Secrets

Edge Functions need access to the OpenAI API key. Store it securely:

```bash
supabase secrets set OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

Verify secrets:
```bash
supabase secrets list
```

---

## Deploying Edge Functions

### Deploy Individual Function
```bash
supabase functions deploy parse-resume
```

### Deploy All Functions
```bash
supabase functions deploy
```

### Check Deployment Status
```bash
supabase functions list
```

---

## Calling Edge Functions from Frontend

### Example: Call from React

```typescript
import { supabase } from './supabaseClient'

// Call parse-resume Edge Function
const { data, error } = await supabase.functions.invoke('parse-resume', {
  body: {
    resumeId: 'uuid-here',
    fileUrl: 'https://...'
  }
})

if (error) {
  console.error('Error:', error)
} else {
  console.log('Parsed resume:', data)
}
```

---

## Local Development & Testing

### Start Local Supabase

```bash
supabase start
```

This starts:
- Local Postgres database
- Local Edge Functions runtime
- Studio UI at http://localhost:54323

### Serve Edge Function Locally

```bash
supabase functions serve parse-resume --env-file ./supabase/.env.local
```

### Test Locally

Create `supabase/.env.local`:
```bash
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Call locally:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/parse-resume' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"resumeId":"test-id","fileUrl":"https://..."}'
```

---

## Edge Function Template

Here's a basic template for Resumefy Edge Functions:

```typescript
// supabase/functions/FUNCTION_NAME/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Parse request body
    const { param1, param2 } = await req.json()

    // Your logic here
    const result = {
      success: true,
      data: 'processed data'
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

---

## Common Edge Function Patterns for Resumefy

### 1. Accessing Uploaded Files

```typescript
// Download file from Supabase Storage
const { data: fileData, error } = await supabase.storage
  .from('resume')
  .download(filePath)

if (error) throw error

// Convert to text or process
const fileText = await fileData.text()
```

### 2. Calling OpenAI API

```typescript
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "You are a helpful assistant" },
    { role: "user", content: "Extract resume data from this text..." }
  ],
  response_format: { type: "json_object" }
})

const result = JSON.parse(response.choices[0].message.content)
```

### 3. Updating Database

```typescript
// Update resume with parsed data
const { data, error } = await supabase
  .from('resumes')
  .update({
    parsed_json: parsedData,
    parsing_status: 'completed'
  })
  .eq('id', resumeId)
  .select()
  .single()
```

### 4. Credit Check & Deduction

```typescript
// Check credits
const { data: credits } = await supabase
  .from('user_credits')
  .select('credits_remaining')
  .eq('user_id', userId)
  .single()

if (credits.credits_remaining <= 0) {
  return new Response(
    JSON.stringify({ error: 'No credits remaining' }),
    { status: 402, headers: corsHeaders }
  )
}

// Deduct credit via RPC
await supabase.rpc('deduct_credit', { user_id: userId })
```

---

## Debugging Edge Functions

### View Logs (Production)

```bash
supabase functions logs parse-resume
```

### View Logs (Real-time)

```bash
supabase functions logs parse-resume --follow
```

### Common Issues

**Issue: "Function not found"**
- Solution: Make sure you deployed: `supabase functions deploy FUNCTION_NAME`

**Issue: "Unauthorized"**
- Solution: Check you're passing the anon key in Authorization header

**Issue: "Secrets not found"**
- Solution: Set secrets: `supabase secrets set KEY=value`

**Issue: CORS errors**
- Solution: Add CORS headers (see template above)

---

## Cost & Limits

### Free Tier (Current Plan)
- **500,000 invocations per month** - FREE
- **50 concurrent executions**
- **10 second timeout per function**
- **2 MB request/response size limit**

### When You Hit Limits
If you exceed 500k invocations:
- Pro Plan: $25/month for 2 million invocations
- Pay-as-you-go: $2 per 1 million after that

**Estimate for Resumefy:**
- Parse resume: 1 invocation per upload
- Tailor resume: 1 invocation per job
- If 10,000 users each upload 1 resume and tailor for 5 jobs = 60,000 invocations
- **Well within free tier** 🎉

---

## Next Steps

Once setup is complete, you'll implement:

1. **Phase 3**: `parse-resume` Edge Function
   - Extract text from PDF/DOCX
   - Use OpenAI to structure into JSON
   - Update database

2. **Phase 4**: `tailor-resume` Edge Function
   - Fetch resume + job description
   - Call OpenAI for tailoring
   - Calculate fit score
   - Deduct credit
   - Save to `jobs` table

---

## Useful Commands Reference

```bash
# Setup
supabase login
supabase link --project-ref YOUR_REF
supabase status

# Create functions
supabase functions new FUNCTION_NAME

# Manage secrets
supabase secrets set KEY=value
supabase secrets list
supabase secrets unset KEY

# Deploy
supabase functions deploy FUNCTION_NAME
supabase functions deploy  # deploy all

# Logs
supabase functions logs FUNCTION_NAME
supabase functions logs FUNCTION_NAME --follow

# Local development
supabase start
supabase functions serve FUNCTION_NAME
supabase stop
```

---

## Ready to Build?

Once you verify this setup works, we can proceed to Phase 3 and start building the actual Edge Functions! 🚀
