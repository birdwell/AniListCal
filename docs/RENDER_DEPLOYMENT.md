# 🆓 Deploy AniListCal to Render (100% Free)

**Render** offers a completely free tier perfect for hobby projects and learning. Your AniListCal app can run entirely free with some limitations.

## Why Render for Free Hosting?

✅ **Completely Free**: No credit card required  
✅ **No Database Required**: Uses local file storage  
✅ **Automatic HTTPS**: SSL certificates handled automatically  
✅ **Git Integration**: Auto-deploy on push  
✅ **Custom Domains**: Free `.onrender.com` subdomain  
✅ **Zero Configuration**: Detects Node.js automatically  

### Free Tier Limitations
- Apps sleep after 15 minutes of inactivity (cold starts ~30 seconds)
- 750 hours/month (enough for hobby use)
- Shared resources (slower performance)

## Step-by-Step Render Deployment

### 1. Prepare Your Repository

Ensure your `package.json` has the correct scripts (already configured):
```json
{
  "scripts": {
    "build": "cross-env NODE_ENV=production vite build && cross-env NODE_ENV=production esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "cross-env NODE_ENV=production node dist/index.js"
  }
}
```

### 2. Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (free, no credit card needed)
3. Connect your GitHub account

### 3. Set Up AniList OAuth

1. Go to [AniList Developer Settings](https://anilist.co/settings/developer)
2. Create new client application
3. Set redirect URI: `https://your-app-name.onrender.com/api/auth/callback`
4. Copy Client ID and Client Secret

### 4. Deploy Web Service

1. **Create Web Service**:
   - In Render dashboard, click "New +"
   - Select "Web Service"
   - Connect your AniListCal repository
   - Choose your repository

2. **Configure Service**:
   - **Name**: `anilistcal` (or your preferred name)
   - **Region**: Same as your database
   - **Branch**: `main` (or your default branch)
   - **Runtime**: `Node`
   - **Build Command**: `yarn build`
   - **Start Command**: `yarn start`

3. **Set Environment Variables**:
   Click "Advanced" and add these environment variables:

   ```env
   NODE_ENV=production
   ANILIST_CLIENT_ID=your_anilist_client_id
   ANILIST_CLIENT_SECRET=your_anilist_client_secret
   VITE_ANILIST_CLIENT_ID=your_anilist_client_id
   SESSION_SECRET=your_strong_random_secret
   PORT=10000
   ```

   **Generate SESSION_SECRET**:
   ```bash
   openssl rand -base64 32
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your app
   - First deployment takes 5-10 minutes

### 6. Verify Deployment

1. **Check Health**: Visit `https://your-app.onrender.com/api/health`
2. **Test Authentication**: Try logging in with AniList
3. **Check Logs**: Monitor deployment logs in Render dashboard

## Render Configuration Files

### Optional: render.yaml
Create `render.yaml` in your project root for infrastructure as code:

```yaml
services:
  - type: web
    name: anilistcal
    env: node
    buildCommand: yarn build
    startCommand: yarn start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000

```

## Performance Optimization for Free Tier

### Keep Your App Awake
Free apps sleep after 15 minutes. To minimize cold starts:

1. **Use a monitoring service** (like UptimeRobot - also free)
2. **Ping your health endpoint** every 14 minutes
3. **Accept cold starts** for true zero-cost hosting

## Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check build logs in Render dashboard
   - Ensure all dependencies are in `package.json`
   - Test `yarn build` locally

2. **Authentication Problems**:
   - Verify AniList OAuth redirect URI matches your Render URL
   - Check environment variables are set correctly
   - Test with Render logs

4. **App Sleeps/Cold Starts**:
   - This is normal for free tier
   - First request after sleep takes ~30 seconds
   - Consider upgrading to paid tier ($7/month) for always-on

### Monitoring
- **Render Dashboard**: Built-in metrics and logs
- **Health Endpoint**: `GET /api/health`
- **UptimeRobot**: Free external monitoring

## Upgrading Later

If you outgrow the free tier:
- **Starter Plan**: $7/month (always-on, faster)
- **Standard Plan**: $25/month (more resources)
- **Database**: $7/month for 10GB, $15/month for 25GB

## Cost Summary

**Free Tier (Perfect for Hobby)**:
- Web Service: Free (with sleep)
- PostgreSQL: Free (1GB)
- Custom Domain: Free (.onrender.com)
- SSL Certificate: Free
- **Total: $0/month**

**Paid Tier (Production Ready)**:
- Web Service: $7/month (always-on)
- PostgreSQL: $7/month (10GB)
- **Total: $14/month**

---

**Ready to deploy for free?** Render's free tier is perfect for learning, demos, and hobby projects. You can always upgrade later when you need more performance!
