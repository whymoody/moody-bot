const { BOT_CONFIG } = require("../../../utils/config.json");
const { Users } = require("../../../db");
const { ConvertMiles } = require("../../../utils/index");

module.exports = {
  cmd: ["inventario", "inv"],
  help: ["inventario"],
  tags: ["games"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    const who = m.quoted
      ? m.quoted.sender
      : m.mentionedJid && m.mentionedJid[0]
        ? m.mentionedJid[0]
        : m.sender;
    const userr = await Users.get(who);
    const perfil = await Moody.profilePictureUrl(who, "image").catch(
      (_) => "https://telegra.ph/file/288dfd6336e8854cf144b.jpg",
    );
    const nameee = await Moody.getName(who);
    let invMsg = `	╭  ✦ User Info ✦  ╮

 *◦ Nombre :* ${nameee || "-"}
 *◦ Balance :* ${ConvertMiles(userr.balance) || 0}

	╭  ✦ Inventario ✦  ╮

 *◦ 🐟 Peces :* ${ConvertMiles(userr.fish) || 0}
 *◦ 🦐 Calamar:* ${ConvertMiles(userr.squid) || 0}
 *◦ 🦪 Marucha :* ${ConvertMiles(userr.marucha) || 0}
 *◦ 🪙 Oro :* ${ConvertMiles(userr.gold) || 0}
 *◦ 💎 Diamante:* ${ConvertMiles(userr.diamonds) || 0}
 *◦ 🏴‍☠️ Mine :* ${ConvertMiles(userr.mine) || 0}
 *◦ 🍎 Manzana :* ${ConvertMiles(userr.apple) || 0}
 *◦ 🍊 Naranja :* ${ConvertMiles(userr.orange) || 0}
 *◦ 🍋 Limon :* ${ConvertMiles(userr.lemon) || 0}
 *◦ 🌲 Pinos :* ${ConvertMiles(userr.pines) || 0}
 *◦ 🌴 Palmeras :* ${ConvertMiles(userr.palm) || 0}
 *◦ 🌳 Arboles :* ${ConvertMiles(userr.three) || 0}\n
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`;
    Moody.sendMessage(
      m.chat,
      { image: { url: perfil }, caption: invMsg, mentions: [who] },
      { quoted: m, messageId: await Moody.generateMessageIDV2(who) },
    );
  },
};
