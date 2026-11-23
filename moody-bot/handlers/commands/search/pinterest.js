const { pinterestSearch } = require('cloudst'); 
const { BOT_CONFIG } = require("../../../utils/config.json");


const sentImagesCache = new Map();

module.exports = {
  tags: ["search"],
  cmd: ["pinterest", "pin"],
  help: ["pinterest"],
  args: ["término de búsqueda"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    const query = args.join(" ").trim();
    if (!query) return m.reply(`° Ejemplo : ${prefix + cmd} Satoru Gojo`);

    try {
      await m.reply(`Buscando imágenes de *${query}* en Pinterest...`);

      const result = await pinterestSearch(query, 20); 

      if (!result.status || !result.data || result.data.length === 0) {
        return m.reply(`No se encontraron imágenes para *${query}*.`);
      }

      
      const chatId = m.chat;
      if (!sentImagesCache.has(chatId)) {
          sentImagesCache.set(chatId, new Set());
      }
      const chatHistory = sentImagesCache.get(chatId);

     
      let availableImages = result.data.filter(pin => {
          const url = pin.hd || pin.mini;
          return !chatHistory.has(url);
      });

      
      if (availableImages.length === 0) {
          chatHistory.clear();
          availableImages = result.data;
      }

      
      const randomPin = availableImages[Math.floor(Math.random() * availableImages.length)];
      const imageUrl = randomPin.hd || randomPin.mini;

     
      chatHistory.add(imageUrl);

      
      if (chatHistory.size > 50) {
          const firstItem = chatHistory.values().next().value;
          chatHistory.delete(firstItem);
      }

      
      const caption = `  ╭  ✦ Pinterest Search ✦  ╮\n\n` +
                      `◦ Titulo : ${randomPin.title || "Sin título"}\n` +
                      `◦ Id : ${randomPin.id || "N/A"}\n` +
                      `◦ Autor : ${randomPin.full_name || "Desconocido"} (@${randomPin.username || "user"})\n` +
                      `◦ Stats : ♡ ${randomPin.likes || 0} / ${randomPin.followers || 0} follows\n` +
                      `◦ Creado : 🖇 ${randomPin.created_at || "N/A"}\n` +
                      `◦ Url : ${randomPin.link || randomPin.url || "https://es.pinterest.com/"}\n\n` +
                      `> LIGHTWEIGHT WABOT MADE BY ${BOT_CONFIG.CREATOR_NAME}`;

      await Moody.sendMessage(m.chat, {
        image: { url: imageUrl },
        caption: caption
      }, { quoted: m });

    } catch (error) {
      console.error("[PINTEREST ERROR]", error);
      m.reply("Ocurrió un error al buscar en Pinterest. Inténtalo de nuevo más tarde.");
    }
  },
};