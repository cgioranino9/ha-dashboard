#!/bin/sh
# Run this ON THE MINI PC (e.g. pasted into the "Advanced SSH & Web Terminal"
# add-on's web terminal) to pull the latest commit from GitHub and redeploy
# the dashboard. One-shot: no background process, nothing left running after
# it finishes.
#
# First-time setup (once per machine) — creates the volume, clones the repo,
# and seeds the env file — is documented in README.md. This script assumes
# that's already done: a `ha-dashboard-repo` Docker volume containing the git
# clone and a `.env.local` with HA_URL/HA_TOKEN.

docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ha-dashboard-repo:/repo \
  docker:cli sh -c '
    apk add --no-cache git >/dev/null 2>&1
    cd /repo
    git fetch -q origin main
    git reset -q --hard origin/main
    docker build -t ha-dashboard:latest /repo
    docker rm -f ha-dashboard 2>/dev/null || true
    docker run -d --name ha-dashboard --restart unless-stopped -p 3000:3000 --env-file /repo/.env.local ha-dashboard:latest
    echo "Deployed $(git rev-parse --short HEAD)"
  '
