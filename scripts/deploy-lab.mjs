#!/usr/bin/env node
/**
 * Deploy to lab 163.17.21.29 via SSH (from your PC)
 * Usage: node scripts/deploy-lab.mjs [ssh-user]
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lab = JSON.parse(readFileSync(join(root, "scripts", "lab.config.json"), "utf8"));
const user = process.argv[2] || process.env.LAB_SSH_USER || "";

if (!user) {
  console.log(`
Lab 主機：${lab.host}
分享網址：${lab.publicUrl}

請提供 SSH 帳號，例如：
  node scripts/deploy-lab.mjs 你的學號

或設定環境變數：
  set LAB_SSH_USER=你的學號
  node scripts/deploy-lab.mjs
`);
  process.exit(1);
}

const sshTarget = `${user}@${lab.host}`;
const remoteDir = lab.deployPath.replace(/^~/, `$HOME`);

console.log(`\n連線到 ${sshTarget} ...\n`);

function ssh(cmd) {
  const r = spawnSync("ssh", ["-p", String(lab.sshPort), sshTarget, cmd], {
    stdio: "inherit",
    shell: true,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function scp(local, remote) {
  const r = spawnSync(
    "scp",
    ["-P", String(lab.sshPort), local, `${sshTarget}:${remote}`],
    { stdio: "inherit", shell: true },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const tarball = join(tmpdir(), "portfolio-lab-deploy.tar.gz");
if (existsSync(tarball)) unlinkSync(tarball);

console.log("1/4 打包專案...");
execSync(
  `tar -czf "${tarball}" --exclude=node_modules --exclude=.next --exclude=.git --exclude=deploy-package.tar.gz .`,
  { cwd: root, stdio: "inherit", shell: true },
);

console.log("\n2/4 上傳到 Lab...");
ssh(`mkdir -p ${remoteDir}`);
scp(tarball, "/tmp/portfolio-lab-deploy.tar.gz");
ssh(`tar -xzf /tmp/portfolio-lab-deploy.tar.gz -C ${remoteDir} && rm /tmp/portfolio-lab-deploy.tar.gz`);
if (existsSync(tarball)) unlinkSync(tarball);
console.log("\n3/4 在 Lab 上安裝與建置...");
ssh(`
cd ${remoteDir}
if [ ! -f .env ]; then
  echo 'NODE_ENV=production' > .env
  echo 'DATABASE_URL="file:./dev.db"' >> .env
  echo 'SESSION_SECRET='$(openssl rand -hex 32 2>/dev/null || echo changeme) >> .env
  echo 'NEXT_PUBLIC_SITE_URL="${lab.publicUrl}"' >> .env
  echo 'GOOGLE_DRIVE_WSI_ROOT_FOLDER_ID=1k3oCXPchJL6IRj_5vAb5BBivjHt10gZZ' >> .env
fi
`);
ssh(`cd ${remoteDir} && npm ci && npx prisma generate && (npx prisma migrate deploy || npx prisma db push) && npm run build`);

console.log("\n4/4 啟動 pm2 ...");
ssh(`cd ${remoteDir} && (npm install -g pm2 2>/dev/null || true) && pm2 delete portfolio 2>/dev/null || true && pm2 start ecosystem.config.cjs && pm2 save`);

const note = [
  "Lab 作品集 — 固定網址（像學長一樣，複製貼上即可）",
  "",
  `首頁：${lab.publicUrl}`,
  `WSI： ${lab.wsiUrl}`,
  "",
  `SSH：ssh ${sshTarget}`,
  `更新：node scripts/deploy-lab.mjs ${user}`,
].join("\n");
writeFileSync(join(root, "公開網址.txt"), note, "utf8");
try {
  writeFileSync(join(process.env.USERPROFILE || "", "Desktop", "作品集公開網址.txt"), note, "utf8");
} catch {
  /* ignore */
}

console.log("\n========================================");
console.log("  部署完成！分享給別人：");
console.log(`  ${lab.publicUrl}`);
console.log("========================================\n");
