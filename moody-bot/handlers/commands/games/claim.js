const { groupManage, Users } = require("../../../db");
const MSG_CNG = require("../../../utils/config.json");
const { milesToComas, msToTimeRPG } = require("../../../utils/index");
const { checkRankUp, getRankData } = require("../../../utils/rank");

module.exports = {
  tags: ["games"],
  cmd: ["claim", "work"],
  help: ["claim"],
  exec: async (m, Moody, { prefix, cmd }) => {
    const user_info = await Users.get(m.sender);
    const group_db = await groupManage.get(m.chat);
    if (!m.isGroup) return m.reply(MSG_CNG.MSG.groupMsg);
    if (m.isGroup && !group_db.games)
      return m.reply("*🚩 Los minijuegos fueron desactivados en este grupo.*");
    const time = user_info.time || 0;
    if (new Date() - time < 300000) {
      m.reply(
        `*🌾 Ya chambiaste, vuelve en :* ${msToTimeRPG(300000 - (Date.now() - time))}`,
      );
      return;
    }
    Moody.sendMessage(
      m.chat,
      {
        text: `🌾Obtuviste *${MSG_CNG.BOT_CONFIG.MONEY_SYMBOL} ${milesToComas(2000)}* ${MSG_CNG.BOT_CONFIG.MONEY_NAME} y *${milesToComas(200)}* xp`,
      },
      { quoted: m },
    );
    const oldXp = Number(user_info.xp) || 0;
    const newXp = oldXp + 200;

    await Users.update(m.sender, {
      balance: (user_info.balance || 0) + 2000,
      xp: newXp,
      level: getRankData(newXp).level,
      time: new Date() * 1,
    });

    await checkRankUp(oldXp, newXp, m, Moody).catch((error) =>
      console.error("[claim] Error al comprobar el rango:", error.message),
    );
  },
};
