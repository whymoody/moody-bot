const fs = require("fs");
const path = require("path");
const { BOT_CONFIG } = require("../../../utils/config.json");

const imageDirectory = path.join(__dirname, "../../../media/penes");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

module.exports = {
  tags: ["tools"],
  cmd: ["penes", "pilin", "vrg", "pene"],
  help: ["pene"],
  exec: async (m, Moody) => {
    try {
      const images = fs
        .readdirSync(imageDirectory, { withFileTypes: true })
        .filter(
          (entry) =>
            entry.isFile() &&
            imageExtensions.has(path.extname(entry.name).toLowerCase()),
        )
        .map((entry) => path.join(imageDirectory, entry.name));

      if (images.length === 0) {
        return m.reply("No hay penes para ti.");
      }

      const image = images[Math.floor(Math.random() * images.length)];
      await Moody.sendMessage(
        m.chat,
        {
          image: fs.readFileSync(image),
          caption: `*Powered By ${BOT_CONFIG.BOT_NAME}*`,
          viewOnce: true,
        },
        { quoted: m },
      );
    } catch (error) {
      console.error("[penes] No se pudo enviar una imagen local:", error);
      await m.reply(
        "No pude encontrar penes. Revisa que la carpeta exista y que los archivos sean válidos.",
      );
    }
  },
};
