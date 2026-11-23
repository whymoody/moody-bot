const { UploadBuffer } = require("../../../utils/index");
const { default: axios } = require("axios");
const { BASE_URL, BOT_CONFIG } = require("../../../utils/config.json");

module.exports = {
  tags: ["tools"],
  args: ["reply media"],
  cmd: ["totelegram", "telegram"],
  help: ["telegram"],
  exec: async (m, Moody, { prefix, flags, cmd, arg, body, url }) => {
    if (
      m.mtype == "imageMessage" ||
      (m.quoted && m.quoted.mtype == "imageMessage")
    ) {
      const ms = m.quoted ? m.quoted : m;
      let media = await Moody.downloadMediaMessage(ms);
      const urll = await UploadBuffer(media);
      axios
        .get(BASE_URL + "/tools/telegramorg", {
          params: { url: urll, filename: m.pushName },
        })
        .then((ress) => {
          m.reply(`*亗 T E L E G R A M*\n
*› Filename :* ${ress.data.data.filename || "-"}
*› Size :* ${ress.data.data.size || "-"}
*› File Id :* ${ress.data.data.file_id || "-"}
*› Url :* ${ress.data.data.url || "-"}\n
*🍟 Powered By ${BOT_CONFIG.BOT_NAME}.*`);
        })
        .catch((errr) => {
          m.reply("*🍟 Error al subir el archivo.*");
        });
    } else {
      m.reply(
        "*🍟 Envia o responde a una imagen con el comando :* " + prefix + cmd,
      );
    }
  },
};
