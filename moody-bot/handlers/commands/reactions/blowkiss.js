const { Users } = require("../../../db");
const { fetchData, bufferUrl, gifToMp4 } = require("../../../utils/index");

module.exports = {
  tags: ["reactions"],
  cmd: ["blowkiss"],
  help: ["blowkiss"],
  group: true,
  exec: async (m, Moody) => {
    try {
      const who = m.quoted?.sender || m.mentionedJid?.[0] || m.sender;
      const user_info = await Users.get(who);
      const response = await fetchData("https://nekos.best/api/v2/blowkiss");
      const url = response?.results?.[0]?.url || response?.url;

      if (!url) {
        throw new Error("La API no devolvió un GIF para blowkiss.");
      }

      const buff = await bufferUrl(url);
      const video = await gifToMp4(buff);
      const targetName = user_info?.name || who.split("@")[0];

      await Moody.sendMessage(
        m.chat,
        {
          video,
          gifPlayback: true,
          caption:
            who !== m.sender
              ? `\`${m.pushName || "Alguien"}\` le dio un beso de aire a \`${targetName}\``
              : `\`${m.pushName || "Alguien"}\` se dio un beso de aire a sí mismo/a`,
          mentions: who !== m.sender ? [m.sender, who] : [m.sender],
        },
        { quoted: m },
      );
    } catch (error) {
      console.error("[BLOWKISS CMD ERROR]", error);
      await m.reply("No se pudo obtener o enviar el GIF de blowkiss. Inténtalo de nuevo más tarde.");
    }
  },
};
