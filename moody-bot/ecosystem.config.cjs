const path = require("path");

// Asegura que el bot (incluso bajo PM2) encuentre los ejecutables de Python
// como yt-dlp, gallery-dl y spotdl instalados en el venv del proyecto.
const venvScripts = path.join(__dirname, "..", ".venv", "Scripts");
const PATH = [venvScripts, process.env.PATH].filter(Boolean).join(path.delimiter);

module.exports = {
  apps: [
    {
      name: "moody-bot",
      script: "index.js",
      cwd: __dirname,
      autorestart: true,
      restart_delay: 5000,
      watch: false,
      time: true,
      env: {
        NODE_ENV: "production",
        PATH,
      },
    },
  ],
};
