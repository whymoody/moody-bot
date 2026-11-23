const { jidNormalizedUser } = require("@whiskeysockets/baileys");
const { MSG, BOT_CONFIG, owner: OWNERS } = require("../../../utils/config.json");
const moderators = require("../../../db/moderators");

const DEATH_DELAY_MS = 40000;
const RESCUE_WORD = "kira";

const sentences = new Map();

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

async function canUse(m) {
  if (isOwnerJid(m.sender)) return true;
  return moderators.isModerator(m.sender).catch(() => false);
}

function sentenceKey(chat, target) {
  return `${chat}|${normalize(target)}`;
}

function scheduleSentence({ chat, target, Moody }) {
  const key = sentenceKey(chat, target);
  const previous = sentences.get(key);
  if (previous) clearTimeout(previous.timer);

  const timer = setTimeout(async () => {
    sentences.delete(key);
    try {
      await Moody.groupParticipantsUpdate(chat, [target], "remove");
      await Moody.sendMessage(chat, {
        text:
          `╭  ✦ Death Note ✦  ╮\n\n` +
          `*◦ Nombre escrito:* @${normalize(target)}\n` +
          `*◦ Causa:* se murio de un paro cardíaco\n\n` +
          `_El cuaderno ha hecho su trabajo._\n\n` +
          `> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`,
        mentions: [target],
      });
    } catch (error) {
      console.error(
        "[deathnote] No se pudo eliminar al participante:",
        error.message || error,
      );
      await Moody.sendMessage(chat, {
        text: "*🚩 El cuaderno no tuvo efecto. Verifica que el bot sea administrador y que el objetivo no sea administrador del grupo.*",
      });
    }
  }, DEATH_DELAY_MS);

  sentences.set(key, { target, timer });
}

async function handleKiraReply(m, Moody) {
  const key = sentenceKey(m.chat, m.sender);
  const sentence = sentences.get(key);
  if (!sentence) return false;

  clearTimeout(sentence.timer);
  sentences.delete(key);

  await Moody.sendMessage(
    m.chat,
    {
      text:
        `╭  ✦ Death Note ✦  ╮\n\n` +
        `*◦ Nombre escrito:* @${normalize(sentence.target)}\n` +
        `*◦ Estado:* salvado por Kira\n\n` +
        `_El cuaderno ha sido engañado... por ahora._`,
      mentions: [sentence.target],
    },
    { quoted: m },
  );
  return true;
}

function isRescueWord(body) {
  return String(body || "").trim().toLowerCase() === RESCUE_WORD;
}

module.exports = {
  tags: ["group"],
  cmd: ["dn", "deathnote"],
  args: ["@usuario"],
  help: ["deathnote"],
  group: true,
  exec: async (m, Moody, { prefix, cmd }) => {
    if (!m.isGroup) return m.reply(MSG.groupMsg);

    if (!(await canUse(m))) {
      return m.reply(
        "*Solo el owner o un moderador puede usar la Death Note.*",
      );
    }

    const target = m.mentionedJid?.[0] || m.quoted?.sender;
    if (!target) {
      return m.reply(
        `*Escribe el nombre de la persona.*\n*Ejemplo:* ${prefix + cmd} @usuario`,
      );
    }

    const normalizedTarget = jidNormalizedUser(target);
    const botJid = jidNormalizedUser(Moody.user?.id || "");
    const senderJid = jidNormalizedUser(m.sender || "");

    if (normalizedTarget === botJid) {
      return m.reply("*🚩 El cuaderno no funciona conmigo.*");
    }
    if (normalizedTarget === senderJid) {
      return m.reply("*🚩 Escribir tu propio nombre no está permitido.*");
    }
    if (isOwnerJid(normalizedTarget)) {
      return m.reply("*🚩 El nombre del owner no se puede escribir.*");
    }
    if (await moderators.isModerator(normalizedTarget).catch(() => false)) {
      return m.reply("*🚩 El nombre de un moderador no se puede escribir.*");
    }

    try {
      await Moody.sendMessage(
        m.chat,
        {
          text:
            `╭  ✦ Death Note ✦  ╮\n\n` +
            `*◦ Nombre escrito:* @${normalize(normalizedTarget)}\n` +
            `*◦ Tiempo restante:* ${DEATH_DELAY_MS / 1000} segundos\n\n` +
            `_Tu destino esta escrito..._\n\n` +
            `> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`,
          mentions: [normalizedTarget],
        },
        { quoted: m },
      );
    } catch (error) {
      console.error(
        "[deathnote] No se pudo enviar el aviso:",
        error.message || error,
      );
    }

    scheduleSentence({ chat: m.chat, target: normalizedTarget, Moody });
    return;
  },
  handleKiraReply,
  isRescueWord,
};
