const { isRescueWord, handleKiraReply } = require("../commands/group/deathnote");

module.exports = {
  group: true,
  groupEvent: true,
  exec: async (m, Moody, { body }) => {
    if (m.isBot) return;
    if (!isRescueWord(body)) return;

    try {
      await handleKiraReply(m, Moody);
    } catch (error) {
      console.error(
        "[deathnote] No se pudo cancelar la sentencia:",
        error.message || error,
      );
    }
  },
};
