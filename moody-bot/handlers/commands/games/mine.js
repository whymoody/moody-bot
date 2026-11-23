const { groupManage, Users } = require("../../../db");
const MSG_CNG = require("../../../utils/config.json");
const { msToTimeRPG } = require("../../../utils/index");

module.exports = {
  tags: ["games"],
  cmd: ["minar", "mine"],
  help: ["minar"],
  exec: async (m, Moody, { prefix, cmd }) => {
    const add_mine = Math.floor(Math.random() * 112);
    const add_gold = Math.floor(Math.random() * 213);
    const add_diamonds = Math.floor(Math.random() * 90);
    const add_money = Math.floor(Math.random() * 114);
    const user_info = await Users.get(m.sender);
    const group_db = await groupManage.get(m.chat);
    if (!m.isGroup) return m.reply(MSG_CNG.MSG.groupMsg);
    if (m.isGroup && !group_db.games)
      return m.reply("*🚩 Los minijuegos ha sido desactivado en este grupo.*");
    const time = user_info.mine_time || 0;
    if (new Date() - time < 300000) {
      m.reply(
        `*🌾 Ya minaste, vuelve a minar en :* ${msToTimeRPG(300000 - (Date.now() - time))}`,
      );
      return;
    }
    m.reply(`	╭  ✦ Mine Status ✦  ╮\n
 *◦ 🏴‍☠️ Mine :* ${add_mine}
 *◦ 🪙 Oro :* ${add_gold}
 *◦ 💎 Diamante :* ${add_diamonds}
 *◦ 💰 Dinero :* ${add_money}\n
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${MSG_CNG.BOT_CONFIG.CREATOR_NAME} ©`);
    Users.update(m.sender, {
      balance: (user_info.balance || 0) + add_money,
      mine: (user_info.mine || 0) + add_mine,
      gold: (user_info.gold || 0) + add_gold,
      diamonds: (user_info.diamonds || 0) + add_diamonds,
      mine_time: new Date() * 1,
    });
  },
};
