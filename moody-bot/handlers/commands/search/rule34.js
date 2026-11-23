const { default: axios } = require("axios");

module.exports = {
  tags: ["search"],
  args: ["query"],
  cmd: ["rule34"],
  help: ["rule34"],
  exec: async (m, Moody, { args }) => {
    const text = args.join(" ").trim();
    if (!text) return m.reply("*🍟 Ingresa el título/tags que buscas en Rule34.*");

    try {
      const apiKey = process.env.RULE34_API_KEY;
      const userId = process.env.RULE34_USER_ID;
      if (!apiKey || !userId) {
        return m.reply("*Configura RULE34_API_KEY y RULE34_USER_ID en el archivo .env del bot.*");
      }

      const res = await axios.get("https://api.rule34.xxx/index.php", {
        params: {
          page: "dapi",
          s: "post",
          q: "index",
          json: 1,
          limit: 100,          // máximo recomendado
          tags: text.replace(/\s+/g, "+"), // espacios → +
          api_key: apiKey,
          user_id: userId
        },
        timeout: 15000
      });

      const posts = res.data;

      if (!Array.isArray(posts) || posts.length === 0) {
        return m.reply("*🍟 Sin resultados.*");
      }

      const randomPost = posts[Math.floor(Math.random() * posts.length)];
      const imageUrl = randomPost.file_url || randomPost.sample_url || randomPost.preview_url;

      if (!imageUrl) {
        return m.reply("*🍟 No se encontró una URL de imagen válida.*");
      }

      await Moody.sendMessage(m.chat, {
        image: { url: imageUrl },
        caption: `*Rule34*\nTags: ${randomPost.tags?.slice(0, 100) || "N/A"}...`
      }, { quoted: m });

    } catch (error) {
      console.error("Error Rule34:", error?.response?.data || error.message);
      m.reply("*❌ Error al buscar en Rule34. Verifica tu API key o intenta más tarde.*");
    }
  },
};