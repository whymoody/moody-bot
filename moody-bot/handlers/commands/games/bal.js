
const { Users } = require("../../../db");
const { BOT_CONFIG, MSG } = require("../../../utils/config.json");
const { milesToComas } = require("../../../utils/index");

module.exports = {
  tags: ["games"],
  cmd: ["balance", "saldo", "bal"],
  args: ["@usuario"],
  help: ["balance"],
  exec: async (m, Moody) => {
    try {
      if (!m.isGroup) return m.reply(MSG.groupMsg);

      const targetJid = m.mentionedJid?.[0] || m.quoted?.sender;

      if (!targetJid) {
        return m.reply(
          "*Menciona a un usuario o responde a su mensaje para consultar su saldo.*"
        );
      }

      const user = await Users.get(targetJid);

      if (!user) {
        return m.reply(
          "*Ese usuario no está registrado en mi base de datos.*"
        );
      }

      const balance = Number(user.balance) || 0;
      const bank = Number(user.bank) || 0;
      const total = balance + bank;
      const name = await Moody.getName(targetJid);

      return Moody.sendMessage(
        m.chat,
        {
          text:
            `*SALDO DE ${name}*\n\n` +
            `*Dinero disponible:* ${BOT_CONFIG.MONEY_SYMBOL}${milesToComas(balance)}\n` +
            `*Dinero en el banco:* ${BOT_CONFIG.MONEY_SYMBOL}${milesToComas(bank)}\n` +
            `*Total:* ${BOT_CONFIG.MONEY_SYMBOL}${milesToComas(total)}`,
          mentions: [targetJid],
        },
        { quoted: m }
      );
    } catch (err) {
      return m.reply(new Error(err).message);
    }
  },
};
