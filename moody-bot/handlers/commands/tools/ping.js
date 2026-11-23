const { humanFileSize } = require("../../../utils");
const config = require("../../../utils/config.json");
const { info } = require("../../../db");

const runtime = (seconds) => {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600 * 24));
  var h = Math.floor((seconds % (3600 * 24)) / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = Math.floor(seconds % 60);
  var dDisplay = d > 0 ? d + (d == 1 ? " día, " : " días, ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? " hora, " : " horas, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minuto, " : " minutos, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " segundo" : " segundos") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
};

module.exports = {
  tags: ["tools"],
  cmd: ["ping", "stat"],
  help: ["ping"],
  exec: async (m, client) => {
    
    const start = Date.now(); 
    
    try {
      
      let { stats } = await info("stats");
      stats = stats || {}; 

      
      const formatNum = (num) => Number(num || 0).toLocaleString("en-US");

      const txt = `	╭  ✦ Bot Stats ✦  ╮\n
 *◦ Media enviada :* ${humanFileSize(stats.filesize, true) || "0 kbps"}
 *◦ Msg recibidos :* ${formatNum(stats.msgRecv)}
 *◦ Msg enviados :* ${formatNum(stats.msgSent)}
 *◦ Commands hit :* ${formatNum(stats.cmd)}
 *◦ Autodescargas :* ${formatNum(stats.autodownload)}
 *◦ Stickers creados :* ${formatNum(stats.sticker)}
 *◦ Runtime :* ${runtime(process.uptime())}\n
	╭  ✦ System Status ✦  ╮\n
 *◦ Autotyping :* ${config.composing ? "[ √ ]" : "[ × ]"}
 *◦ Autoread :* ${config.autoRead ? "[ √ ]" : "[ × ]"}
 *◦ OnlyOwner :* ${config.onlyowner ? "[ √ ]" : "[ × ]"}
 *◦ Autopost :* ${config.autoPost ? "[ √ ]" : "[ × ]"}
 *◦ Latencia :* ${Date.now() - start} ms
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${config.BOT_CONFIG.CREATOR_NAME} ©`;

      await client.sendMessage(
        m.chat,
        {
          text: txt,
          linkPreview: false,
        },
        { quoted: m }
      );
      
    } catch (error) {
      console.error("[PING ERROR]", error);
      await client.sendMessage(m.chat, { text: "Hubo un error al obtener las estadísticas del bot." }, { quoted: m });
    }
  },
};