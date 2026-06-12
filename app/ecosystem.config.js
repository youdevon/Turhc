module.exports = {
  apps: [
    {
      name: "infrastructure-website",
      cwd: "/home/dl/projects/infrastructure-website/app",
      script: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: "3010",
      },
    },
  ],
};
