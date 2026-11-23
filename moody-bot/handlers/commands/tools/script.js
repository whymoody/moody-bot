const { default: axios } = require("axios");
const { BOT_CONFIG } = require("../../../utils/config.json");

module.exports = {
  tags: ["tools"],
  cmd: ["sc", "script"],
  help: ["script"],
  exec: async (m, Moody ) => {
    let previousCommitSHA = "";
    let previousUpdatedAt = "";
    try {
      const response = await axios.get(
        `https://api.github.com/repos/darlyn1234/moody-bot/commits?per_page=1`,
      );
      const extractdata = response.data[0];
      const {
        sha,
        commit: { message },
        html_url,
      } = response.data[0];
      if (sha !== previousCommitSHA || message !== previousUpdatedAt) {
        previousCommitSHA = sha;
        previousUpdatedAt = message;
        let capgit = `   *ゲ◜៹ Bot Script ៹◞ゲ*\n
*Id ∙* ${extractdata.author.id || ""}
*Hora ∙* ${new Date(extractdata.commit.committer.date).toLocaleDateString()}
*Usuario ∙* ${extractdata.author.login || ""}
*Sha ∙* ${extractdata.sha}
*Repo Commit∙* ${html_url}
*Mensaje ∙* ${message}
*Enlace ∙* ${extractdata.author.html_url}/moody-bot\n
*🚩 Powered By ${BOT_CONFIG.BOT_NAME}*`;
        Moody.sendMessage(
          m.chat,
          { image: { url: extractdata.author.avatar_url }, caption: capgit },
          { quoted: m },
        );
      }
    } catch (er) {
      m.reply("*🚩 Error al verificar las actualizaciones*");
    }
  },
};
