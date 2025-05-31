# 🚀 GitHub Actions Auto-Deploy to Vercel

## ⚡ Super Simple Setup (5 Minutes)

### Step 1: Deploy to Vercel First (One Time)
```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel --prod
```

### Step 2: Get Vercel Tokens
After first deployment, run:
```bash
# Get your tokens
vercel env ls
```

Or go to:
- **Vercel Dashboard**: https://vercel.com/account/tokens
- **Create Token**: Click "Create" → Copy the token

### Step 3: Get Project Info
```bash
# In your project directory
cat .vercel/project.json
```

You'll see something like:
```json
{
  "orgId": "team_xxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxx"
}
```

### Step 4: Add GitHub Secrets
Go to your GitHub repo → **Settings** → **Secrets and Variables** → **Actions**

Add these 3 secrets:
- `VERCEL_TOKEN` = Your token from Step 2
- `ORG_ID` = The orgId from Step 3  
- `PROJECT_ID` = The projectId from Step 3

### Step 5: Add Environment Variables (GitHub)
In the same place, add these **Repository Secrets**:
- `OPENAI_API_KEY` = Your OpenAI API key
- `QDRANT_URL` = Your Qdrant database URL
- `QDRANT_API_KEY` = Your Qdrant API key (if using cloud)

### Step 6: Push to Development Branch
```bash
git add .
git commit -m "Add GitHub Actions auto-deploy"
git push origin development
```

## ✅ That's It!

Now every time you push to `development` branch:
1. GitHub Actions will automatically run
2. Build your app
3. Deploy to Vercel
4. Your app will be live!

## 🔍 Check Deployment Status

- **GitHub**: Go to your repo → **Actions** tab
- **Vercel**: https://vercel.com/dashboard

## 🛠️ Quick Troubleshooting

**Build fails?**
- Check the Actions tab for error logs
- Make sure all secrets are set correctly

**Environment variables missing?**
- Add them in GitHub Secrets (Step 5)
- They'll automatically be passed to Vercel

**Need different branch?**
Edit `.github/workflows/deploy.yml` and change `development` to your branch name.

## 🎯 Pro Tips

1. **Preview Deployments**: Pull requests will create preview deployments
2. **Multiple Environments**: Create separate workflows for staging/production
3. **Custom Domain**: Set up in Vercel dashboard after first deploy

**Your workflow file is ready at:** `.github/workflows/deploy.yml` 