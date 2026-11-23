const { groupManage } = require("../../../db");

module.exports = {
  tags: ["owner"],
  cmd: ["nsfw", "antinsfw"],
  help: ["nsfw"],
  group: true,
  admin: true,
  exec: async (m, Moody, { prefix, cmd, args }) => {
    if (!m.isGroup) return m.reply("");
    if (args.length === 0) return m.reply("*🍟 Ejemplo:* " +
          cmd +
          "on" +
          " *o* " +
          cmd +
          "off");
    const action = args[0]?.toLowerCase();
    if (!["on", "off"].includes(action)) {
      return m.reply(
        "*🍟 Ejemplo:* " +
          cmd +
          "on" +
          " *o* " +
          cmd +
          "off",
      );
    }
    const enable = action === "on" ? 1 : 0;
    try {
      await groupManage.update(m.chat, { nsfw: enable });
      const msgg = enable
        ? "*🎍 Nsfw ha sido `activado` en este grupo.*"
        : "*🧃 Nsfw ha sido `desactivado` en este grupo.*";
      Moody.sendMessage(m.chat, { text: msgg }, { quoted: m });
    } catch (err) {
      console.log(new Error(err).message);
      m.reply(new Error(err).message);
    }
  },
};
