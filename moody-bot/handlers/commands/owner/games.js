const { groupManage } = require("../../../db");

module.exports = {
  tags: ["owner"],
  cmd: ["juegos", "games", "juegoson", "juegosoff", "gameson", "gamesoff"],
  help: ["games"],
  group: true,
  botAdmin: false,
  admin: true,
  exec: async (m, Moody, { prefix, cmd, args }) => {
    if (!m.isGroup) return m.reply("");
    const command = String(cmd).toLowerCase();
    const action = command.endsWith("on")
      ? "on"
      : command.endsWith("off")
        ? "off"
        : args[0]?.toLowerCase();
    if (!["on", "off"].includes(action)) {
      return m.reply(
        `*🍟 Ejemplo:* ${prefix}games on *o* ${prefix}games off`,
      );
    }
    const enable = action === "on" ? 1 : 0;
    try {
      await groupManage.update(m.chat, { games: enable });
      const msgg = enable
        ? "*🎍 Los juegos han sido `activados` en este grupo.*"
        : "*🧃 Los juegos han sido `desactivados` en este grupo.*";
      Moody.sendMessage(m.chat, { text: msgg }, { quoted: m });
    } catch (err) {
      console.log(new Error(err).message);
      m.reply(new Error(err).message);
    }
  },
};
