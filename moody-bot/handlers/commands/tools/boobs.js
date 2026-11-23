const fs = require("fs");
const path = require("path");
const { BOT_CONFIG } = require("../../../utils/config.json");

const imageDirectory = path.join(__dirname, "../../../media/boobs");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

module.exports = {
  tags: ["tools"],
  cmd: ["boobs", "tetas"],
  help: ["boobs"],
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
        return m.reply(
          "🚩 No hay imágenes en boobs.",
        );
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
      console.error("[boobs] No se pudo enviar una imagen local:", error);
      await m.reply(
        "🚩 No pude leer las imágenes de media/boobs. Revisa que la carpeta exista y que los archivos sean válidos.",
      );
    }
  },
};
