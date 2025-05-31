# 🐳 Docker Deployment Guide - Criminal Code AI

## Quick Start

### Development Setup (Recommended)
```bash
# Use your existing Qdrant container and run the app locally
export QDRANT_URL=http://localhost:6333
npm run dev
```

### Full Docker Development
```bash
# Start Qdrant only (keep developing with npm run dev)
./docker-deploy.sh development

# OR start everything in containers
./docker-deploy.sh production
```

## 🚀 Deployment Options

### Option 1: Local Development (Current Setup) ✅

**What you have:**
- Qdrant running in Docker (port 6333)
- Next.js app running with `npm run dev`

**Environment variables:**
```bash
QDRANT_URL=http://localhost:6333
OPENAI_API_KEY=your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Option 2: Docker Compose (Recommended for Production)

**Complete setup with both services:**
```bash
# Start everything
docker-compose up -d

# Or use the deployment script
./docker-deploy.sh production
```

### Option 3: Cloud Deployment

#### A. Railway (Easiest)
1. **Deploy Qdrant:**
   ```bash
   # Railway will auto-deploy from Docker image
   # Use image: qdrant/qdrant:latest
   ```

2. **Deploy Your App:**
   ```bash
   # Railway auto-detects Dockerfile
   # Set environment variables in Railway dashboard
   ```

#### B. DigitalOcean App Platform
1. **Create App from GitHub**
2. **Add Qdrant Database:**
   - Use DigitalOcean Managed Database
   - Or deploy Qdrant container

3. **Environment Variables:**
   ```
   QDRANT_URL=https://your-qdrant-instance.com
   OPENAI_API_KEY=your_key_here
   ```

#### C. AWS ECS/EKS
```yaml
# docker-compose.prod.yml for cloud
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage
    
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - QDRANT_URL=http://qdrant:6333
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

## 🔧 Configuration Examples

### Local Development (.env)
```bash
OPENAI_API_KEY=sk-your-key-here
QDRANT_URL=http://localhost:6333
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Production (.env.production)
```bash
OPENAI_API_KEY=sk-your-key-here
QDRANT_URL=https://your-qdrant-cloud.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-api-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

## 📊 Monitoring & Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f qdrant
docker-compose logs -f app

# Recent logs
docker-compose logs --tail=100 app
```

### Health Checks
```bash
# Qdrant health
curl http://localhost:6333/health

# App health
curl http://localhost:3000/api/init

# Check collections
curl http://localhost:6333/collections
```

### Container Status
```bash
docker-compose ps
docker stats
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :6333
   
   # Kill existing Qdrant
   docker stop gallant_banach
   ```

2. **Qdrant Connection Failed**
   ```bash
   # Check if Qdrant is running
   docker ps | grep qdrant
   
   # Restart Qdrant
   docker-compose restart qdrant
   ```

3. **Build Failures**
   ```bash
   # Clean build
   docker-compose down
   docker system prune -f
   docker-compose build --no-cache
   ```

4. **Volume Permissions**
   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER ./qdrant_storage
   ```

## 🎯 Production Recommendations

### 1. Resource Allocation
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  qdrant:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

### 2. Security
```yaml
# Add to docker-compose.yml
services:
  qdrant:
    environment:
      - QDRANT__SERVICE__API_KEY=${QDRANT_API_KEY}
    # Remove public port exposure in production
    expose:
      - "6333"
```

### 3. Backup Strategy
```bash
# Backup Qdrant data
docker run --rm -v criminal-code-ai_qdrant_data:/data -v $(pwd):/backup alpine tar czf /backup/qdrant-backup-$(date +%Y%m%d).tar.gz /data

# Restore
docker run --rm -v criminal-code-ai_qdrant_data:/data -v $(pwd):/backup alpine tar xzf /backup/qdrant-backup-20231201.tar.gz -C /
```

## 🌐 Cloud-Specific Deployments

### Railway Deployment
1. **Connect GitHub repository**
2. **Add services:**
   - Web Service (auto-detects Dockerfile)
   - Database Service (Qdrant from Docker Hub)
3. **Set environment variables**
4. **Deploy**

### DigitalOcean
1. **Create App from GitHub**
2. **Add components:**
   - Web Component (Dockerfile)
   - Database Component (Qdrant)
3. **Configure networking**
4. **Deploy**

### AWS ECS
1. **Create task definition**
2. **Define services**
3. **Set up load balancer**
4. **Configure auto-scaling**

## 📋 Quick Commands

```bash
# Development workflow
./docker-deploy.sh development  # Start Qdrant only
npm run dev                     # Run app locally

# Production workflow  
./docker-deploy.sh production   # Full Docker setup

# Maintenance
docker-compose logs -f          # View logs
docker-compose restart qdrant   # Restart database
docker-compose down            # Stop everything
docker system prune -f        # Clean up
```

## 🎉 Success Metrics

- ✅ Qdrant accessible at http://localhost:6333
- ✅ App accessible at http://localhost:3000
- ✅ PDF upload working
- ✅ Vector search functional
- ✅ Legal analysis responsive 