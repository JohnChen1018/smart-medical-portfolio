/** PM2 config for Lab server (163.17.21.29:8080) */
module.exports = {
  apps: [
    {
      name: "portfolio",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 8080",
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "8080",
      },
    },
  ],
};
