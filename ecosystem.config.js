module.exports = {
  apps: [
    {
      name: "dreamer-web",
      cwd: "/home/ubuntu/dreamer/apps/web",
      script: "node_modules/.bin/next",
      args: "start",
      env: {
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
        WEBMAKER_PREVIEW_DOMAIN: "preview.localhost",
      },
    },
  ],
};
