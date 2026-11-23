const { jidNormalizedUser } = require("@whiskeysockets/baileys");

function getParticipantJid(participant) {
  
  return participant?.jid || participant?.id;
}

module.exports = {
  tags: ["group"],
  args: ["mensaje"],
  cmd: ["totag"],
  help: ["totag"],
  group: true,
  admin: false,
  botAdmin: false,
  exec: async (m, Moody, { prefix, cmd, args }) => {
    try {
      const metadata = await Moody.groupMetadata(m.chat);
      const participants = metadata?.participants || [];
      if (!participants.length) {
        return m.reply("*No pude obtener los participantes de este grupo.*");
      }

      const botJids = new Set(
        [Moody.user?.id, Moody.user?.lid, Moody.user?.jid]
          .filter(Boolean)
          .map((jid) => jidNormalizedUser(jid)),
      );
      const mentions = [
        ...new Set(
          participants
            .map((participant) => getParticipantJid(participant))
            .filter((jid) => jid && !botJids.has(jidNormalizedUser(jid))),
        ),
      ];

      if (!mentions.length) {
        return m.reply("*No hay participantes para etiquetar.*");
      }

      const note = args.join(" ").trim();
      const text = `*...*${note ? `\n\n${note}` : ""}\n\n> ${prefix + cmd} por ${m.pushName || "un administrador"}`;

      return await Moody.sendMessage(
        m.chat,
        { text, mentions },
        { quoted: m },
      );
    } catch (error) {
      console.error("[totag] No se pudo etiquetar al grupo:", error);
      return m.reply(
        "*No pude etiquetar a los participantes. Inténtalo de nuevo más tarde.*",
      );
    }
  },
};
