#!/bin/bash
# 在 Lab 主機上執行（首次部署）
# 用法：ssh 你的帳號@163.17.21.29 'bash -s' < scripts/lab-first-setup.sh

set -e
REPO_URL="${REPO_URL:-https://github.com/YOUR_USER/smart-medical-portfolio.git}"
DEPLOY_DIR="${DEPLOY_DIR:-$HOME/smart-medical-portfolio}"
PORT=8080

echo "=== Lab 作品集部署 163.17.21.29:$PORT ==="

if ! command -v node >/dev/null 2>&1; then
  echo "請先安裝 Node.js 20+（或請管理員安裝）"
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "安裝 pm2..."
  npm install -g pm2
fi

if [ ! -d "$DEPLOY_DIR/.git" ]; then
  echo "複製專案到 $DEPLOY_DIR ..."
  git clone "$REPO_URL" "$DEPLOY_DIR"
fi

cd "$DEPLOY_DIR"
git pull || true

if [ ! -f .env ]; then
  cat > .env <<EOF
NODE_ENV=production
DATABASE_URL="file:./dev.db"
SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p)
NEXT_PUBLIC_SITE_URL="http://163.17.21.29:8080"
GOOGLE_DRIVE_WSI_ROOT_FOLDER_ID=1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ
EOF
  echo "已建立 .env"
fi

npm ci
npx prisma generate
npx prisma migrate deploy || npx prisma db push
npm run build

pm2 delete portfolio 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup 2>/dev/null || true

echo ""
echo "=========================================="
echo "  部署完成！分享這個網址："
echo "  http://163.17.21.29:8080"
echo "=========================================="
