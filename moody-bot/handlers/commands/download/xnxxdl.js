const { BOT_CONFIG } = require("../../../utils/config.json");
const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
  tags: ["download"],
  args: ["link"],
  cmd: ["xndl"],
  help: ["xndl"],

  exec: async (m, Moody, { prefix, cmd, args }) => {
    try {
      if (!args || args.length < 1) {
        return m.reply(`*Uso:*\n${prefix}xndl https://www.xnxx.com/video-xxxxx/titulo`);
      }

      const url = args.join(" ").trim();

      if (!url.includes("xnxx.com/video")) {
        return m.reply("*Link inválido.* Debe ser un enlace de video de xnxx.com");
      }

      await m.reply("Obteniendo video...");

      const { data: html } = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 20000,
      });

      const $ = cheerio.load(html);

      const title =
        $('meta[property="og:title"]').attr("content") ||
        $("title").text().replace(" - XNXX.COM", "").trim() ||
        "xnxx_video";

      let videoScript = "";
      $("script").each((i, el) => {
        const content = $(el).html() || "";
        if (content.includes("setVideoUrlHigh") || content.includes("setVideoUrlLow")) {
          videoScript = content;
        }
      });

      if (!videoScript) {
        return m.reply("*No se pudo encontrar el video en esta página.*");
      }

      const highMatch = videoScript.match(/setVideoUrlHigh\('([^']+)'\)/);
      const lowMatch = videoScript.match(/setVideoUrlLow\('([^']+)'\)/);
      const hlsMatch = videoScript.match(/setVideoHLS\('([^']+)'\)/);

      const downloadUrl = highMatch?.[1] || lowMatch?.[1] || hlsMatch?.[1];

      if (!downloadUrl) {
        return m.reply("*No se encontró ningún enlace de descarga.*");
      }

      console.log("[XNDL] Link de descarga encontrado:", downloadUrl.slice(0, 80) + "...");

      await m.reply("Descargando video...");

      const videoRes = await axios.get(downloadUrl, {
        responseType: "arraybuffer",
        timeout: 180000, // 3 minutos
        maxContentLength: 150 * 1024 * 1024, // 150MB
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://www.xnxx.com/",
        },
      });

      const buffer = Buffer.from(videoRes.data);
      const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);

      console.log("[XNDL] Tamaño descargado:", sizeMB, "MB");

      if (buffer.length < 50000) {
        return m.reply("*El archivo descargado es demasiado pequeño o inválido.*");
      }

      const caption = `╭  ✦ Xnxx Download ✦  ╮

 *◦ Título :* ${title}
 *◦ Tamaño :* ${sizeMB} MB

> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`;

      await Moody.sendMessage(
        m.chat,
        {
          video: buffer,
          caption: caption,
          mimetype: "video/mp4",
          fileName: title.replace(/[^\w\s]/gi, "").slice(0, 60) + ".mp4",
        },
        { quoted: m }
      );

      console.log("[XNDL] Video enviado correctamente");

    } catch (error) {
      console.error("[XNDL] Error:", error.message);
      m.reply(`*Error:* ${error.message}`);
    }
  },
};