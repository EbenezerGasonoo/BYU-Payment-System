# 🚀 Deployment Guide

This guide will help you deploy your BYU Payment System to production with automatic GitHub Actions deployment.

## 📋 Prerequisites

- GitHub repository with your code
- Vercel account (for frontend)
- Railway account (for backend)
- MongoDB Atlas account (for production database)

## 🔧 Setup Instructions

### 1. Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Import your GitHub repository
   - Set Root Directory to `frontend`
   - Framework Preset: Vite

3. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-url.railway.app`

4. **Get Vercel Tokens**
   - Go to Account Settings → Tokens
   - Create a new token
   - Copy the token

### 2. Backend Deployment (Railway)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Deploy from GitHub repo
   - Select your repository
   - Set Root Directory to `backend`

3. **Configure Environment Variables**
   - Go to Variables tab
   - Add all variables from your `.env` file:
     ```
     PORT=3000
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/byu-payment-system
     JWT_SECRET=your-production-jwt-secret
     ADMIN_KEY=byu-admin-2025-secret-key
     ADMIN_EMAIL=iamknightrae@gmail.com
     EMAIL_SERVICE=gmail
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASS=your-app-password
     ```

4. **Get Railway Token**
   - Go to Account Settings → Tokens
   - Create a new token
   - Copy the token

### 3. MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
   - Create a free cluster

2. **Configure Database**
   - Create a database named `byu-payment-system`
   - Create a user with read/write permissions
   - Get the connection string

3. **Update Environment Variables**
   - Use the MongoDB Atlas connection string in Railway

### 4. GitHub Secrets Setup

1. **Go to Your GitHub Repository**
   - Click Settings → Secrets and variables → Actions

2. **Add the Following Secrets:**
   ```
   VERCEL_TOKEN=your-vercel-token
   VERCEL_ORG_ID=your-vercel-org-id
   VERCEL_PROJECT_ID=your-vercel-project-id
   RAILWAY_TOKEN=your-railway-token
   VITE_API_URL=https://your-backend-url.railway.app
   ```

3. **How to Get Vercel IDs:**
   - Go to your Vercel project settings
   - Find "Project ID" and "Team ID" (Org ID)

## 🔄 Automatic Deployment

Once everything is set up:

1. **Push to Main Branch**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

2. **GitHub Actions will automatically:**
   - Build the frontend
   - Deploy to Vercel
   - Deploy backend to Railway
   - Notify you of success/failure

3. **Check Deployment Status**
   - Go to your GitHub repository
   - Click "Actions" tab
   - Monitor the deployment progress

## 🌐 Access Your Live App

- **Frontend:** `https://your-project-name.vercel.app`
- **Backend API:** `https://your-backend-url.railway.app`
- **Health Check:** `https://your-backend-url.railway.app/api/health`

## 🔧 Manual Deployment (Alternative)

If you prefer manual deployment:

### Frontend (Vercel CLI)
```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

### Backend (Railway CLI)
```bash
cd backend
npm install -g @railway/cli
railway login
railway up
```

## 🐛 Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check environment variables
   - Verify Node.js version compatibility
   - Check build logs in GitHub Actions

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has correct permissions

3. **CORS Issues**
   - Update CORS settings in backend
   - Verify frontend URL in backend configuration

4. **Email Not Working**
   - Check Gmail app password
   - Verify email service configuration
   - Check Railway logs for email errors

## 📊 Monitoring

- **Vercel Dashboard:** Monitor frontend performance
- **Railway Dashboard:** Monitor backend logs and metrics
- **MongoDB Atlas:** Monitor database performance
- **GitHub Actions:** Monitor deployment status

## 🔄 Updating Your App

To update your live app:

1. Make changes to your code
2. Commit and push to main branch
3. GitHub Actions will automatically deploy
4. Your live app will be updated in minutes

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Database connection working
- [ ] Email service configured
- [ ] CORS settings updated
- [ ] Health check endpoint working
- [ ] SSL certificates active
- [ ] Domain configured (optional)
- [ ] Monitoring set up

## 📞 Support

If you encounter issues:
- Check the deployment logs
- Review environment variables
- Verify service configurations
- Contact support for the respective platforms

---

**Note:** This deployment setup provides automatic CI/CD. Every push to the main branch will trigger a new deployment, ensuring your live app is always up-to-date with your latest changes.
