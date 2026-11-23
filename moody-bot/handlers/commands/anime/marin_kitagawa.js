const { default: axios } = require("axios");
const { BOT_CONFIG } = require("../../../utils/config.json");

module.exports = {
  tags: ["anime"],
  cmd: ["marin_kitagawa", "marinkitagawa", "mk"],
  help: ["marin_kitagawa"],
  exec: async (m, Moody) => {
    try {
      const apiKey = process.env.RULE34_API_KEY;
      const userId = process.env.RULE34_USER_ID;
      let imageUrl;
      let source;

      if (apiKey && userId) {
        try {
          const { data } = await axios.get("https://api.rule34.xxx/index.php", {
            params: {
              page: "dapi",
              s: "post",
              q: "index",
              tags: "kitagawa_marin",
              limit: 100,
              json: 1,
              api_key: apiKey,
              user_id: userId,
            },
            timeout: 15000,
          });

          if (Array.isArray(data) && data.length > 0) {
            const randomPost = data[Math.floor(Math.random() * data.length)];
            imageUrl = randomPost.file_url || randomPost.sample_url;
            source = "Rule34";
          } else {
            console.warn("Rule34 no devolvió imágenes; se usará Danbooru.");
          }
        } catch (error) {
          console.warn("Falló la consulta a Rule34; se usará Danbooru:", error.message);
        }
      } else {
        console.warn("Faltan las credenciales de Rule34; se usará Danbooru.");
      }

      if (!imageUrl) {
        const { data } = await axios.get("https://danbooru.donmai.us/posts.json", {
          params: {
            tags: "kitagawa_marin rating:safe -ai_generated -ai-generated",
            limit: 20,
            random: true,
          },
          timeout: 15000,
        });

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No se encontraron imágenes seguras en Danbooru.");
        }

        const randomPost = data[Math.floor(Math.random() * data.length)];
        imageUrl = randomPost.file_url || randomPost.large_file_url;
        source = "Danbooru";
      }

      if (!imageUrl) {
        throw new Error("La imagen seleccionada no tiene URL válida.");
      }

      await Moody.sendMessage(
        m.chat,
        {
          image: { url: imageUrl },
          caption: `╭  ✦ Marin Kitagawa ✦  ╮\n\n> Fuente: ${source}\n> Powered By ${BOT_CONFIG.BOT_NAME}`,
        },
        { quoted: m }
      );
    } catch (error) {
      console.error("Error al ejecutar el comando marin_kitagawa:", error.message || error);
      await m.reply(
        `No se pudo obtener la imagen: ${error.message || String(error)}`
      );
    }
  },
};
