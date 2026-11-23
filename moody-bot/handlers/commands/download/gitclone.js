const axios = require("axios");
const { BOT_CONFIG } = require("../../../utils/config.json");
const { ConvertMiles } = require("../../../utils/index");

module.exports = {
  tags: ["download"],
  args: ["url"],
  cmd: ["gitclone", "repo", "git", "gitc", "gc"],
  help: ["gitclone"],
  exec: async (m, Moody, { args }) => {
    const text = args.join(" ").trim();
    if (!text) {
      return m.reply(
        "*🍟 Ingresa un enlace de GitHub.*\n*Ejemplo:* gitclone https://github.com/darlyn1234/moody-bot"
      );
    }

   
    const match = text.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return m.reply("El enlace no parece ser un repositorio válido de GitHub.");
    }
    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, "").replace(/#.*$/, ""); 

    await m.reply("*Obteniendo información y descargando el repositorio* (Esto puede tardar unos segundos)");

    try {
      
      const repoInfo = await axios.get(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
        headers: { "User-Agent": "MoodyBot/1.0" },
        timeout: 15000,
      });

      const data = repoInfo.data;

      
      const imageUrl = data.owner?.avatar_url || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
      
      let gitInfo =
        `亗 G I T C L O N E\n\n` +
        `*› Nombre :* ${data.name || "Desconocido"}\n` +
        `*› Creador :* ${data.owner?.login || "Desconocido"}\n` +
        `*› Id :* ${data.id || "N/A"}\n` +
        `*› Lenguaje :* ${data.language || "N/A"}\n` +
        `*› Creado :* ${new Date(data.created_at).toLocaleDateString() || "N/A"}\n` +
        `*› Actualizado :* ${new Date(data.updated_at).toLocaleDateString() || "N/A"}\n` +
        `*› Peso :* ${(data.size / 1024).toFixed(2)} MB\n` +
        `*› Forks :* ${ConvertMiles(data.forks_count || 0)}\n` +
        `*› Estrellas :* ${ConvertMiles(data.stargazers_count || 0)}\n` +
        `*› Descripción :* ${data.description || "Sin descripción"}\n\n` +
        `> *❄️ Powered By ${BOT_CONFIG.BOT_NAME || "Moody Bot"}*`;

     
      const rq = await Moody.sendMessage(
        m.chat,
        { image: { url: imageUrl }, caption: gitInfo },
        { quoted: m }
      );

     
      const zipUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/zipball`;
      const zipResponse = await axios.get(zipUrl, {
        responseType: "arraybuffer",
        headers: { "User-Agent": "MoodyBot/1.0" },
        timeout: 60000, 
      });

      
      await Moody.sendMessage(
        m.chat,
        {
          document: Buffer.from(zipResponse.data),
          mimetype: "application/zip",
          fileName: `${cleanRepo}.zip`,
        },
        { quoted: rq }
      );

    } catch (error) {
      console.error("[GITCLONE ERROR]", error.message);
      
      let errorMsg = "Hubo un error al procesar el repositorio.";
      if (error.response?.status === 404) {
        errorMsg = "El repositorio no existe o es privado.";
      } else if (error.code === 'ECONNABORTED') {
        errorMsg = "El repositorio es demasiado grande y la descarga tardó demasiado.";
      }
      
      m.reply(`Error:\n_${errorMsg}_`);
    }
  },
};