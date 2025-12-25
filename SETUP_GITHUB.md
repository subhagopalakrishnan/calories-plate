# Quick GitHub Setup Guide

Follow these steps to push your code to GitHub:

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `calories-plate` (or any name you prefer)
3. Choose **Public** or **Private**
4. **DO NOT** check "Add a README file" (we already have one)
5. Click **"Create repository"**

## Step 2: Push Your Code

Copy and paste these commands in your terminal (replace `YOUR_USERNAME` with your GitHub username):

```bash
# Navigate to your project directory
cd "/Users/subha.gopalakrishnan/Documents/Cursor Tutorial/Calories Plate"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Calories Plate app with Gemini API"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/calories-plate.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Verify

Go to your GitHub repository URL:
```
https://github.com/YOUR_USERNAME/calories-plate
```

You should see all your files there!

## Next: Deploy to Vercel

Once your code is on GitHub, follow the [DEPLOYMENT.md](./DEPLOYMENT.md) guide to deploy to Vercel.

