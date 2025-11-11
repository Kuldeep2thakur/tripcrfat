# Push Code to GitHub

Your code is ready to push, but you need to set up the GitHub repository first.

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the **+** icon in the top right
3. Select **New repository**
4. Fill in:
   - **Repository name**: `wanderlust-travel-diary` (or your preferred name)
   - **Description**: "A digital travel diary with AI-powered features"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (you already have these)
5. Click **Create repository**

## Step 2: Update Git Remote

After creating the repository, GitHub will show you the repository URL. Copy it and run:

```bash
# Remove the old placeholder remote
git remote remove origin

# Add your actual GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Verify it's correct
git remote -v
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values.

## Step 3: Push Your Code

```bash
# Push to GitHub
git push -u origin main
```

If you get an authentication error, you may need to:
- Use a Personal Access Token instead of password
- Or use SSH instead of HTTPS

### Using Personal Access Token (Recommended)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Copy the token
4. When pushing, use the token as your password

### Alternative: Use SSH

```bash
# Change remote to SSH
git remote set-url origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# Push
git push -u origin main
```

## What's Being Pushed

Your commit includes all the recent updates:
- ✅ Interactive gradient UI on home page
- ✅ Gradient forms (New Trip, New Entry, Edit Entry)
- ✅ Live location feature with "Use My Current Location" button
- ✅ Fixed Journal Entries count in dashboard
- ✅ Updated Firestore rules for collection group queries
- ✅ Enhanced dashboard stats cards with gradients
- ✅ Conditional login/signup buttons on home page
- ✅ Firebase configuration files
- ✅ Documentation files

## Quick Command Reference

```bash
# Check status
git status

# Add all changes
git add .

# Commit with message
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# View commit history
git log --oneline
```

## Need Help?

If you encounter any issues:
1. Check if you're logged into GitHub
2. Verify repository exists and you have access
3. Make sure the remote URL is correct
4. Check if you need authentication (token or SSH key)
