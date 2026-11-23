const RANKS = [
  { name: "Bronce I", xpRequired: 0 },
  { name: "Bronce II", xpRequired: 1000 },
  { name: "Bronce III", xpRequired: 2500 },
  { name: "Plata I", xpRequired: 5000 },
  { name: "Plata II", xpRequired: 8000 },
  { name: "Plata III", xpRequired: 12000 },
  { name: "Oro I", xpRequired: 17000 },
  { name: "Oro II", xpRequired: 23000 },
  { name: "Oro III", xpRequired: 30000 },
  { name: "Platino I", xpRequired: 40000 },
  { name: "Platino II", xpRequired: 52000 },
  { name: "Platino III", xpRequired: 66000 },
  { name: "Diamante", xpRequired: 85000 } 
];


function getRankData(xp) {
  const currentXp = Number(xp) || 0;
  let currentIndex = 0;

  for (let i = 0; i < RANKS.length; i++) {
    if (currentXp >= RANKS[i].xpRequired) currentIndex = i;
    else break;
  }

  const currentRank = RANKS[currentIndex];
  const nextRank = RANKS[currentIndex + 1] || null;
  const level = currentIndex + 1;
  const xpMissing = nextRank ? (nextRank.xpRequired - currentXp) : 0;

  return {
    currentRank: currentRank.name,
    currentXp: currentXp,
    nextRank: nextRank ? nextRank.name : "Máximo",
    xpMissing: xpMissing,
    nextRankXpReq: nextRank ? nextRank.xpRequired : currentRank.xpRequired,
    level: level,
    nextLevel: nextRank ? level + 1 : level,
  };
}


async function checkRankUp(oldXp, newXp, m, Moody) {
  const oldRankData = getRankData(oldXp);
  const newRankData = getRankData(newXp);

  
  if (oldRankData.currentRank === newRankData.currentRank) return;

  
  let authorName = m.pushName || m.sender.split("@")[0];
  
  
  let botName = "Moody Bot";
  try {
    const cfg = require("./config.json");
    botName = (cfg.BOT_CONFIG || cfg).BOT_NAME || botName;
  } catch {}

  const rankUpMsg = 
    `*🎉 ¡SUBISTE DE RANGO! 🎉*\n\n` +
    `*@${m.sender.split("@")[0]}* ha alcanzado un nuevo rango.\n\n` +
    `*ゲ◜៹ Nuevo Rango ៹◞ゲ*\n` +
    `*Usuɑrio ∙* ${authorName}\n` +
    `*Rɑngo ∙* ${newRankData.currentRank} 🚩\n` +
    `*Nivel ∙* [ ${oldRankData.level} ] ➠ [ ${newRankData.level} ]\n` +
    `*Xp ∙* [ *${newXp.toLocaleString('en-US')}* ] ➫ [ *${newRankData.nextRankXpReq.toLocaleString('en-US')}* ]\n` +
    `*Faltɑn ∙* *${newRankData.xpMissing.toLocaleString('en-US')} XP* para *${newRankData.nextRank}*\n\n` +
    `*Get Profile By ${botName} 🌵*`;

  
  await Moody.sendMessage(m.chat, { 
    text: rankUpMsg,
    mentions: [m.sender] 
  }, { quoted: m });
}


module.exports = { getRankData, checkRankUp, RANKS };