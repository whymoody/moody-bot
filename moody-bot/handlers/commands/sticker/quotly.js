const axios = require('axios');
const sharp = require('sharp');
const { Quotly } = require('quotly-api-qc');

const quotlyClient = new Quotly();

function cleanWhatsAppText(text) {
  if (!text) return "";
  return text
    .replace(/[*_~`]/g, "")
    .replace(/^>\s?/gm, "")
    .replace(/@\d+/g, "")
    .trim();
}

module.exports = {
  tags: ["sticker"],
  cmd: ["quotly"],
  help: ["quotly"],
  args: ["texto o responder a un mensaje"],
  exec: async (m, client, { prefix, cmd, args = [] }) => {
    const text = args.join(" ").trim();
    const quoted = !text && m.quoted;

    if (!text && !quoted) {
      return m.reply(`° Ejemplo : ${prefix + cmd} Hola`);
    }

    try {
      let rawText = text || String(m.quoted?.text || m.quoted?.caption || m.quoted?.msg?.text || "").trim();
      const quoteText = cleanWhatsAppText(rawText);

      if (!quoteText) return m.reply("El mensaje no contiene texto válido.");

      const sender = quoted ? m.quoted.sender : m.sender;
      let authorName = quoted ? (m.quoted.pushName || "Usuario") : (m.pushName || "Usuario");
      let avatarBuffer;
      try {
        const avatarUrl = await client.profilePictureUrl(sender, 'image');
        if (avatarUrl) {
          const response = await axios.get(avatarUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
          });
          avatarBuffer = Buffer.from(response.data);
        }
      } catch (error) {
        console.warn("[QUOTLY AVATAR]", error.message);
      }

      const generated = await quotlyClient.generate({
        type: 'quote',
        format: 'png',
        backgroundColor: '#ffffff',
        width: 512,
        scale: 2,
        messages: [
          {
            avatar: !avatarBuffer,
            from: {
              id: 1,
              name: authorName
            },
            text: quoteText
          }
        ]
      });

      const imageData = generated?.result?.image;
      if (typeof imageData !== 'string' || !imageData) {
        throw new Error('El generador no devolvió la imagen del quote.');
      }

      let imageBuffer = Buffer.from(
        imageData.replace(/^data:image\/[^;]+;base64,/, ''),
        'base64'
      );
      if (!imageBuffer.length) {
        throw new Error('La imagen generada está vacía.');
      }

      if (avatarBuffer) {
        const { height } = await sharp(imageBuffer).metadata();
        const { data, info } = await sharp(imageBuffer)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        let cardTop = height;
        let cardBottom = -1;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < info.width; x++) {
            const index = (y * info.width + x) * info.channels;
            if (
              data[index + 3] > 240 &&
              data[index] > 245 &&
              data[index + 1] > 245 &&
              data[index + 2] > 245
            ) {
              cardTop = Math.min(cardTop, y);
              cardBottom = Math.max(cardBottom, y);
            }
          }
        }
        if (cardBottom < cardTop) {
          throw new Error('No se pudo determinar la posición de la tarjeta del quote.');
        }

        const cardHeight = cardBottom - cardTop + 1;
        const avatarSize = Math.min(Math.round(height * 0.25), Math.round(cardHeight * 0.55));
        const avatarTop = Math.round((cardTop + cardBottom - avatarSize) / 2);
        const avatarMask = Buffer.from(
          `<svg width="${avatarSize}" height="${avatarSize}" xmlns="http://www.w3.org/2000/svg"><circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${avatarSize / 2}" fill="white"/></svg>`
        );
        const roundedAvatar = await sharp(avatarBuffer)
          .resize(avatarSize, avatarSize, { fit: 'cover' })
          .composite([{ input: avatarMask, blend: 'dest-in' }])
          .png()
          .toBuffer();

        imageBuffer = await sharp(imageBuffer)
          .composite([{
            input: roundedAvatar,
            left: 0,
            top: Math.max(0, Math.min(avatarTop, height - avatarSize))
          }])
          .png()
          .toBuffer();
      }

      const stickerBuffer = await sharp(imageBuffer)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 90 })
        .toBuffer();

      await client.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });

    } catch (error) {
      console.error("[QUOTLY ERROR]", error.response ? error.response.data : error.message);
      await m.reply(`Error al generar: Revisa la consola.`);
    }
  },
};