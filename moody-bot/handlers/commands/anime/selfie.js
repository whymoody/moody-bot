const axios = require("axios");
const { BOT_CONFIG } = require("../../../utils/config.json");

module.exports = {
  tags: ["anime"],
  cmd: ["selfie", "selfies"],
  help: ["selfie"],
  exec: async (m, Moody) => {
    try {
      
      const response = await axios.get("https://api.waifu.im/search?included_tags=selfie");
      const data = response.data.images[0];

      
      if (!data || !data.url) {
        return m.reply("La API no devolvió ninguna imagen. Intenta de nuevo.");
      }

     
      const sizeInKb = data.byte_size ? (data.byte_size / 1024).toFixed(1) + " KB" : "0kbps";
      
      
      const date = data.uploaded_at ? data.uploaded_at.split('T')[0] : "-";

      
      await Moody.sendMessage(
        m.chat,
        {
          image: { url: data.url },
          caption: `*亗 S E L F I E*\n
*› Id :* ${data.image_id || "-"}
*› Titulo :* Selfie Anime
*› Likes :* ${data.favorites || 0}
*› Publicado :* ${date}
*› Peso :* ${sizeInKb}
*› Nsfw :* ${data.is_nsfw ? "[ √ ]" : "[ × ]"}
*› Source :* ${data.source || "-"}\n
*🍟 Powered By ${BOT_CONFIG.BOT_NAME}.*`,
        },
        { quoted: m },
      );

    } catch (error) {
      
      console.error("[SELFIE ERROR]", error.message);
      m.reply(`Hubo un error al obtener la selfie. Intenta más tarde.`);
    }
  },
};