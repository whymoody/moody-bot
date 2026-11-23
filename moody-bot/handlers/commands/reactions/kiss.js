const { groupManage, Users } = require("../../../db");
const { fetchData, bufferUrl, gifToMp4 } = require("../../../utils/index");

module.exports = {
  tags: ["reactions"],
  cmd: ["kiss"],
  help: ["kiss"],
  group: true,
  exec: async (m, Moody, { prefix, cmd }) => {
    
    const who = m.quoted
      ? m.quoted.sender
      : m.mentionedJid && m.mentionedJid[0]
        ? m.mentionedJid[0]
        : m.sender;
        
    const user_info = await Users.get(who);
    const group_db = await groupManage.get(m.chat);

    
    if (m.isGroup && group_db.anime === false) 
      return m.reply("*🚩 Los comandos de anime están desactivados en este grupo.*");

    try {
      
      const res = await fetchData("https://nekos.best/api/v2/kiss");
      const url = res.results[0].url;

      
      const buff = await bufferUrl(url);
      const resdls = await gifToMp4(buff);
      
      await Moody.sendMessage(
        m.chat,
        {
          video: resdls,
          gifPlayback: true,
          caption:
            who !== m.sender
              ? `\`${m.pushName}\` besó a \`${user_info.name || who.split("@")[0]}\``
              : `\`${m.pushName}\` se besó a si mismo/a `,
          mentions: who !== m.sender ? [m.sender, who] : [m.sender],
        },
        { quoted: m },
      );
      
    } catch (error) {
      console.error("[KISS CMD ERROR]", error);
      m.reply("Ocurrió un error al intentar generar el GIF.");
    }
  },
};