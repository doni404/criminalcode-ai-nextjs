# 🔧 Vercel Environment Variables Setup

## 🚨 **Fix Deployment Error: Missing OPENAI_API_KEY**

### Step 1: Go to Your Vercel Project
1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project: `criminalcode-ai-nextjs`
3. Click on the project name

### Step 2: Add Environment Variables
1. Go to **Settings** tab
2. Click **Environment Variables** in the sidebar
3. Add these 3 required variables:

#### **Environment Variables to Add:**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `OPENAI_API_KEY` | `your_actual_openai_key` | Production, Preview, Development |
| `QDRANT_URL` | `https://6464c6b9-f09e-4bd0-b38b-e9159c6fd1f3.us-east-1-0.aws.cloud.qdrant.io:6333` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-vercel-url.vercel.app` | Production, Preview, Development |

### Step 3: For Each Variable:
1. Enter **Name** (e.g., `OPENAI_API_KEY`)
2. Enter **Value** (your actual API key)
3. Select **All Environments** (Production, Preview, Development)
4. Click **Save**

### Step 4: Redeploy
After adding all variables:
1. Go to **Deployments** tab
2. Find the latest failed deployment
3. Click the 3 dots (**...**) menu
4. Select **Redeploy**

---

## 📋 **Values You Need:**

### OpenAI API Key
- Get from: [OpenAI Platform](https://platform.openai.com/api-keys)
- Format: `sk-proj-...` (starts with sk-proj)

### Qdrant URL (Already Known)
```
https://6464c6b9-f09e-4bd0-b38b-e9159c6fd1f3.us-east-1-0.aws.cloud.qdrant.io:6333
```

### App URL (After First Deploy)
```
https://criminalcode-ai-nextjs-[random].vercel.app
```

---

## ✅ **Quick Checklist:**
- [ ] OPENAI_API_KEY added to Vercel
- [ ] QDRANT_URL added to Vercel  
- [ ] NEXT_PUBLIC_APP_URL added to Vercel
- [ ] All variables set for all environments
- [ ] Redeployed after adding variables

**After setup:** Your GitHub Actions will automatically deploy on every push to `development` branch! 🚀 