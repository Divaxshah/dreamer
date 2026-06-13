const fs = require("node:fs");
const path = require("node:path");

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
};

const webEnv = loadEnvFile(path.join(__dirname, "apps/web/.env.local"));

module.exports = {
  apps: [
    {
      name: "dreamer-web",
      cwd: "/home/ubuntu/dreamer/apps/web",
      script: "node",
      args: ".next/standalone/server.js",
      env: {
        ...webEnv,
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "preview-router",
      cwd: "/home/ubuntu/dreamer/preview-router",
      script: "index.js",
      env: {
        PORT: 4999,
        IPC_PORT: 4998,
        WEBMAKER_PREVIEW_DOMAIN:
          webEnv.WEBMAKER_PREVIEW_DOMAIN || "preview.localhost",
      },
    },
  ],
};
