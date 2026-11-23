const axios = require("axios");

const WIKIPEDIA_API_URL = "https://es.wikipedia.org/w/api.php";

module.exports = {
  tags: ["search"],
  cmd: ["wikipedia", "wiki"],
  args: ["tema"],
  help: ["wikipedia"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    const query = args.join(" ").trim();
    if (!query) {
      return m.reply(
        `*Escribe el tema que quieres buscar.*\n*Ejemplo:* ${prefix + cmd} México`,
      );
    }

    try {
      const response = await axios.get(WIKIPEDIA_API_URL, {
        params: {
          action: "query",
          generator: "search",
          gsrsearch: query,
          gsrlimit: 3,
          prop: "extracts|info",
          exintro: 1,
          explaintext: 1,
          inprop: "url",
          format: "json",
          formatversion: 2,
        },
        headers: { "User-Agent": "MoodyBot/1.0 (WhatsApp search command)" },
        timeout: 10000,
      });

      const pages = (response.data?.query?.pages || [])
        .filter((page) => page.title && page.extract)
        .slice(0, 3);
      if (!pages.length) {
        return m.reply("*🚩 No encontré artículos sobre ese tema en Wikipedia.*");
      }

      const results = pages.map((page, index) => {
        const summary = page.extract.replace(/\s+/g, " ").trim();
        const excerpt =
          summary.length > 700
            ? `${summary.slice(0, 697).trimEnd()}...`
            : summary;
        return `*${index + 1}. ${page.title}*\n${excerpt}\n*Artículo:* ${page.fullurl}`;
      });

      return await Moody.sendMessage(
        m.chat,
        { text: `*Resultados de Wikipedia:*\n\n${results.join("\n\n")}` },
        { quoted: m },
      );
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : null;
      console.error(
        "[wikipedia] Falló la búsqueda:",
        status || error.message || error,
      );
      return m.reply(
        "*🚩 No pude consultar Wikipedia ahora. Inténtalo de nuevo más tarde.*",
      );
    }
  },
};
