const { jidNormalizedUser } = require("@whiskeysockets/baileys");
const { MSG, BOT_CONFIG, owner: OWNERS } = require("../../../utils/config.json");

function normalize(jid) {
  return String(jid || "")
    .split("@")[0]
    .split(":")[0];
}

function isOwnerJid(jid) {
  const number = normalize(jid);
  if (!number) return false;
  return (OWNERS || []).some((owner) => normalize(owner) === number);
}

function getCallerJids(m) {
  return [
    m.sender,
    m.participant,
    m.key?.participant,
    m.key?.remoteJid,
    m.participantPn,
    m.senderPn,
    m.key?.participantPn,
    m.key?.senderPn,
  ].filter(Boolean);
}


function findParticipant(metadata, jid) {
  const target = normalize(jid);
  return (metadata.participants || []).find((p) => {
    return [p.id, p.lid, p.phoneNumber, p.pn, p.jid].some(
      (field) => field && normalize(field) === target
    );
  });
}

function isGroupAdmin(metadata, jid) {
  const participant = findParticipant(metadata, jid);
  return Boolean(
    participant &&
      (participant.admin === "admin" || participant.admin === "superadmin"),
  );
}

module.exports = {
  tags: ["group"],
  cmd: ["administrador", "addmin", "promote"],
  args: ["@usuario"],
  help: ["administrador"],
  group: true,
  exec: async (m, Moody, { prefix, cmd }) => {
    try {
      if (!m.isGroup) return m.reply(MSG.groupMsg);

      const metadata = await Moody.groupMetadata(m.chat).catch((error) => {
        console.error("[administrador] No se pudo leer el grupo:", error.message || error);
        return null;
      });

      const botJid = jidNormalizedUser(Moody.user?.id || "");
      const callerJids = getCallerJids(m);
      const caller = m.sender || m.participant || m.key?.participant || m.key?.remoteJid || "";
      const owner = callerJids.some(isOwnerJid);

      console.log(
        `[administrador] caller=${normalize(caller)} owner=${owner} bot=${normalize(botJid)} metadata=${Boolean(metadata)}`,
      );

      const callerIsAdmin =
        metadata && callerJids.some((jid) => isGroupAdmin(metadata, jid));

      if (!owner && !callerIsAdmin) {
        return m.reply(
          "*🚩 Solo un administrador del grupo o el owner puede usar este comando.*",
        );
      }

      const mentioned = m.mentionedJid?.[0] || m.quoted?.sender;
      const autoAdmin = !mentioned;
      
      
      let target;
      const targetRaw = mentioned || caller;
      if (targetRaw.includes("@lid")) {
        target = targetRaw.split(":")[0];
      } else if (targetRaw.includes("@s.whatsapp.net")) {
        target = targetRaw.split(":")[0];
      } else {
        target = `${normalize(targetRaw)}@s.whatsapp.net`;
      }

      console.log(
        `[administrador] target=${normalize(target)} autoadmin=${autoAdmin} tipo=${target.includes('@lid') ? 'LID' : 'Número'}`,
      );

      if (!target) {
        return m.reply("*🚩 No pude identificar a quién dar administrador.*");
      }

      if (normalize(target) === normalize(botJid)) {
        return m.reply("*🚩 No puedo darme administrador a mí mismo.*");
      }

      if (metadata && isGroupAdmin(metadata, target)) {
        return Moody.sendMessage(
          m.chat,
          {
            text: `*🚩 @${normalize(target)} ya es administrador.*`,
            mentions: [target],
          },
          { quoted: m },
        );
      }

      
      if (metadata && !isGroupAdmin(metadata, botJid)) {
      
        const botLid = Moody.user?.lid ? Moody.user.lid.split(":")[0] : null;
        if (!botLid || !isGroupAdmin(metadata, botLid)) {
          return m.reply(
            "*🚩 Necesito ser administrador del grupo para dar administrador.*\n*◦ Solución:* pídele a un administrador que me promueva y vuelve a intentarlo.",
          );
        }
      }

      await Moody.groupParticipantsUpdate(m.chat, [target], "promote");

      return Moody.sendMessage(
        m.chat,
        {
          text:
            `╭  ✦ Administrador ✦  ╮\n\n` +
            `*◦ Usuario:* @${normalize(target)}\n` +
            `*◦ Acción:* ${
              autoAdmin ? "se dio administrador" : "ahora es administrador"
            }\n\n` +
            `> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`,
          mentions: [target],
        },
        { quoted: m },
      );
    } catch (error) {
      console.error("[administrador] Error:", error.message || error);
      const detail = isOwnerJid(m.sender || "")
        ? `\n\n> Error: ${error.message || error}`
        : "";
      return m.reply(
        `*🚩 No pude dar administrador. Asegúrate de que el bot sea administrador del grupo.*${detail}`,
      );
    }
  },
};