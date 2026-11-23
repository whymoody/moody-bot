module.exports = {
  tags: ["owner"],
  cmd: ["setppbot", "icon"],
  help: ["icon"],
  owner: true,
  exec: async (m, Moody, { prefix, cmd }) => {
    if (
      m.mtype == "imageMessage" ||
      (m.quoted && m.quoted.mtype == "imageMessage")
    ) {
      const ms = m.quoted ? m.quoted : m;
      const media = await Moody.downloadMediaMessage(ms);
      const botJid = Moody.user?.id;
      if (!botJid) {
        throw new Error("No se pudo identificar la cuenta de WhatsApp del bot.");
      }
      await Moody.updateProfile(botJid, media);
      return m.reply("*✅ Se actualizó la foto de perfil del bot.*");
    } else {
      return m.reply(
        "*🍟 Envía una imagen o responde a una imagen con el comando:* " + prefix + cmd,
      );
    }
  },
};
