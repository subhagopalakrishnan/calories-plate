# Deployment Guide

This guide will help you deploy Calories Plate to GitHub and Vercel.

## 🚀 Quick Deploy to Vercel

The fastest way to deploy is using Vercel's one-click deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/calories-plate)

## 📋 Step-by-Step Deployment

### Part 1: Deploy to GitHub

#### 1. Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Name your repository (e.g., `calories-plate`)
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

#### 2. Initialize Git and Push to GitHub

Open your terminal in the project directory and run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Calories Plate app"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/calories-plate.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Part 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up or log in with your GitHub account

2. **Import Your Repository**
   - Click **"Add New..."** → **"Project"**
   - Import your GitHub repository (`calories-plate`)
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   - In the project settings, go to **"Environment Variables"**
   - Add a new variable:
     - **Name**: `GEMINI_API_KEY`
     - **Value**: Your Gemini API key
   - Make sure to add it for **Production**, **Preview**, and **Development** environments
   - Click **"Save"**

4. **Deploy**
   - Click **"Deploy"**
   - Wait for the build to complete (usually 1-2 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked for environment variables, add `GEMINI_API_KEY`

4. **Set Environment Variables**
   ```bash
   vercel env add GEMINI_API_KEY
   ```
   - Paste your API key when prompted
   - Select all environments (Production, Preview, Development)

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## 🔧 Environment Variables Setup

### For Vercel:

1. Go to your project on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key
   - **Environments**: Select all (Production, Preview, Development)

### For Local Development:

Create a `.env.local` file in the root directory:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

## 📝 Post-Deployment Checklist

- [ ] Environment variable `GEMINI_API_KEY` is set in Vercel
- [ ] App is accessible at your Vercel URL
- [ ] Test image upload functionality
- [ ] Verify API responses are working
- [ ] Check Vercel logs for any errors

## 🔄 Updating Your Deployment

After making changes to your code:

```bash
# Commit your changes
git add .
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

Vercel will automatically detect the push and redeploy your app!

## 🐛 Troubleshooting

### Build Fails

- Check Vercel build logs for errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version (should be 18+)

### API Not Working

- Verify `GEMINI_API_KEY` is set in Vercel environment variables
- Check that the API key is valid
- Review Vercel function logs for API errors

### Images Not Uploading

- Check file size limits (Vercel has a 4.5MB limit for serverless functions)
- Verify API route is accessible
- Check browser console for errors

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [GitHub Guides](https://guides.github.com)

## 🎉 You're Done!

Your app should now be live and accessible to anyone on the internet!
