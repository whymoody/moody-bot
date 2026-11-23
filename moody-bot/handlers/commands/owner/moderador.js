const { BOT_CONFIG, owner: OWNERS } = require("../../../utils/config.json");
const moderators = require("../../../db/moderators");
const { messageJids, groupJids } = require("../../../utils/identity");

const ADD_WORDS = ["add", "agregar", "añadir", "anadir", "on"];
const DEL_WORDS = ["del", "delete", "remove", "quitar", "off"];
const LIST_WORDS = ["list", "lista"];

function normalize(jid) {
  return String(jid || "")
    .split("@")[0]
    .split(":")[0];
}

function isOwner(m) {
  const sender = normalize(m.sender || m.key?.participant || m.key?.remoteJid);
  if (!sender) return false;
  return (OWNERS || []).some((owner) => normalize(owner) === sender);
}

function getTarget(m) {
  return m.mentionedJid?.[0] || m.quoted?.sender || null;
}

async function targetJids(target, m, Moody) {
  const jids = messageJids(target, m);
  const extra = await groupJids(jids, m.chat, Moody);
  const found = [...new Set([...jids, ...extra])];

  const hasLid = found.some((jid) => String(jid).endsWith("@lid"));
  const phone = found.find((jid) =>
    String(jid).endsWith("@s.whatsapp.net"),
  );

  if (!hasLid && phone && typeof Moody?.onWhatsApp === "function") {
    try {
      const [info] = (await Moody.onWhatsApp(phone)) || [];
      if (info?.lid) found.push(info.lid);
    } catch (error) {
      console.warn("[moderador] No se pudo resolver el LID:", error.message);
    }
  }

  return [...new Set(found)];
}

function send(m, Moody, text, mentions = []) {
  return Moody.sendMessage(
    m.chat,
    mentions.length ? { text, mentions } : { text },
    { quoted: m },
  );
}

function helpText(prefix, cmd) {
  return (
    `╭  ✦ Moderadores ✦  ╮\n\n` +
    `*◦ Dar moderador:* ${prefix + cmd} add @usuario\n` +
    `*◦ Quitar moderador:* ${prefix + cmd} del @usuario\n` +
    `*◦ Ver moderadores:* ${prefix + cmd} list\n\n` +
    `> Los moderadores no heredan los permisos del owner · 🍟 ${BOT_CONFIG.BOT_NAME}`
  );
}

module.exports = {
  tags: ["owner"],
  args: ["add | del | list"],
  help: ["moderador"],
  cmd: ["moderador", "mod"],
  owner: true,
  exec: async (m, Moody, { prefix, cmd, args }) => {
    if (!isOwner(m)) {
      return send(m, Moody, "*Este comando solo puede ser usado por el owner.*");
    }

    const action = (args[0] || "").toLowerCase();
    const target = getTarget(m);

    try {
      if (ADD_WORDS.includes(action)) {
        if (!target) {
          return send(
            m,
            Moody,
            `*Menciona o responde al usuario.*\n*Ejemplo:* ${prefix + cmd} add @usuario`,
          );
        }
        const aliases = await targetJids(target, m, Moody);
        const jid = await moderators.add(target, m.sender, aliases);
        return send(m, Moody, `*Ahora @${normalize(jid)} es moderador.*`, [jid]);
      }

      if (DEL_WORDS.includes(action)) {
        if (!target) {
          return send(
            m,
            Moody,
            `*Menciona o responde al usuario.*\n*Ejemplo:* ${prefix + cmd} del @usuario`,
          );
        }
        const jid = `${moderators.normalize(target)}@s.whatsapp.net`;
        const removed = await moderators.remove(target);
        if (!removed) {
          return send(m, Moody, `*@${normalize(target)} no era moderador.*`, [jid]);
        }
        return send(m, Moody, `*@${normalize(target)} ya no es moderador.*`, [jid]);
      }

      if (LIST_WORDS.includes(action)) {
        const lista = await moderators.list();
        if (!lista.length) {
          return send(m, Moody, "*No hay moderadores registrados.*");
        }
        const body = lista
          .map((jid, index) => `*${index + 1}.* @${normalize(jid)}`)
          .join("\n");
        return send(m, Moody, `╭  ✦ Moderadores ✦  ╮\n\n${body}`, lista);
      }

      return send(m, Moody, helpText(prefix, cmd));
    } catch (error) {
      console.error("[moderador] Error:", error.message || error);
      return send(m, Moody, "*No pude procesar el comando ahora.*");
    }
  },
};
