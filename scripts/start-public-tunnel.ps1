# 讓外網（不同 Wi-Fi / 手機 4G）也能連到你的本機作品集
# 需先安裝 cloudflared： winget install Cloudflare.cloudflared
# 並確保 npm run start 已在 http://localhost:3000 運行

Write-Host "啟動 Cloudflare 臨時隧道 → http://localhost:3000"
Write-Host "完成後會顯示 https://xxxx.trycloudflare.com 網址，分享給他人即可。"
cloudflared tunnel --url http://localhost:3000
