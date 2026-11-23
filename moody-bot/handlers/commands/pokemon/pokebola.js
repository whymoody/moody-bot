const { groupManage } = require("../../../db");
const { MSG } = require("../../../utils/config.json");
const { addPokemon } = require("../../../utils/pokedex");
const {
  getPendingCapture,
  removePendingCapture,
  setPendingCapture,
} = require("../../../utils/pokemon-quiz");

module.exports = {
  tags: ["pokemon"],
  cmd: ["pokebola"],
  help: ["pokebola"],
  exec: async (m, Moody) => {
    if (!m.isGroup) return m.reply(MSG.groupMsg);

    const group = await groupManage.get(m.chat);
    if (!group?.games) {
      return m.reply("*🚩 Los minijuegos están desactivados en este grupo.*");
    }

    if (!getPendingCapture(m.chat, m.sender)) {
      return m.reply(
        "*🚩 No tienes un Pokémon esperando ser capturado.*",
      );
    }
    const capture = removePendingCapture(m.chat, m.sender);
    if (!capture) {
      return m.reply("*🚩 Tu pokemon se escapo.*");
    }

    try {
      const saved = await addPokemon(m.sender, {
        id: capture.id,
        name: capture.names[0] || "Pokémon",
      });
      removePendingCapture(m.chat, m.sender);

      return Moody.sendMessage(
        m.chat,
        {
          text: `¡Capturaste a *${saved.name}*!\nPokédex: *${saved.count}* ${saved.count === 1 ? "captura" : "capturas"} de esta especie.`,
        },
        { quoted: m },
      );
    } catch (error) {
      setPendingCapture(m.chat, m.sender, capture, capture.expiresAt);
      console.error("[pokebola] No se pudo capturar el Pokémon:", error);
      return m.reply(
        "*🚩 No se pudo capturar tu Pokémon. Inténtalo de nuevo en un momento.*",
      );
    }
  },
};
