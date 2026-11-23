const axios = require('axios');

module.exports = {
  cmd: ["waifu"],
  desc: "Obtiene una imagen aleatoria de una waifu",
  category: ["anime"],
  exec: async (m, sock) => {
    try {
      let imageResult = null;
      let attempts = 0;

     
      while (attempts < 10) {
        const { data } = await axios.get("https://nekos.best/api/v2/waifu", {
          headers: { "User-Agent": "MoodyBot/1.0" }
        });
        
        const result = data.results[0];
        
       
        if (!result.url.toLowerCase().endsWith('.gif')) {
          imageResult = result;
          break; 
        }
        
        attempts++; 
      }

      
      if (!imageResult) {
        return m.reply("La API solo está devolviendo GIFs en este momento. Intenta de nuevo en unos segundos.");
      }

      
      const caption = `*✦ Waifu Aleatoria ✦*\n\n> • *Artista:* ${imageResult.artist_name || 'Desconocido'}\n> • *Obra:* ${imageResult.anime_name || 'No especificada'}`;

     
      await sock.sendMessage(m.chat, { 
        image: { url: imageResult.url }, 
        caption: caption 
      }, { quoted: m });

    } catch (error) {
      console.error("[WAIFU ERROR]", error.message);
      await m.reply("No se pudo obtener la imagen. Inténtalo de nuevo más tarde.");
    }
  }
};