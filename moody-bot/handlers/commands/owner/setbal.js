
const { Users } = require("../../../db");
const { BOT_CONFIG, MSG, owner: OWNERS } = require("../../../utils/config.json");
const { milesToComas } = require("../../../utils/index");

function normalize(jid = "") {
  return String(jid)
    .split("@")[0]
    .split(":")[0]
    .replace(/\D/g, "");
}

function normalizeJid(jid = "") {
  return String(jid).trim().replace(/:\d+@/, "@");
}

function isOwner(m) {
  const callers = [
    m.sender,
    m.participant,
    m.key?.participant,
  ].filter(Boolean);

  return callers.some((jid) =>
    (OWNERS || []).some((owner) => normalize(owner) === normalize(jid))
  );
}

module.exports = {
  tags: ["owner"],
  cmd: ["setbalance", "setbal"],
  args: ["@usuario", "cantidad"],
  help: ["setbalance"],
  exec: async (m, Moody, { args = [] } = {}) => {
    try {
      if (!isOwner(m)) {
        return m.reply("*Este comando solo puede utilizarlo el owner.*");
      }

      if (!m.isGroup) return m.reply(MSG.groupMsg);

      const targetJid = normalizeJid(
        m.mentionedJid?.[0] ||
        m.quoted?.sender ||
        m.quoted?.key?.participant
      );

      if (!targetJid) {
        return m.reply(
          "*Menciona al usuario o responde a su mensaje.*"
        );
      }

      const amountText = args
        .filter(arg => !arg.includes("@"))
        .join("");

      if (!/^\d+$/.test(amountText)) {
        return m.reply(
          "*Ingresa una cantidad válida.*\n\n*Ejemplo:* .setbalance @usuario 50000"
        );
      }

      const amount = Number(amountText);

      if (!Number.isSafeInteger(amount)) {
        return m.reply("*La cantidad ingresada es demasiado grande.*");
      }

      const user = await Users.get(targetJid);

      if (!user) {
        return m.reply(
          "*Ese usuario no está registrado en mi base de datos.*"
        );
      }

      await Users.update(targetJid, {
        balance: amount,
      });

      const name = await Moody.getName(targetJid);

      return Moody.sendMessage(
        m.chat,
        {
          text:
            `*SALDO MODIFICADO*\n\n` +
            `*Usuario:* ${name}\n` +
            `*Nuevo saldo:* ${BOT_CONFIG.MONEY_SYMBOL}${milesToComas(amount)}\n\n` +
            `El dinero guardado en el banco no fue modificado.`,
          mentions: [targetJid],
        },
        { quoted: m }
      );
    } catch (err) {
      return m.reply(new Error(err).message);
    }
  },
};
