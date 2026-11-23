const { groupManage } = require("../../../db");
const { MSG } = require("../../../utils/config.json");
const {
  QUIZ_DURATION_MS,
  getPokemonQuiz,
  getActiveQuiz,
  setActiveQuiz,
  removeActiveQuiz,
} = require("../../../utils/pokemon-quiz");

module.exports = {
  tags: ["pokemon"],
  cmd: ["pokemon"],
  help: ["pokemonm", "pokemon"],
  exec: async (m, Moody) => {
    if (!m.isGroup) return m.reply(MSG.groupMsg);

    const group = await groupManage.get(m.chat);
    if (!group?.games) {
      return m.reply("*🚩 Los minijuegos están desactivados en este grupo.*");
    }

    if (getActiveQuiz(m.chat)) {
      return m.reply("*🚩 Ya hay una ronda activa en este grupo.*");
    }

    try {
      const pokemon = await getPokemonQuiz();
      const answer = pokemon.names[0] || "Pokémon";
      const quiz = {
        id: pokemon.id,
        names: pokemon.names,
        expiresAt: Date.now() + QUIZ_DURATION_MS,
        timeout: null,
      };
      quiz.timeout = setTimeout(async () => {
        if (removeActiveQuiz(m.chat) !== quiz) return;
        await Moody.sendMessage(m.chat, {
          text: `Se acabó el tiempo. Era *${answer}*.`,
        });
      }, QUIZ_DURATION_MS);
      quiz.timeout.unref?.();
      setActiveQuiz(m.chat, quiz);

      return Moody.sendMessage(
        m.chat,
        {
          image: pokemon.image,
          caption: `╭  ✦ ¿Quién es este Pokémon? ✦  ╮

*Pistas:*
${pokemon.hints.map((hint) => `◦ ${hint}`).join("\n")}

*Escribe su nombre para responder.* Tienen 60 segundos.`,
        },
        { quoted: m },
      );
    } catch (error) {
      console.error(
        "[pokemonm] No se pudo iniciar el reto:",
        error.response?.status || error.message || error,
      );
      return m.reply(
        "*No se pudo encontrar un Pokémon. Inténtalo de nuevo en un momento.*",
      );
    }
  },
};
