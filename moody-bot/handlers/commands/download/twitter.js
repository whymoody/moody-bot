const { exec } = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { ConvertMiles } = require("../../../utils/index");
const { BOT_CONFIG } = require("../../../utils/config.json");

module.exports = {
  tags: ["download"],
  args: ["url"],
  cmd: ["tw", "x", "xdl", "twdl", "twitter"],
  help: ["twitter"],
  exec: async (m, Moody, { args }) => {
    const url = args.find(arg => arg.includes("twitter.com") || arg.includes("x.com"));
    if (!url) return m.reply("*∙ Ingresa un enlace válido de Twitter / X.*");

    await m.reply("*Obteniendo información y descargando...*");

    const jobDir = path.join(os.tmpdir(), `tw-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    fs.mkdirSync(jobDir, { recursive: true });

    const comandoInfo = `yt-dlp --dump-json "${url}"`;

    exec(comandoInfo, { timeout: 15000, maxBuffer: 1024 * 1024 * 10 }, async (err, stdout) => {

      if (err || !stdout) {
        console.log("[TWITTER] yt-dlp falló o tardó mucho. Pasando a FxTwitter...");
        fs.rm(jobDir, { recursive: true, force: true }, () => {});
        return usarFxTwitter(m, Moody, url);
      }

      try {
        const data = JSON.parse(stdout);
        const txt = `	╭  ✦ Twitter / X Download ✦  ╮\n
 *◦ Autor :* ${data.uploader || data.channel || 'Desconocido'} (@${data.uploader_id || 'user'})
 *◦ Texto :* ${data.title ? data.title.slice(0, 100) + '...' : 'Sin texto'}
 *◦ Likes :* ${ConvertMiles(data.like_count || 0)}
 *◦ Retweets :* ${ConvertMiles(data.repost_count || 0)}
 *◦ Respuestas :* ${ConvertMiles(data.comment_count || 0)}\n
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`;

        const outputTemplate = path.join(jobDir, "tw_media_%(id)s_%(autonumber)s.%(ext)s").replace(/\\/g, "/");
        const cmdDescarga = `yt-dlp "${url}" -o "${outputTemplate}" -f "best[ext=mp4]/best"`;

        exec(cmdDescarga, { timeout: 20000 }, async (errD) => {
          let enviadoAlguno = false;
          try {
            if (errD) {
              return usarFxTwitter(m, Moody, url);
            }

            const files = fs.readdirSync(jobDir).filter(f => f.startsWith("tw_media_"));
            if (files.length === 0) {
              return usarFxTwitter(m, Moody, url);
            }

            for (const fileName of files) {
              const filePath = path.join(jobDir, fileName);
              if (!fs.existsSync(filePath)) continue;

              const sizeMB = fs.statSync(filePath).size / (1024 * 1024);
              const isVideo = /\.(mp4|mov|webm)$/i.test(fileName);

              if (sizeMB > 64) {
                await Moody.sendMessage(m.chat, {
                  document: { url: filePath },
                  mimetype: isVideo ? "video/mp4" : "image/jpeg",
                  fileName: fileName,
                  caption: txt
                }, { quoted: m });
                enviadoAlguno = true;
                continue;
              }

              if (isVideo) {
                await Moody.sendMessage(m.chat, { video: { url: filePath }, caption: txt }, { quoted: m });
              } else {
                await Moody.sendMessage(m.chat, { image: { url: filePath }, caption: txt }, { quoted: m });
              }
              enviadoAlguno = true;
            }
          } catch (e) {
            console.error("[TWITTER DOWNLOAD]", e);
            if (!enviadoAlguno) return usarFxTwitter(m, Moody, url);
          } finally {
            fs.rm(jobDir, { recursive: true, force: true }, () => {});
          }
        });
      } catch (e) {
        fs.rm(jobDir, { recursive: true, force: true }, () => {});
        return usarFxTwitter(m, Moody, url);
      }
    });
  },
};

async function usarFxTwitter(m, Moody, url) {
  const jobDir = path.join(os.tmpdir(), `tw-fx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  fs.mkdirSync(jobDir, { recursive: true });

  try {
    const tweetId = url.match(/status\/(\d+)/)[1];
    const apiUrl = `https://api.fxtwitter.com/status/${tweetId}`;
    const { data: fxData } = await axios.get(apiUrl);
    const tweet = fxData.tweet || fxData.status;

    if (!tweet || !tweet.media || !tweet.media.all) {
      return m.reply("El tuit no contiene medios descargables.");
    }

    const txt = `	╭  ✦ Twitter / X Download ✦  ╮\n
 *◦ Autor :* ${tweet.author.name} (@${tweet.author.screen_name})
 *◦ Texto :* ${tweet.text ? tweet.text.slice(0, 100) + '...' : 'Sin texto'}
 *◦ Likes :* ${ConvertMiles(tweet.likes || 0)}
 *◦ Retweets :* ${ConvertMiles(tweet.retweets || 0)}
 *◦ Respuestas :* ${ConvertMiles(tweet.replies || 0)}\n
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`;

    let enviado = false;
    let idx = 0;

    for (const item of tweet.media.all) {
      idx++;
      const mediaUrl = item.url;
      if (!mediaUrl) continue;

      const esVideo = item.type === "video" || mediaUrl.includes(".mp4");
      const fileName = `tw-fx-${Date.now()}-${idx}.${esVideo ? 'mp4' : 'jpg'}`;
      const filePath = path.join(jobDir, fileName);

      const response = await axios({
        method: 'get',
        url: mediaUrl,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const sizeMB = fs.statSync(filePath).size / (1024 * 1024);

      if (sizeMB > 64) {
        await Moody.sendMessage(m.chat, {
          document: { url: filePath },
          mimetype: esVideo ? "video/mp4" : "image/jpeg",
          fileName: fileName,
          caption: txt
        }, { quoted: m });
        enviado = true;
        continue;
      }

      if (esVideo) {
        await Moody.sendMessage(m.chat, { video: { url: filePath }, caption: txt }, { quoted: m });
      } else {
        await Moody.sendMessage(m.chat, { image: { url: filePath }, caption: txt }, { quoted: m });
      }

      enviado = true;
    }

    if (!enviado) m.reply("No se pudo enviar ningún archivo.");
  } catch (e) {
    console.error("[TWITTER FX ERR]", e.message);
    m.reply("Error al obtener el contenido del tuit. Verifica que el enlace sea público.");
  } finally {
    fs.rm(jobDir, { recursive: true, force: true }, () => {});
  }
}