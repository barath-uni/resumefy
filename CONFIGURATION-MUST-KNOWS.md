# Configuration Must-Knows: Local vs Production

**Quick Reference**: Critical config differences between localhost and production deployment to avoid auth/routing failures.

---

## 🔧 Environment Variables

### **Frontend (`frontend/.env`)**

| Variable | Localhost | Production (Vercel) |
|----------|-----------|---------------------|
| `VITE_APP_URL` | `http://localhost:5173` | `https://www.resumefy.app` |
| `VITE_SUPABASE_URL` | Same for both | Same for both |
| `VITE_SUPABASE_ANON_KEY` | Same for both | Same for both |
| `VITE_GA_TRACKING_ID` | Same for both | Same for both |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Test key | Live key (for prod) |
| `VITE_STRIPE_PRICE_ID_*` | Test price IDs | Live price IDs (for prod) |

**⚠️ CRITICAL**:
- **MUST update `VITE_APP_URL` in Vercel Environment Variables** before deploying
- Supabase auth redirects use this URL - wrong value = 404 on login
- Set in Vercel Dashboard → Project Settings → Environment Variables

### **Backend (`backend/.env`)**

| Variable | Localhost | Production (Supabase) |
|----------|-----------|----------------------|
| `OPENAI_API_KEY` | Same for both | Same (set in Supabase Secrets) |
| `STRIPE_SECRET_KEY` | Test key | Live key (for prod) |
| `STRIPE_WEBHOOK_SECRET` | CLI test secret | Production webhook secret |

**⚠️ CRITICAL**:
- Backend env vars are set in **Supabase Edge Functions Secrets**, NOT in `.env` for production
- Use `supabase secrets set KEY=value` to configure production
- Never commit secrets to git

---

## 🌐 Deployment Configuration

### **Vercel (Frontend)**

**File**: `vercel.json` (root directory)

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Why needed**:
- ✅ Enables SPA routing for nested paths like `/app/dashboard`
- ✅ Tells Vercel to serve `index.html` for ALL routes
- ❌ **Without this**: `/app/dashboard` → 404 NOT_FOUND

**Vercel Framework Settings**:
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Dev Command: `vite`

### **Supabase (Backend)**

**Auth Redirect URLs** (Dashboard → Authentication → URL Configuration):

Must include:
- `http://localhost:5173/app/dashboard` (for local testing)
- `https://www.resumefy.app/app/dashboard` (for production)
- Any other redirect paths (e.g., `/app/billing/success`)

**⚠️ CRITICAL**:
- Supabase validates redirect URLs against this whitelist
- Missing URL = "Invalid redirect URL" error

---

## 📋 Pre-Deployment Checklist

### **Before Every Production Deploy:**

#### **1. Frontend Environment Variables (Vercel)**
- [ ] `VITE_APP_URL` = `https://www.resumefy.app`
- [ ] Stripe keys are LIVE keys (not test)
- [ ] All environment variables are set in Vercel Dashboard

#### **2. Supabase Configuration**
- [ ] Redirect URLs include production domain
- [ ] Edge Function secrets are set (`supabase secrets list`)
- [ ] Database RLS policies are enabled

#### **3. Deployment Files**
- [ ] `vercel.json` exists in root
- [ ] `frontend/dist/` is gitignored (built fresh on deploy)
- [ ] No `.env` files committed to git

#### **4. Test Production Auth Flow**
- [ ] Magic link redirects to correct URL
- [ ] `/app/dashboard` loads without 404
- [ ] Session persists after redirect

---

## 🐛 Common Mistakes & Fixes

### **Issue 1: 404 on `/app/dashboard` after auth redirect**
- **Cause**: Missing `vercel.json`
- **Fix**: Create `vercel.json` in project root with SPA rewrites

### **Issue 2: Supabase redirects to localhost in production**
- **Cause**: `VITE_APP_URL` not updated in Vercel
- **Fix**: Set `VITE_APP_URL=https://www.resumefy.app` in Vercel Environment Variables
- **Important**: Redeploy after changing env vars

### **Issue 3: "Invalid redirect URL" error**
- **Cause**: Redirect URL not whitelisted in Supabase
- **Fix**: Add URL in Supabase Dashboard → Authentication → URL Configuration

### **Issue 4: Stripe payments fail in production**
- **Cause**: Using test keys in production
- **Fix**: Update to live Stripe keys in Vercel env vars

### **Issue 5: Edge Function fails with "Missing API Key"**
- **Cause**: Secrets not set in Supabase production
- **Fix**: Run `supabase secrets set OPENAI_API_KEY=sk-...`

---

## 🔍 How Localhost Differs from Production

| Aspect | Localhost (Vite Dev Server) | Production (Vercel) |
|--------|----------------------------|---------------------|
| **Routing** | Vite auto-serves index.html for all paths | Needs `vercel.json` for SPA routing |
| **Env Vars** | Read from `frontend/.env` | Read from Vercel Environment Variables |
| **Build Process** | No build needed (`npm run dev`) | Builds static files to `dist/` |
| **Hot Reload** | Yes (instant updates) | No (must redeploy) |
| **HTTPS** | Optional (uses http://localhost) | Always HTTPS |
| **Supabase Auth** | Redirects to localhost:5173 | Redirects to resumefy.app |

---

## 🎯 Quick Deploy Command

```bash
# 1. Update env vars in Vercel Dashboard first!
# 2. Commit and push
git add vercel.json
git commit -m "Add Vercel SPA config"
git push origin main

# 3. Vercel auto-deploys on push (if GitHub integration enabled)
# 4. Or trigger manual deploy in Vercel Dashboard
```

---

## 📌 Key Takeaways

1. **`vercel.json` is MANDATORY** for nested React Router paths in production
2. **`VITE_APP_URL` MUST match deployment domain** (localhost vs production)
3. **Supabase redirect URLs must be whitelisted** for each environment
4. **Backend secrets live in Supabase**, not in `.env` files
5. **Always test auth flow after deploying** to catch redirect issues early

---

**Last Updated**: 2025-11-10
**Next Review**: Before next production deployment
