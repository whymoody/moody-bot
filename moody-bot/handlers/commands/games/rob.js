const { groupManage, Users } = require("../../../db");
const { BOT_CONFIG, MSG } = require("../../../utils/config.json");
const { milesToComas } = require("../../../utils/index");

module.exports = {
  tags: ["games"],
  cmd: ["robar", "rob"],
  args: ["@usuario"],
  help: ["robar"],
  exec: async (m, Moody) => {
    if (!m.isGroup) return m.reply(MSG.groupMsg);

    const group = await groupManage.get(m.chat);
    if (!group?.games) {
      return m.reply("*Los minijuegos están desactivados en este grupo.*");
    }

    const targetJid = m.quoted?.sender || m.mentionedJid?.[0];
    if (!targetJid) {
      return m.reply("*Menciona o responde al mensaje de la persona a quien quieres robar.*");
    }
    if (targetJid === m.sender) {
      return m.reply("*No puedes robarte a ti mismo.*");
    }

    const robber = await Users.get(m.sender);
    const target = await Users.get(targetJid);
    if (!robber) {
      return m.reply("*No estás registrado en mi base de datos.*");
    }
    if (!target) {
      return m.reply("*Esa persona no está registrada en mi base de datos.*");
    }

    const targetBalance = Math.max(0, Number(target.balance) || 0);
    if (targetBalance < 1) {
      return m.reply("*Esa persona es demasiado pobre para ser robada.*");
    }

    const percentage = Math.floor(Math.random() * 21) + 10;
    const amount = Math.max(1, Math.floor((targetBalance * percentage) / 100));
    await Users.update(targetJid, { balance: targetBalance - amount });
    await Users.update(m.sender, {
      balance: (Number(robber.balance) || 0) + amount,
    });

    return Moody.sendMessage(
      m.chat,
      {
        text: `*Robo realizado*\nLe robaste *${BOT_CONFIG.MONEY_SYMBOL}${milesToComas(amount)}* ${BOT_CONFIG.MONEY_NAME} a *${await Moody.getName(targetJid)}*.\n\n*Tu saldo:* ${BOT_CONFIG.MONEY_SYMBOL}${milesToComas((Number(robber.balance) || 0) + amount)}`,
        mentions: [targetJid],
      },
      { quoted: m },
    );
  },
};
