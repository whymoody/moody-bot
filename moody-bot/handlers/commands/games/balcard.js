const { default: axios } = require("axios");
const Jimp = require("jimp");
const { MSG, BOT_CONFIG } = require("../../../utils/config.json");
const { groupManage, Users } = require("../../../db");

const WIDTH = 1000;
const HEIGHT = 560;
const CYAN = 0x39d6eaff;

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX").format(Number(value) || 0);
}

function drawPanel(image, x, y, width, height, color) {
  image.composite(new Jimp(width, height, color), x, y);
}

async function createBalanceCard({
  username,
  number,
  balance,
  xp,
  level,
  avatarBuffer,
}) {
  const image = new Jimp(WIDTH, HEIGHT);
  image.scan(0, 0, WIDTH, HEIGHT, function (x, y, index) {
    const blend = Math.min(1, x / WIDTH * 0.65 + y / HEIGHT * 0.35);
    this.bitmap.data[index] = Math.round(11 + blend * 13);
    this.bitmap.data[index + 1] = Math.round(19 + blend * 19);
    this.bitmap.data[index + 2] = Math.round(39 + blend * 34);
    this.bitmap.data[index + 3] = 255;
  });

  drawPanel(image, 0, 0, 12, HEIGHT, CYAN);
  drawPanel(image, 52, 55, 896, 450, 0x101b2df0);
  drawPanel(image, 52, 55, 7, 450, CYAN);
  drawPanel(image, 82, 106, 170, 170, 0x263d5aff);

  if (avatarBuffer) {
    const avatar = await Jimp.read(avatarBuffer);
    avatar.cover(158, 158);
    image.composite(avatar, 88, 112);
  } else {
    const initials = (username || "U")
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase();
    const initialsFont = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    image.print(initialsFont, 88, 112, {
      text: initials,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    }, 158, 158);
  }

  const titleFont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
  const nameFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const labelFont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
  const valueFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const balanceFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

  image.print(titleFont, 88, 82, "BALANCE  /  PLAYER CARD");
  image.print(nameFont, 286, 128, String(username || "Jugador").slice(0, 24));
  image.print(labelFont, 288, 180, `ID  ${number || "----"}`);
  drawPanel(image, 286, 224, 130, 4, CYAN);

  image.print(labelFont, 286, 258, "SALDO");
  image.print(
    balanceFont,
    286,
    280,
    `${BOT_CONFIG.MONEY_SYMBOL}${formatNumber(balance)}`,
  );
  image.print(
    titleFont,
    88,
    344,
    `${BOT_CONFIG.MONEY_NAME.toUpperCase()}  /  ESTADISTICAS`,
  );

  drawPanel(image, 88, 372, 405, 86, 0x1b2a40ff);
  drawPanel(image, 507, 372, 405, 86, 0x1b2a40ff);
  image.print(labelFont, 112, 382, "EXPERIENCIA");
  image.print(valueFont, 112, 407, formatNumber(xp));
  image.print(labelFont, 531, 382, "NIVEL");
  image.print(valueFont, 531, 407, formatNumber(level));

  image.print(titleFont, 88, 472, `LIGHTWEIGHT WABOT  /  ${BOT_CONFIG.CREATOR_NAME}`);
  image.print(titleFont, 836, 472, "BALCARD");

  return image.getBufferAsync(Jimp.MIME_PNG);
}

module.exports = {
  tags: ["games"],
  cmd: ["balcard", "balancecard"],
  help: ["balcard"],
  exec: async (m, Moody) => {
    const who = m.quoted
      ? m.quoted.sender
      : m.mentionedJid && m.mentionedJid[0]
        ? m.mentionedJid[0]
        : m.sender;
    const userInfo = await Users.get(who);
    const group = await groupManage.get(m.chat);
    const username = await Moody.getName(who);

    if (!m.isGroup) return m.reply(MSG.groupMsg);
    if (!group?.games) {
      return m.reply("*🚩 Los minijuegos fueron desactivados en este grupo.*");
    }
    if (!userInfo) {
      return m.reply(`*🚩 ${username} no está registrado en mi base de datos.*`);
    }

    let avatarBuffer;
    try {
      const avatarUrl = await Moody.profilePictureUrl(who, "image");
      const response = await axios.get(avatarUrl, {
        responseType: "arraybuffer",
        timeout: 10000,
      });
      avatarBuffer = response.data;
    } catch (error) {
      console.warn(
        "[balcard] No se pudo cargar la foto de perfil; se usará un avatar con iniciales:",
        error.message || error,
      );
    }

    const card = await createBalanceCard({
      username,
      number: who.split("@")[0].slice(0, 4),
      balance: userInfo.balance,
      xp: userInfo.xp,
      level: userInfo.level,
      avatarBuffer,
    });

    return Moody.sendMessage(
      m.chat,
      { image: card, caption: `Tarjeta de saldo de ${username || "Jugador"}` },
      { quoted: m },
    );
  },
};
