const { Users } = require("../../../db");
const { resolveIdentity } = require("../../../utils/identity");
const { fetchAbout } = require("../../../utils/whatsapp");

module.exports = {
  tags: ["tools"],
  cmd: ["getdesc", "getbio", "desc", "bio"],
  help: ["getdesc"],
  args: ["@usuario o responder a un mensaje"],
  exec: async (m, Moody, { args } = {}) => {
    try {
      let who =
        m.quoted?.sender ||
        m.mentionedJid?.[0] ||
        null;

      if (!who && args?.[0]) {
        const num = String(args[0]).replace(/\D/g, "");
        if (num.length >= 8) who = `${num}@s.whatsapp.net`;
      }

      if (!who) who = m.sender;

      const user = await Users.get(who);

      
      const stored = String(user?.bio || "").trim();
      let desc = stored;

      if (!desc) {
        const { jids: ids } = await resolveIdentity(who, m, Moody)
          .catch(() => ({ jids: [who] }));
        const phone = ids.find(
          (jid) => jid.endsWith("@s.whatsapp.net") || jid.endsWith("@c.us"),
        );
        const { about } = await fetchAbout(Moody, [phone, who]);
        desc = about;
      }

      
      if (!desc) {
        return m.reply("Sin descripción.");
      }

      await Moody.sendMessage(
        m.chat,
        { text: String(desc).trim() },
        { quoted: m },
      );

    } catch (error) {
      console.error("[GETDESC ERROR]", error);
      m.reply("Ocurrió un error al intentar obtener la descripción.");
    }
  },
};