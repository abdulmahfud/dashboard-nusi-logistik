# Local dibuat sama persis dengan GitHub
git fetch origin && git reset --hard origin/main && git clean -fd

# GitHub dibuat sama persis dengan Local (force push)
# git add . && git commit -m "sync" || true && git push origin main --force

# Manual commit
git add . && git commit -m "update tracking lion" && git push origin main