require("undici").install();

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

module.exports = {
  tags: ["tools"],
  cmd: ["fresa", "strawberry"],
  help: ["fresa"],
  exec: async (m, sock) => {
    const jid = m.chat || m.key.remoteJid;
    const isQuotedImage =
      m.quoted?.mtype === "imageMessage" ||
      Boolean(m.quoted?.message?.imageMessage);
    const isCurrentImage =
      m.mtype === "imageMessage" || Boolean(m.message?.imageMessage);
    const targetMessage = isQuotedImage
      ? m.quoted
      : isCurrentImage
        ? m
        : null;

    if (!targetMessage) {
      return m.reply("Debes enviar una foto o responder a una foto para ponerle la cara en la fresa.\n\n*Ejemplo:* Responde a una imagen y escribe `.fresa`");
    }

    try {
      const strawberryPath = path.resolve(__dirname, "../../../media/face/fresa.jpeg");
      
      if (!fs.existsSync(strawberryPath)) {
        return m.reply("No se encontró la imagen de la fresa en: media/face/fresa.jpeg");
      }

      const userImageBuffer = await sock.downloadMediaMessage(targetMessage);

      
      const avatarSize = 345;
      
      const roundedAvatar = await sharp(userImageBuffer)
        .resize(avatarSize, avatarSize, { 
            fit: 'cover', 
            position: sharp.strategy.attention 
        })
        .composite([{
          input: Buffer.from(`<svg><circle cx="${avatarSize/2}" cy="${avatarSize/2}" r="${avatarSize/2}" /></svg>`),
          blend: 'dest-in'
        }])
        .png()
        .toBuffer();

      
      const finalImage = await sharp(strawberryPath)
        .composite([{
          input: roundedAvatar,
          top: 280,
          left: 140
        }])
        .webp() 
        .toBuffer();

      await sock.sendMessage(jid, { 
        sticker: finalImage 
      }, { quoted: m });

    } catch (error) {
      console.error("[STRAWBERRY ERROR]", error);
      m.reply("Ocurrió un error al intentar crear la fresa. Asegúrate de que la imagen sea válida.");
    }
  },
};