const { Users } = require("../../../db");
const MSG_CNG = require("../../../utils/config.json");

module.exports = {
  tags: ["perfil"],
  cmd: ["reg", "verificar", "registrar"],
  help: ["registrar"],
  group: true,
  exec: async (m, Moody, { prefix, cmd }) => {
    const user_register = await Users.get(m.sender);
    if (user_register && user_register.register) return m.reply(`*🍟 Ya estas registrado en mi base de datos.*`);
    const user_profile = await Moody.profilePictureUrl(m.sender, "image").catch(() => "https://i.pinimg.com/736x/30/87/ea/3087ea34c649921256b433e523700190.jpg")
    const register_msgdls = `	╭  ✦ User Register ✦  ╮\n
 *◦ Nombre :* ${m.pushName || user_register.name}
 *◦ Fecha :* ${new Date().toLocaleDateString() || new Date(user_register.register_time).toLocaleDateString()}
 *◦ Hora :* ${new Date().toLocaleTimeString()}
 *◦ Registrado :* ${user_register.register ? "×" : "√"}\n
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${MSG_CNG.BOT_CONFIG.CREATOR_NAME} ©`
    Moody.sendMessage(m.chat, {document: {url: user_profile}, caption: register_msgdls, fileName: m.pushName || Date.now() + ".png", mimetype: "image/png", jpegThumbnail: await Moody.reSizeImg(user_profile, 250, 250)}, {quoted: m});
    await Users.update(m.sender, {
      register: true,
      register_time: new Date()
    });
  },
};
