const axios = require("axios");

const GOOGLE_SEARCH_URL = "https://www.searchapi.io/api/v1/search";

function formatGoogleResults(data) {
  const sections = [];
  const answer =
    data.answer_box?.answer || data.answer_box?.snippet || data.answer_box?.snippet_highlighted_words?.join(" ");
  if (answer) {
    sections.push(`*Respuesta destacada:*\n${answer}`);
  }

  const results = (data.organic_results || []).slice(0, 5);
  if (results.length) {
    sections.push(
      results
        .map((result, index) => {
          const snippet = (result.snippet || "Sin descripción disponible.").slice(0, 500);
          return `*${index + 1}. ${result.title || "Resultado"}*\n${snippet}\n${result.link || ""}`;
        })
        .join("\n\n"),
    );
  }

  return sections.length
    ? `*Resultados de Google:*\n\n${sections.join("\n\n")}`
    : null;
}

module.exports = {
  tags: ["search"],
  cmd: ["google", "googlesearch"],
  args: ["query"],
  help: ["google"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    const query = args.join(" ").trim();
    if (!query) {
      return m.reply(
        `*Ingresa lo que buscas.*\n*Ejemplo:* ${prefix + cmd} Lisa de blackpink`,
      );
    }

    const apiKey = process.env.SEARCHAPI_API_KEY;
    if (!apiKey) {
      return m.reply(
        "*🚩 Falta configurar la búsqueda de Google. Añade SEARCHAPI_API_KEY al archivo .env del bot.*",
      );
    }

    try {
      const response = await axios.get(GOOGLE_SEARCH_URL, {
        params: {
          engine: "google",
          q: query,
          api_key: apiKey,
          gl: "mx",
          hl: "es",
          num: 5,
        },
        timeout: 15000,
      });
      const text = formatGoogleResults(response.data || {});
      if (!text) {
        return m.reply("*🚩 Google no devolvió resultados para esa búsqueda.*");
      }
      return await Moody.sendMessage(m.chat, { text }, { quoted: m });
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : null;
      const providerError = axios.isAxiosError(error)
        ? error.response?.data?.error
        : null;
      console.error(
        "[google] Falló la búsqueda:",
        status || error.message || error,
        providerError || "",
      );
      if (status === 401 || status === 403) {
        return m.reply(
          "*🚩 SearchApi.io rechazó la clave. Revisa SEARCHAPI_API_KEY en el archivo .env.*",
        );
      }
      if (status === 429) {
        return m.reply(
          "*🚩 Se alcanzó el límite de búsquedas de SearchApi.io. Revisa tu cuota e inténtalo más tarde.*",
        );
      }
      return m.reply(
        "*🚩 No pude consultar Google ahora. Inténtalo de nuevo más tarde.*",
      );
    }
  },
};
