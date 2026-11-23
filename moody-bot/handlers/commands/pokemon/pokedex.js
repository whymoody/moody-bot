const { BOT_CONFIG } = require("../../../utils/config.json");
const { getPokemonCollection } = require("../../../utils/pokedex");

const PAGE_SIZE = 20;

module.exports = {
  tags: ["pokemon"],
  cmd: ["pokedex"],
  args: ["pagina"],
  help: ["pokedex"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    const requestedPage = args[0] === undefined ? 1 : Number(args[0]);
    if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) {
      return m.reply(`*🚩 Indica un número de página válido.* Ejemplo: ${prefix + cmd} 1`);
    }

    try {
      const collection = await getPokemonCollection(m.sender);
      if (!collection.length) {
        return m.reply(
          "*Tu Pokédex está vacía. Captura un pokemon y vuelve a intentarlo.*",
        );
      }

      const pageCount = Math.ceil(collection.length / PAGE_SIZE);
      if (requestedPage > pageCount) {
        return m.reply(`*🚩 Tu Pokédex tiene ${pageCount} ${pageCount === 1 ? "página" : "páginas"}.*`);
      }

      const pageItems = collection.slice(
        (requestedPage - 1) * PAGE_SIZE,
        requestedPage * PAGE_SIZE,
      );
      const entries = pageItems.map(
        (pokemon) =>
          `◦ #${String(pokemon.id).padStart(4, "0")} ${pokemon.name} ×${pokemon.count}`,
      );

      return Moody.sendMessage(
        m.chat,
        {
          text: `╭  ✦ Pokédex de ${await Moody.getName(m.sender)} ✦  ╮\n\n${entries.join("\n")}\n\n*Pokemons capturados:* ${collection.length}\n*Capturas totales:* ${collection.reduce((total, pokemon) => total + pokemon.count, 0)}\n*Página:* ${requestedPage}/${pageCount}\n\n> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`,
        },
        { quoted: m },
      );
    } catch (error) {
      console.error("[pokedex] No se pudo leer la colección:", error);
      return m.reply(
        "*🚩 No pude leer tu Pokédex ahora. Inténtalo de nuevo más tarde.*",
      );
    }
  },
};
