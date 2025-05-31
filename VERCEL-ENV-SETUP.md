# 🔧 Vercel Environment Variables Setup

## 🚨 **Fix Deployment Error: Missing OPENAI_API_KEY**

### Step 1: Go to Your Vercel Project
1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project: `criminalcode-ai-nextjs`
3. Click on the project name

### Step 2: Add Environment Variables
1. Go to **Settings** tab
2. Click **Environment Variables** in the sidebar
3. Add these 4 required variables:

#### **Environment Variables to Add:**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `OPENAI_API_KEY` | `your_actual_openai_key` | **Production, Preview** (NOT Development) |
| `QDRANT_URL` | `https://6464c6b9-f09e-4bd0-b38b-e9159c6fd1f3.us-east-1-0.aws.cloud.qdrant.io:6333` | **Production, Preview, Development** |
| `QDRANT_API_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.086XrmuBPqw8Fi1ty6IoFE8IlvZM9J5VNuOyJcEgqG8` | **Production, Preview** (NOT Development) |
| `NEXT_PUBLIC_APP_URL` | `https://your-vercel-url.vercel.app` | **Production, Preview, Development** |

### Step 3: For Each Variable:

#### **For Sensitive Variables (API Keys):**
- `OPENAI_API_KEY` and `QDRANT_API_KEY`
- **Environment:** Select **Production** and **Preview** ONLY
- **DO NOT** select Development (Vercel blocks this for security)

#### **For Non-Sensitive Variables:**
- `QDRANT_URL` and `NEXT_PUBLIC_APP_URL` 
- **Environment:** Select **All Environments** (Production, Preview, Development)

### Step 4: Redeploy
After adding all variables:
1. Go to **Deployments** tab
2. Find the latest failed deployment
3. Click the 3 dots (**...**) menu
4. Select **Redeploy**

---

## 🔐 **Why This Restriction?**

Vercel considers API keys "sensitive" and enforces team-wide security:
- **Development environment:** Uses your local `.env.local` file
- **Production/Preview:** Uses Vercel environment variables

This is actually **better security** - your API keys stay out of development branches!

---

## 📋 **Values You Need:**

### OpenAI API Key
- Get from: [OpenAI Platform](https://platform.openai.com/api-keys)
- Format: `sk-proj-...` (starts with sk-proj)

### Qdrant Cloud (Already Known)
```
URL: https://6464c6b9-f09e-4bd0-b38b-e9159c6fd1f3.us-east-1-0.aws.cloud.qdrant.io:6333
API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.086XrmuBPqw8Fi1ty6IoFE8IlvZM9J5VNuOyJcEgqG8
```

### App URL (After First Deploy)
```
https://criminalcode-ai-nextjs-[random].vercel.app
```

---

## ✅ **Quick Checklist:**
- [ ] OPENAI_API_KEY added to **Production + Preview** only
- [ ] QDRANT_API_KEY added to **Production + Preview** only
- [ ] QDRANT_URL added to **All Environments**
- [ ] NEXT_PUBLIC_APP_URL added to **All Environments**
- [ ] Redeployed after adding variables

**After setup:** Your GitHub Actions will automatically deploy on every push to `development` branch! 🚀 