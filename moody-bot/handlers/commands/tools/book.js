const { default: axios } = require("axios");
const { BASE_URL, BOT_CONFIG } = require("../../../utils/config.json");
const { getCountryInfo } = require("../../../utils/country");

module.exports = {
  tags: ["tools"],
  cmd: ["book", "cuaderno"],
  help: ["book"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    if (args.length < 1)
      return m.reply(
        `*🚩 Ejemplo :* ${prefix + cmd} Bienvenido a ${BOT_CONFIG.BOT_NAME} 😄`,
      );

    const country = await getCountryInfo(m.sender);
    const book_dls = await axios.get(BASE_URL + "/canvas/book", {
      params: {
        text: args.join(" "),
        footer: country.number || "-",
      },
      responseType: "arraybuffer",
    });
    Moody.sendMessage(m.chat, { image: book_dls.data }, { quoted: m });
  },
};
