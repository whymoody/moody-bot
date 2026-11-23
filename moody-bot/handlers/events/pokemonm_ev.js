const {
  CAPTURE_DURATION_MS,
  getActiveQuiz,
  normalizeGuess,
  removeActiveQuiz,
  setPendingCapture,
} = require("../../utils/pokemon-quiz");

module.exports = {
  group: true,
  groupEvent: true,
  exec: async (m, client, { prefix, body }) => {
    if (m.isBot || !m.isGroup || typeof body !== "string") return;

    const quiz = getActiveQuiz(m.chat);
    if (!quiz) return;

    const guess = normalizeGuess(body);
    if (!guess || body.trim().startsWith(prefix)) return;

    const acceptedNames = quiz.names.map(normalizeGuess);
    if (!acceptedNames.includes(guess)) return;
    if (removeActiveQuiz(m.chat) !== quiz) return;

    setPendingCapture(m.chat, m.sender, quiz);
    await client.sendMessage(
      m.chat,
      {
        text: `🎉 ¡Correcto, @${m.sender.split("@")[0]}! Era *${quiz.names[0]}*.\nUsa *.pokebola* en los próximos ${Math.floor(CAPTURE_DURATION_MS / 1000)} segundos para agregarlo a tu Pokédex.`,
        mentions: [m.sender],
      },
      { quoted: m },
    );
  },
};
