const { default: axios } = require("axios");
const { BASE_URL, BOT_CONFIG } = require("../../../utils/config.json");

module.exports = {
  tags: ["search"],
  args: ["query"],
  cmd: ["codepen"],
  help: ["codepen"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    try {
      if (args.length < 1) return m.reply(`*🚩 Ejemplo :* ${prefix + cmd} threejs`);
      const response = await axios.get(BASE_URL + "/search/codepen", {
        params: {
          query: args.join(" "),
        }
      });
      const results = response.data?.data;
      if (!Array.isArray(results) || results.length === 0) {
        return m.reply("*🚩 No se encontraron resultados de CodePen.*");
      }
      const rdd = results[Math.floor(Math.random() * results.length)];
      await Moody.sendMessage(m.chat, {image: {url: rdd.avatar}, caption: `	╭  ✦ CodePen Search ✦  ╮\n
 *◦ Id :* ${rdd.id}
 *◦ Titulo :* ${rdd.title}
 *◦ Creado :* ${rdd.created}
 *◦ Vistas :* ${rdd.views}
 *◦ Comentarios :* ${rdd.comments}
 *◦ Likes :* ${rdd.likes}
 *◦ Nombre :* ${rdd.owner}
 *◦ Usuario :* ${rdd.username}
 *◦ Preview :* ${rdd.preview}
 *◦ Enlace :* ${rdd.url}
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`})
    } catch (er) {
      if (axios.isAxiosError(er) && er.response?.status === 404) {
        return m.reply(
          "*🚩 El servicio de búsqueda de CodePen no está disponible ahora mismo (la ruta de la API devuelve 404).*",
        );
      }
      console.error("[codepen] Falló la búsqueda:", er);
      return m.reply("*🚩 No pude consultar CodePen. Inténtalo de nuevo más tarde.*");
    }
  },
};
