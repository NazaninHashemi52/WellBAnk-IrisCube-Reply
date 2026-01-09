# Git Commands to Push to GitHub

## Step 1: Add all changes (including deletions and new files)
```bash
git add -A
```

## Step 2: Commit with a descriptive message
```bash
git commit -m "Complete project restructure: Clean codebase, organized structure, professional documentation"
```

## Step 3: Force push to main branch (replaces previous version)
```bash
git push origin main --force
```

## Alternative: If you want to see what will be committed first
```bash
# Check what will be committed
git status

# See the diff
git diff --cached

# Then proceed with commit and push
```

## ⚠️ WARNING
The `--force` flag will **overwrite** everything on the remote main branch. Make sure you want to replace the previous version completely.

---

## Complete Command Sequence (Copy & Paste):

```bash
git add -A
git commit -m "Complete project restructure: Clean codebase, organized structure, professional documentation"
git push origin main --force
```

