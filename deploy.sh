#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# MindBridge — Deployment Script
# Usage:  bash deploy.sh <WEB01_IP> <WEB02_IP> <LB01_IP> [ssh-user]
#
# What this script does:
#   1. Copies all static files to Web01 and Web02 via scp
#   2. SSHes into each web server and installs / reloads Nginx
#   3. SSHes into Lb01, writes the load-balancer config, and reloads Nginx
#
# Requirements: ssh access (key-based recommended) to all three servers
# ─────────────────────────────────────────────────────────────────

set -euo pipefail

WEB01="${1:?Usage: bash deploy.sh <WEB01_IP> <WEB02_IP> <LB01_IP> [user]}"
WEB02="${2:?Missing WEB02_IP}"
LB01="${3:?Missing LB01_IP}"
USER="${4:-ubuntu}"

FILES="index.html style.css app.js config.js config.example.js"
REMOTE_DIR="/var/www/html"

echo "==> Deploying MindBridge to Web01 ($WEB01) and Web02 ($WEB02)"

for IP in "$WEB01" "$WEB02"; do
  echo "--- Copying files to $USER@$IP ---"
  scp -o StrictHostKeyChecking=no $FILES "$USER@$IP:/tmp/"

  echo "--- Configuring Nginx on $IP ---"
  ssh -o StrictHostKeyChecking=no "$USER@$IP" bash -s <<'REMOTE'
    set -e
    if ! command -v nginx &>/dev/null; then
      sudo apt-get update -qq && sudo apt-get install -y nginx
    fi
    sudo mkdir -p /var/www/html
    sudo mv /tmp/*.html /tmp/*.css /tmp/*.js /var/www/html/
    sudo systemctl enable --now nginx
    sudo systemctl reload nginx
    echo "Nginx ready on $(hostname)"
REMOTE
done

echo ""
echo "==> Configuring load balancer on Lb01 ($LB01)"

ssh -o StrictHostKeyChecking=no "$USER@$LB01" bash -s -- "$WEB01" "$WEB02" <<'REMOTE'
  set -e
  WEB01="$1"
  WEB02="$2"

  if ! command -v nginx &>/dev/null; then
    sudo apt-get update -qq && sudo apt-get install -y nginx
  fi

  sudo tee /etc/nginx/sites-available/mindbridge-lb > /dev/null <<NGINX
upstream mindbridge {
    least_conn;
    server ${WEB01}:80 max_fails=3 fail_timeout=30s;
    server ${WEB02}:80 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name alineteta.me www.alineteta.me;
    add_header X-Served-By \$upstream_addr always;

    location / {
        proxy_pass         http://mindbridge;
        proxy_http_version 1.1;
        proxy_set_header   Host            \$host;
        proxy_set_header   X-Real-IP       \$remote_addr;
        proxy_next_upstream error timeout http_502 http_503;
    }
}
NGINX

  sudo ln -sf /etc/nginx/sites-available/mindbridge-lb /etc/nginx/sites-enabled/mindbridge-lb
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t && sudo systemctl reload nginx
  
  # Install and configure Certbot for SSL
  if ! command -v certbot &>/dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
  fi
  sudo certbot --nginx -d alineteta.me -d www.alineteta.me --non-interactive --agree-tos -m admin@alineteta.me --redirect
  
  echo "Load balancer ready with HTTPS on $(hostname)"
REMOTE

echo ""
echo "==> Verifying load balancing (4 requests to http://$LB01)"
for i in {1..4}; do
  curl -sI "http://$LB01" | grep -i "X-Served-By" || true
done

echo ""
echo "✓ Deployment & SSL configuration complete!"
echo "  App is live securely at: https://alineteta.me"
