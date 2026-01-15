# Quick Guide: Push to Your GitHub Repository

Your repository is already initialized. Follow these commands to push to your new GitHub repo.

## Commands to Run (Copy & Paste)

```bash
# 1. Update remote to your new repository
git remote set-url origin https://github.com/NazaninHashemi52/WellBAnk-IrisCube-Reply.git

# 2. Verify the remote is correct
git remote -v

# 3. Add all changes and new files
git add .

# 4. Check what will be committed (VERIFY no .env or .db files)
git status

# 5. Commit all changes
git commit -m "Initial commit: WellBank CRM System

- FastAPI backend with SQLite database
- React frontend with Vite
- AI-powered customer recommendations
- Customer clustering and segmentation
- Batch processing capabilities
- Production-ready error handling
- Comprehensive documentation"

# 6. Push to GitHub
git push -u origin main
```

## If You Get Authentication Errors

GitHub requires a Personal Access Token instead of password:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" > "Generate new token (classic)"
3. Give it a name like "WellBank Project"
4. Select scope: **repo** (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. When prompted for password, paste the token instead

## Verify Upload

After pushing, visit:
https://github.com/NazaninHashemi52/WellBAnk-IrisCube-Reply

You should see all your files!

