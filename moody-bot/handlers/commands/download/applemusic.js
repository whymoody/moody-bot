const { BASE_URL, BOT_CONFIG } = require("../../../utils/config.json");
const { default: axios } = require("axios");
const { statistics } = require("../../../db");
const { sizeFromUrl } = require("../../../utils/scraper");

module.exports = {
  tags: ["download", "search"],
  args: ["query/url"],
  cmd: ["apple", "applemusic", "applemusicdl"],
  help: ["applemusic"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    const text = args.join(" ").trim();
    if (!text)
      return m.reply(
        `*🚩 Ingresa un enlace o busqueda de Apple Music.*\n\n*Ejemplo ∙* ${prefix + cmd} https://music.apple.com/es/album/sola-remix-feat-daddy-yankee-wisin-farruko-zion-lennox/1183214926?i=1183215242\n\n*Ejemplo:* ${prefix + cmd} Feel Special`,
      );

    try {
      const isUrlAppleMusic = /^https?:\/\//i.test(text);
      let song;

      if (isUrlAppleMusic) {
        const { data } = await axios.get(`${BASE_URL}/download/applemusicdl`, {
          params: { url: text },
        });
        song = data?.data;
        if (!song || typeof song !== "object" || !song.download) {
          throw new Error("La API no devolvió un enlace de descarga.");
        }
        song.title = song.name || song.title;
        song.artist = song.artists;
        song.url = text;
      } else {
        const { data } = await axios.get(`${BASE_URL}/search/applemusic`, {
          params: { text },
        });
        if (!Array.isArray(data)) {
          throw new Error("La API devolvió una respuesta de búsqueda inválida.");
        }
        song = data.find((result) => result?.type === "Canción");

        if (!song) {
          return m.reply("*🚩 No encontré canciones para esa búsqueda.*");
        }

        const { data: downloadData } = await axios.get(
          `${BASE_URL}/download/applemusicdl`,
          { params: { url: song.url } },
        );
        const download = downloadData?.data;
        if (!download || typeof download !== "object" || !download.download) {
          throw new Error("La API no devolvió un enlace de descarga.");
        }
        song.download = download.download;
      }

      const caption = `	╭  ✦ Apple Music ${isUrlAppleMusic ? "Download" : "Search"} ✦  ╮\n
 *◦ Titulo :* ${song.title || "-"}
 *◦ Artista :* ${song.artist || "-"}
 *◦ Duracion :* ${song.duration || "-"}
 *◦ Enlace :* ${song.url || text}\n
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`;

      let quoted = m;
      if (song.image) {
        quoted = await Moody.sendMessage(
          m.chat,
          { image: { url: song.image }, caption },
          { quoted: m },
        );
      } else {
        await Moody.sendMessage(
          m.chat,
          { text: caption },
          { quoted: m },
        );
      }

      await Moody.sendMessage(
        m.chat,
        { audio: { url: song.download }, mimetype: "audio/mpeg" },
        { quoted },
      );

      try {
        const { size } = await sizeFromUrl(song.download);
        await statistics("filesize", size);
      } catch (error) {
        console.error(
          "[applemusic] No se pudo actualizar el tamaño de la descarga:",
          error.message || error,
        );
      }
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : null;
      console.error("[applemusic] Falló la búsqueda o descarga:", error.message || error);

      if (status === 404) {
        return m.reply(
          "*🚩 El servicio de Apple Music no encontró ese contenido o la descarga ya no está disponible. Prueba con otra búsqueda o enlace.*",
        );
      }

      return m.reply(
        "*🚩 No se pudo completar la búsqueda o descarga de Apple Music. Inténtalo de nuevo más tarde.*",
      );
    }
  },
};
