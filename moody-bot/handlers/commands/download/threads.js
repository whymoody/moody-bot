const axios = require("axios");
const { BASE_URL } = require("../../../utils/config.json");
const { statistics } = require("../../../db");
const { sizeFromUrl } = require("../../../utils/scraper");

async function resolveThreadsUrl(url) {
  if (!/threads\.(net|com)\/share\//i.test(url)) return url;
  try {
    const res = await axios.get(url, {
      maxRedirects: 5,
      timeout: 15000,
      validateStatus: (s) => s >= 200 && s < 400,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });
    return res.request?.res?.responseUrl || res.config?.url || url;
  } catch (e) {
    console.error("[threads] resolve share url failed:", e.message);
    return url;
  }
}

module.exports = {
  tags: ["download"],
  args: ["url"],
  cmd: ["threads", "threadsdl"],
  help: ["threads"],
  exec: async (m, Moody, { prefix, args, cmd }) => {
    let text = args.join(" ").trim();

    const isValidUrl = (url) =>
      /^https?:\/\/(www\.)?threads\.(net|com)\//i.test(url);

    if (!text || !isValidUrl(text)) {
      return m.reply(
        `*Ingresa el enlace de un post de Threads.*\n*Ejemplo :* ${
          prefix + cmd
        } https://www.threads.net/@momojypx/post/C52-OaTL3al`
      );
    }

    try {
      text = await resolveThreadsUrl(text);

      const endpoint = `${BASE_URL}/download/threads`;
      console.log("[threads] GET", endpoint, "url=", text);

      const res = await axios.get(endpoint, {
        params: { url: text },
        timeout: 30000,
      });

      const data = res?.data;
      const media = data?.data;

      if (!data?.status || !Array.isArray(media) || media.length === 0) {
        return m.reply("*🍟 Sin resultados para :* " + text);
      }

      for (const item of media) {
        if (!item?.url || !item?.type) continue;
        try {
          if (item.type === "image") {
            await Moody.sendMessage(
              m.chat,
              { image: { url: item.url } },
              { quoted: m }
            );
          } else if (item.type === "video") {
            await Moody.sendMessage(
              m.chat,
              { video: { url: item.url } },
              { quoted: m }
            );
          } else continue;

          try {
            const { size } = await sizeFromUrl(item.url);
            if (size) statistics("filesize", size);
          } catch {}
        } catch (sendErr) {
          console.error("[threads] sendMessage error:", sendErr);
          await m.reply(`No pude enviar un archivo: ${item.url}`);
        }
      }
    } catch (err) {
      const status = err?.response?.status;
      const apiMsg = err?.response?.data?.message;
      console.error("[threads] API error:", status, apiMsg || err.message);

      if (status === 404) {
        return m.reply(
          `La API respondió 404.\n\n` +
            `• URL enviada: ${text}\n` +
            `• Endpoint: ${BASE_URL}/download/threads\n\n` +
            `Revisa que la ruta sea correcta en tu API (quizá es /downloader/threads u otra).`
        );
      }

      m.reply(`Error al descargar: ${apiMsg || err.message}`);
    }
  },
};