const { jidNormalizedUser } = require("@whiskeysockets/baileys");
const { MSG } = require("../../../utils/config.json");

module.exports = {
  tags: ["group"],
  cmd: ["kick", "expulsar"],
  args: ["@usuario"],
  help: ["kick"],
  group: true,
  botAdmin: false,
  admin: true,
  exec: async (m, Moody) => {
    if (!m.isGroup) return m.reply(MSG.groupMsg);

    const target = m.mentionedJid?.[0] || m.quoted?.sender;
    if (!target) {
      return m.reply("*🚩 Menciona a la persona que quieres expulsar o responde a uno de sus mensajes.*");
    }

    const normalizedTarget = jidNormalizedUser(target);
    const botJids = new Set(
      [Moody.user?.id, Moody.user?.lid, Moody.user?.jid]
        .filter(Boolean)
        .map((jid) => jidNormalizedUser(jid)),
    );
    if (botJids.has(normalizedTarget)) {
      return m.reply("*🚩 No puedo expulsarme a mí mismo.*");
    }

    try {
      await Moody.groupParticipantsUpdate(m.chat, [target], "remove");
      return Moody.sendMessage(
        m.chat,
        {
          text: `*👢 Se expulsó a @${target.split("@")[0]} del grupo.*`,
          mentions: [target],
        },
        { quoted: m },
      );
    } catch (error) {
      console.error(
        "[kick] No se pudo expulsar al participante:",
        error.message || error,
      );
      return m.reply(
        "*🚩 No pude expulsar a esa persona. Verifica que el bot sea administrador y que el objetivo no sea administrador del grupo.*",
      );
    }
  },
};
