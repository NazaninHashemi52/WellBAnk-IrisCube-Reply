# Git Setup Guide - Push to GitHub

Follow these steps to push your WellBank project to GitHub.

## Step-by-Step Instructions

### Step 1: Initialize Git Repository (if not already done)

```bash
git init
```

### Step 2: Add Remote Repository

```bash
git remote add origin https://github.com/NazaninHashemi52/WellBAnk-IrisCube-Reply.git
```

### Step 3: Verify .gitignore is Working

Check what files will be ignored:

```bash
git status --ignored
```

You should see files like:
- `venv/`
- `node_modules/`
- `*.db` files
- `.env` files
- `backend/uploads/`

### Step 4: Add All Files to Git

```bash
git add .
```

### Step 5: Review What Will Be Committed

**IMPORTANT:** Verify that sensitive files are NOT included:

```bash
git status
```

Make sure you DON'T see:
- ❌ `.env` files
- ❌ `*.db` or `*.sqlite` files
- ❌ `venv/` or `node_modules/` directories
- ❌ Large CSV files from `uploads/`

### Step 6: Create Initial Commit

```bash
git commit -m "Initial commit: WellBank CRM System

- FastAPI backend with SQLite database
- React frontend with Vite
- AI-powered customer recommendations
- Customer clustering and segmentation
- Batch processing capabilities
- Production-ready error handling
- Comprehensive documentation"
```

### Step 7: Set Main Branch (if needed)

```bash
git branch -M main
```

### Step 8: Push to GitHub

```bash
git push -u origin main
```

You will be prompted for your GitHub username and password (or personal access token).

## Complete Command Sequence

Copy and paste these commands one by one:

```bash
# 1. Initialize (if needed)
git init

# 2. Add remote
git remote add origin https://github.com/NazaninHashemi52/WellBAnk-IrisCube-Reply.git

# 3. Check status
git status

# 4. Add all files
git add .

# 5. Verify what will be committed
git status

# 6. Commit
git commit -m "Initial commit: WellBank CRM System"

# 7. Set branch name
git branch -M main

# 8. Push to GitHub
git push -u origin main
```

## Troubleshooting

### If you get "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/NazaninHashemi52/WellBAnk-IrisCube-Reply.git
```

### If you get authentication errors
You may need to use a Personal Access Token instead of your password:
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `repo` permissions
3. Use the token as your password when prompted

### If you get "failed to push some refs"
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### If files are too large
GitHub has a 100MB file size limit. If you see errors about large files:
- Check `backend/uploads/` - these should be gitignored
- Check `backend/models/*.pkl` - these might be large
- Use Git LFS for large files if needed

## Verify Upload

After pushing, visit your repository:
https://github.com/NazaninHashemi52/WellBAnk-IrisCube-Reply

You should see all your project files!

