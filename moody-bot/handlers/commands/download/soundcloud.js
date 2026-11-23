const { BOT_CONFIG } = require("../../../utils/config.json");
const { soundcloud, sizeFromUrl } = require("../../../utils/scraper");
const { statistics } = require("../../../db");

module.exports = {
  tags: ["download"],
  args: ["url/nombre"],
  cmd: ["soundcloud", "soundclouddl", "downloadsoundcloud"],
  help: ["soundcloud"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    try {
      if (args.length < 1) return m.reply(`*Ejemplo :* ${prefix + cmd} nombre de la cancion`);

      await m.reply("*Buscando en SoundCloud...*");

      const responseee = await soundcloud(args.join(' '));
      const res = responseee.data;

      if (!res || !res.download) {
         return m.reply("No se encontró la canción o el enlace de descarga.");
      }

      await Moody.sendMessage(m.chat, {
        image: { url: res.image }, 
        caption: `	╭  ✦ Soundcloud Download ✦  ╮

 *◦ Titulo :* ${res.title}
 *◦ Artista :* ${res.artist}
 *◦ Genero :* ${res.genre}
 *◦ Album :* ${res.album}
 *◦ Play :* ${res.play}
 *◦ Likes :* ${res.likes}
 *◦ Comentarios :* ${res.comments}

> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`
      }, { quoted: m });

      let thumbnail = null;
      try {
         if (typeof Moody.reSizeImg === 'function') {
             thumbnail = await Moody.reSizeImg(res.avatar, 250, 250);
         }
      } catch (err) {
         console.log("Error creando thumbnail:", err.message);
      }

      await Moody.sendMessage(m.chat, { 
        document: { url: res.download }, 
        mimetype: "audio/mpeg", 
        fileName: `${res.title}.mp3`,
        jpegThumbnail: thumbnail 
      }, { quoted: m });

      if (typeof sizeFromUrl === 'function') {
          const fileSize = await sizeFromUrl(res.download);
          statistics('filesize', fileSize.size);
      }

    } catch (e) {
      console.error("[SOUNDCLOUD ERROR]", e);
      m.reply(`Ocurrió un error al procesar la canción:\n_${e.message}_`);
    }
  },
};