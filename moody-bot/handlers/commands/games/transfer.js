const { groupManage, Users } = require("../../../db");
const MSG_CNG = require("../../../utils/config.json");
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

module.exports = {
  tags: ["games"],
  cmd: ["transfer", "transferir"],
  args: ["@user", "monto"],
  help: ["transferir"],
  exec: async (m, Moody, { prefix, cmd, args = [] } = {}) => {
    if (!m.isGroup) return m.reply(MSG_CNG.MSG.groupMsg);
    const group_db = await groupManage.get(m.chat);
    if (!group_db?.games)
      return m.reply(
        "*Los minijuegos han sido desactivados en este grupo.*",
      );
    const user_info = await Users.get(m.sender);
    if (typeof user_info.balance !== "number")
      return m.reply("*No estás registrado en mi base de datos.*");
    const who = normalizeJid(
      m.mentionedJid?.[0] ||
      m.quoted?.sender ||
      m.quoted?.key?.participant ||
      "",
    );
    if (!who)
      return m.reply(
        `*Debes mencionar al usuario al que deseas transferir ${MSG_CNG.BOT_CONFIG.MONEY_NAME}.*`,
      );
    if (normalize(who) === normalize(m.sender))
      return m.reply("*🚩 No puedes transferirte dinero a ti mismo.*");
    const user_transfer = await Users.get(who);
    if (typeof user_transfer.balance !== "number")
      return m.reply(
        `*El usuario ${await Moody.getName(who)} no está registrado en mi base de datos.*`,
      );
    const amount = Number(
      args.filter((arg) => !String(arg).includes("@")).join(""),
    );
    if (!Number.isSafeInteger(amount) || amount <= 0)
      return m.reply(
        `*Ingresa un monto válido para transferir.* Ejemplo: ${prefix}${cmd} @user 100`,
      );
    if (user_info.balance < amount)
      return m.reply(
        `Eres demasiado pobre para transferir, saldo actual es *${MSG_CNG.BOT_CONFIG.MONEY_SYMBOL}${milesToComas(user_info.balance)}*`,
      );
    await Users.update(m.sender, {
      balance: (user_info.balance || 0) - amount,
    });
    await Users.update(who, { balance: (user_transfer.balance || 0) + amount });
    Moody.sendMessage(
      m.chat,
      {
        text: `Has transferido *${MSG_CNG.BOT_CONFIG.MONEY_SYMBOL}${milesToComas(amount)}* ${MSG_CNG.BOT_CONFIG.MONEY_NAME} a *${await Moody.getName(who)}*.\n\nTu nuevo saldo es *${MSG_CNG.BOT_CONFIG.MONEY_SYMBOL}${milesToComas(user_info.balance - amount)}* ${MSG_CNG.BOT_CONFIG.MONEY_NAME}.`,
      },
      { quoted: m },
    );
  },
};
