const { wallpapers } = require("../../../utils/scraper");
const { BOT_CONFIG } = require("../../../utils/config.json");

module.exports = {
  tags: ["search"],
  args: ["query"],
  cmd: ["wallpaper"],
  help: ["wallpaper"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    if (args.length < 1) return m.reply(`*🚩 Ejemplo :* ${prefix + cmd} Lisa`);
    wallpapers(args.join(" "))
      .then((_res) => {
        let img = _res.data[Math.floor(Math.random() * _res.data.length)];
        Moody.sendMessage(
          m.chat,
          {
            image: { url: img.download },
            caption: `	╭  ✦ Wallpaper Search ✦  ╮\n
 *◦ Titulo :* ${img.title}
 *◦ Tipo :* ${img.type}
 *◦ Peso :* ${img.size}
 *◦ Dimension :* ${img.dimensions}
 *◦ Desc :* ${img.description.replace(", Original wallpaper dimensions is " + img.dimensions + ", file size is " + img.size, ".")}
 *◦ Enlace :* ${img.url}\n
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`,
          },
          { quoted: m },
        );
      })
      .catch((__error) => {
        m.reply(new Error(__error).message);
      });
  },
};
