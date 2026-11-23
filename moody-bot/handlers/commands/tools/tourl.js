const { UploadQuax, humanFileSize } = require("../../../utils/index");
const { BOT_CONFIG } = require("../../../utils/config.json");

module.exports = {
  tags: ["tools"],
  args: ["reply media"],
  cmd: ["tourl", "quax"],
  help: ["tourl"],
  exec: async (m, Moody, { prefix, flags, cmd, arg, body, url }) => {
    if (
      ["imageMessage", "videoMessage", "stickerMessage"].includes(m.mtype) ||
      (m.quoted && ["imageMessage", "videoMessage", "stickerMessage"].includes(m.quoted.mtype))
    ) {
      const ms = m.quoted ? m.quoted : m;
      let media = await Moody.downloadMediaMessage(ms);
      const urll = await UploadQuax(media);
      m.reply(`    ╭  ✦ Quax Upload ✦  ╮

 *◦ Id :* ${urll.url.split("/")[3] || "-"}
 *◦ Tamaño :* ${humanFileSize(urll.size, true, 2)}
 *◦ Extension :* .${urll.url.split('.')[2]}
 *◦ Expiración :* ${urll.expiry === "permanent" ? "Permanente" : urll.expiry}
 *◦ Enlace :* ${urll.url}

> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`)
    } else {
      m.reply(
        "*🍟 Envia o responde a una imagen, video o sticker con el comando :* " +
          prefix +
          cmd
      );
    }
  },
};
