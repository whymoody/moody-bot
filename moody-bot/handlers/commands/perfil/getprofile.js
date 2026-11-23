const { Users } = require("../../../db");
const moderators = require("../../../db/moderators");
const { BOT_CONFIG, owner: OWNERS } = require("../../../utils/config.json");
const { getRankData } = require("../../../utils/rank");
const { digits, resolveJids } = require("../../../utils/identity");

const formatNum = (num) => (Number(num) || 0).toLocaleString("en-US");
const flag = (value) => (value ? "✓" : "×");

module.exports = {
  tags: ["perfil"],
  cmd: ["getprofile"],
  help: ["getprofile"],
  exec: async (m, Moody, { prefix, cmd }) => {
    try {
      const who = m.quoted
        ? m.quoted.sender
        : m.mentionedJid && m.mentionedJid[0]
          ? m.mentionedJid[0]
          : m.sender;

      const user = await Users.get(who);

      if (!user) {
        return m.reply("Este usuario no está registrado en mi base de datos.");
      }

      const authorName = who === m.sender ? m.pushName : who.split("@")[0];

      const xp = Number(user.xp) || 0;
      const rankData = getRankData(xp);
      const rank = rankData.currentRank;
      const level = rankData.level;
      const nextLevel = rankData.nextLevel;
      const maxXp = rankData.nextRankXpReq;
      const coins = Number(user.coins || user.balance) || 0;

      const ids = await resolveJids(who, m, Moody);
      const ownerIds = (OWNERS || []).map(digits).filter(Boolean);
      const isCreator =
        Boolean(user.creator) ||
        (ids.length > 0 &&
          ids.some((jid) => ownerIds.includes(digits(jid))));

      const matchedModerator = await moderators.find(ids).catch(() => null);
      const isModerator = Boolean(user.moderator) || Boolean(matchedModerator);

      if (matchedModerator) {
        await moderators
          .addAliases(matchedModerator, ids)
          .catch((error) =>
            console.warn("[getprofile] Alias no guardado:", error.message),
          );
      }

      const profileText =
        `*Get - Profile*\n\n` +
        `*Usuɑrio ∙* ${authorName}\n` +
        `*Rɑngo ∙* ${rank} 🚩\n` +
        `*Xp ∙* \t[ *${formatNum(xp)}* ] ➫ [ *${formatNum(maxXp)}* ]\n` +
        `*Nivel ∙* [ ${level} ] ➠ [ ${nextLevel} ]\n` +
        `*Dinero ∙* *₱${formatNum(coins)}* ${BOT_CONFIG.MONEY_NAME || "deliCoins"}\n` +
        `*Moderɑdor ∙* ${flag(isModerator)}\n` +
        `*Creɑdor ∙* ${flag(isCreator)}\n` +
        `*Premium ∙* ${flag(user.premium)}\n\n` +
        `*Get Profile By ${BOT_CONFIG.BOT_NAME || "Moody"} 🌵*`;

      await Moody.sendMessage(m.chat, { text: profileText }, { quoted: m });

    } catch (error) {
      console.error("[GETPROFILE ERROR]", error);
      m.reply("Ocurrió un error al intentar obtener el perfil.");
    }
  },
};