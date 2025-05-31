# 🚀 Vercel Deployment Guide - Criminal Code AI

## Prerequisites

### 1. Required Services
- **GitHub Account** (for repository hosting)
- **Vercel Account** (free tier available)
- **OpenAI API Key** (for GPT-4 access)
- **Qdrant Database** (vector database hosting)

### 2. Recommended External Services
- **Qdrant Cloud** (https://qdrant.tech/cloud/) - For vector database
- **AWS S3 or Cloudinary** (for persistent file storage)

## 🏗️ Step-by-Step Deployment

### Step 1: Setup Qdrant Database

#### Option A: Qdrant Cloud (Recommended)
1. Visit https://qdrant.tech/cloud/
2. Create account and new cluster
3. Note your cluster URL and API key
4. Update environment variables

#### Option B: Self-hosted Qdrant
1. Deploy on Railway, DigitalOcean, or AWS
2. Use Docker: `docker run -p 6333:6333 qdrant/qdrant`
3. Note your instance URL

### Step 2: Prepare Repository

1. **Push to GitHub** (if not already done):
```bash
git push origin development
```

2. **Verify Environment Variables**:
Copy `.env.example` to `.env.local` and fill in values:
```bash
cp .env.example .env.local
```

### Step 3: Deploy to Vercel

#### Option A: Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Option B: Via Vercel CLI
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

### Step 4: Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```
OPENAI_API_KEY=sk-your-openai-api-key
QDRANT_URL=https://your-qdrant-instance.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Step 5: Configure Domain (Optional)

1. In Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Update `NEXT_PUBLIC_APP_URL` to match

## ⚠️ Important Considerations

### 1. File Storage Limitation
- Vercel stores files in `/tmp` (temporary)
- Files are deleted after function execution
- **Recommendation**: Use external storage (S3, Cloudinary)

### 2. Function Timeout
- Vercel free tier: 10s timeout
- Pro tier: 60s timeout (configured in `vercel.json`)
- Large PDF processing might need optimization

### 3. Cold Starts
- First request after inactivity may be slow
- Vector database connection might timeout
- Implement connection retry logic

## 🔧 Production Optimizations

### 1. External File Storage Setup

For persistent file storage, implement S3 or Cloudinary:

```javascript
// Add to your upload API
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadToS3(filename, buffer) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: 'application/pdf',
  });
  
  await s3.send(command);
  return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${filename}`;
}
```

### 2. Database Connection Optimization

```javascript
// Add to your Qdrant client
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  timeout: 30000, // 30s timeout
});
```

### 3. Error Monitoring

Add Sentry or LogRocket for production monitoring:

```bash
npm install @sentry/nextjs
```

## 🧪 Testing Deployment

### 1. Test Core Features
- [ ] PDF upload and processing
- [ ] Legal analysis (both modes)
- [ ] Article search and retrieval
- [ ] Vector database connectivity

### 2. Performance Testing
- [ ] Large PDF processing
- [ ] Concurrent user handling
- [ ] API response times

### 3. Error Handling
- [ ] Network timeouts
- [ ] Invalid PDF files
- [ ] API rate limits

## 🚨 Troubleshooting

### Common Issues

1. **"Function timeout"**
   - Increase timeout in `vercel.json`
   - Optimize PDF processing
   - Use streaming for large files

2. **"Database connection failed"**
   - Check Qdrant URL and API key
   - Verify network connectivity
   - Implement connection retry

3. **"File not found"**
   - Files in `/tmp` are temporary
   - Implement external storage
   - Handle file persistence

### Debug Commands

```bash
# Check build logs
vercel logs

# Local production build
npm run build
npm start

# Environment variable check
vercel env ls
```

## 📊 Monitoring

### Vercel Analytics
- Enable in Dashboard → Project → Analytics
- Monitor performance and usage

### Custom Logging
```javascript
// Add to your API routes
console.log('[DEPLOY]', {
  timestamp: new Date().toISOString(),
  route: req.url,
  method: req.method,
  userAgent: req.headers['user-agent'],
});
```

## 🎯 Success Checklist

- [ ] Application builds successfully
- [ ] All environment variables configured
- [ ] Qdrant database accessible
- [ ] PDF upload working
- [ ] Legal analysis functional
- [ ] Performance acceptable
- [ ] Error handling robust
- [ ] Monitoring enabled

---

**Your Criminal Code AI is now live on Vercel! 🎉**

## 📞 Support

If you encounter issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test database connectivity
4. Monitor function timeouts

**Deployment URL**: `https://your-app.vercel.app` 