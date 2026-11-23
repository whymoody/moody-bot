const { BOT_CONFIG } = require("../../../utils/config.json");
const xnxx = require("xnxx-dl");

const searchCache = new Map();

module.exports = {
  tags: ["download", "search"],
  args: ["query / número"],
  cmd: ["xnxx", "xnxxs", "xnxxsearch"],
  help: ["xnxx"],

  exec: async (m, Moody, { prefix, cmd, args }) => {
    try {
      if (!args || args.length < 1) {
        return m.reply(
          `*Uso del comando:*\n\n` +
          `• Buscar: ${prefix}xnxx rusas\n` +
          `• Descargar: ${prefix}xnxx 3`
        );
      }

      const text = args.join(" ").trim();
      const isNumber = /^\d+$/.test(text);

      if (isNumber) {
        const choice = parseInt(text);
        const cached = searchCache.get(m.sender);

        if (!cached || !cached.results) {
          return m.reply(
            `*No hay una búsqueda reciente.*\n` +
            `Primero busca con:\n${prefix}xnxx nombre del video`
          );
        }

        if (choice < 1 || choice > cached.results.length) {
          return m.reply(`*Número inválido.* Elige entre 1 y ${cached.results.length}`);
        }

        const video = cached.results[choice - 1];
        await m.reply(`Descargando opción *${choice}*...`);

        const info = await xnxx.getInfo(video.url);

        if (!info?.dlink) {
          return m.reply("*No se pudo obtener el enlace de descarga.*");
        }

        const caption = `╭  ✦ Xnxx Download ✦  ╮

 *◦ Título :* ${info.title || video.title || "-"}
 *◦ Vistas :* ${info.views || "-"}
 *◦ Duración :* ${info.duration || "-"}
 *◦ Rating :* ${info.rating || "-"}

> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`;

        await Moody.sendMessage(
          m.chat,
          {
            video: { url: info.dlink },
            caption: caption,
            mimetype: "video/mp4",
            fileName: (info.title || "xnxx").replace(/[^\w\s]/gi, "").slice(0, 60) + ".mp4",
          },
          { quoted: m }
        );
        return;
      }

      await m.reply("Buscando...");

      const results = await xnxx.search(text);

      if (!results || results.length === 0) {
        return m.reply("*No se encontraron resultados.*");
      }

      const limitedResults = results.slice(0, 6);

      searchCache.set(m.sender, {
        results: limitedResults,
        timestamp: Date.now(),
      });

      setTimeout(() => searchCache.delete(m.sender), 5 * 60 * 1000);

      for (let i = 0; i < limitedResults.length; i++) {
        const video = limitedResults[i];

        try {
          const info = await xnxx.getInfo(video.url);

          const caption =
            `*${i + 1}. ${info.title || video.title}*\n\n` +
            `Vistas: ${info.views || "N/A"}\n` +
            `Duración: ${info.duration || "N/A"}\n` +
            `Rating: ${info.rating || "N/A"}\n\n` +
            `${video.url}\n\n` +
            `_Para descargar escribe:_\n*${prefix}xnxx ${i + 1}*`;

          await Moody.sendMessage(
            m.chat,
            {
              image: { url: info.thumbnail },
              caption: caption,
            },
            { quoted: m }
          );

          await new Promise((r) => setTimeout(r, 1300));
        } catch (err) {
          console.error(`Error en video ${i + 1}:`, err.message);
          await m.reply(
            `*${i + 1}.* ${video.title}\n🔗 ${video.url}\n_(No se pudo cargar la vista previa)_`
          );
        }
      }

      await m.reply(
        `Se mostraron *${limitedResults.length}* resultados.\n\n` +
        `Para descargar escribe:\n*${prefix}xnxx número*\n\n` +
        `Ejemplo: *${prefix}xnxx 3*`
      );

    } catch (error) {
      console.error("[XNXX] Error:", error);
      m.reply(`*Error:* ${error.message || error}`);
    }
  },
};