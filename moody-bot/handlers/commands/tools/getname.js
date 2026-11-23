const { Users } = require("../../../db");
const { resolveIdentity } = require("../../../utils/identity");

const INVALID_NAMES = ["no disponible", "desconocido", "undefined", "null"];

function isValidName(name) {
  const value = String(name || "").trim();
  if (!value || INVALID_NAMES.includes(value.toLowerCase())) return false;
  return !value.endsWith("@lid") && !value.endsWith("@s.whatsapp.net");
}

module.exports = {
  tags: ["perfil"],
  cmd: ["getname", "getnombre", "name"],
  help: ["getname"],
  args: ["@usuario, responder a un mensaje o número"],
  exec: async (m, Moody, { args } = {}) => {
    try {
      let who = m.quoted?.sender || m.mentionedJid?.[0] || null;

      if (!who && args?.[0]) {
        const num = String(args[0]).replace(/\D/g, "");
        if (num.length >= 8) who = `${num}@s.whatsapp.net`;
      }

      if (!who) who = m.sender;

      const isSelf = who === m.sender;
      const { jids: ids, participant } = await resolveIdentity(who, m, Moody)
        .catch(() => ({ jids: [who], participant: null }));

      let displayName = isSelf ? String(m.pushName || "").trim() : "";

      if (!isValidName(displayName)) {
        const whatsappName = [
          participant?.notify,
          participant?.name,
          participant?.verifiedName,
        ].find(isValidName);

        if (whatsappName) displayName = whatsappName;
      }

      if (!isValidName(displayName)) {
        for (const jid of ids) {
          const name = await Moody.getName(jid).catch(() => null);
          if (isValidName(name)) {
            displayName = name;
            break;
          }
        }
      }

      if (!isValidName(displayName)) {
        for (const jid of ids) {
          const user = await Users.get(jid);
          if (isValidName(user?.name)) {
            displayName = user.name;
            break;
          }
        }
      }

      if (!isValidName(displayName)) {
        displayName = who.split("@")[0];
      }

      const nameText = String(displayName).trim();

      await Moody.sendMessage(m.chat, { text: nameText }, { quoted: m });

    } catch (error) {
      console.error("[GETNAME ERROR]", error);
      m.reply("Ocurrió un error al intentar obtener el nombre.");
    }
  },
};