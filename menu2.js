const path = require('path');
const fs = require('fs');

let countryUtils;
try {
    countryUtils = require("../../../utils/country");
} catch {
    try {
        countryUtils = require("../../utils/country");
    } catch {
        try {
            countryUtils = require("../utils/country");
        } catch {
            countryUtils = {
                getCountryInfo: () => ({ name: 'No disponible', emoji: '' }),
                getTimeByJid: () => ({ hora24: 12 })
            };
        }
    }
}

const { getCountryInfo, getTimeByJid } = countryUtils;
const { getDevice } = require("@whiskeysockets/baileys");
const _ = require("lodash");
const BOT_PREFIXES = ["~", "/", ".", "#", "-", "‘", "*", "—"];
const MENU_IMAGE_PATH = path.resolve(__dirname, "../../media/menu.jpg");

let BOT_CONFIG = {};
try {
  const cfg = require("../../utils/config.json");
  BOT_CONFIG = cfg.BOT_CONFIG || cfg;
} catch {}

function toSmallCaps(text) {
  const map = {
    'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ',
    'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'q', 'r': 'ʀ', 's': 'ꜱ', 't': 'ᴛ',
    'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
    'á': 'á', 'é': 'é', 'í': 'í', 'ó': 'ó', 'ú': 'ú', 'ñ': 'ñ'
  };
  return String(text).toLowerCase().split('').map(c => map[c] || c).join('');
}

function formatRuntime(seconds) {
  seconds = Math.floor(seconds);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d} ᴅ`);
  if (h) parts.push(`${h} ʜ`);
  if (m) parts.push(`${m} ᴍ`);
  parts.push(`${s} ꜱ`);
  return parts.join(" ");
}

function formatDataSize(bytes) {
  const megabytes = bytes / (1024 * 1024);
  return megabytes >= 1
    ? `${megabytes.toFixed(1)} ᴍʙ`
    : `${(bytes / 1024).toFixed(1)} ᴋʙ`;
}

async function getDatabaseSizes() {
  const databasePath = path.resolve(__dirname, "../../db/database.db");
  const jsonDataDirectories = [
    path.resolve(__dirname, "../../handlers/commands/gacha/data"),
    path.resolve(__dirname, "../../handlers/commands/games/data"),
  ];
  const jsonDataFiles = [
    path.resolve(__dirname, "../../db/pokedex.json"),
  ];

  for (const directory of jsonDataDirectories) {
    const files = await fs.promises.readdir(directory, { withFileTypes: true });
    jsonDataFiles.push(
      ...files
        .filter((file) => file.isFile() && path.extname(file.name).toLowerCase() === ".json")
        .map((file) => path.join(directory, file.name)),
    );
  }

  const [databaseStat, ...jsonStats] = await Promise.all([
    fs.promises.stat(databasePath),
    ...jsonDataFiles.map((file) => fs.promises.stat(file)),
  ]);

  return {
    sqlite: formatDataSize(databaseStat.size),
    json: formatDataSize(jsonStats.reduce((total, file) => total + file.size, 0)),
  };
}

function getBotMode() {
  const c = BOT_CONFIG;
  const isPrivate =
    c.selfMode === true ||
    c.SELF_MODE === true ||
    c.onlyOwner === true ||
    c.onlyowner === true ||
    c.private === true ||
    c.PRIVATE === true ||
    (typeof c.mode === "string" &&
      ["private", "self", "privado"].includes(c.mode.toLowerCase()));
  return isPrivate ? "ᴘʀɪᴠᴀᴅᴏ" : "ᴘᴜʙʟɪᴄᴏ";
}

function getSaludo(senderJid) {
  try {
    const timeInfo = getTimeByJid(senderJid);
    const hour = timeInfo?.hora24 ?? 12;

    if (hour < 6) return "ʙᴜᴇɴᴀ ᴍᴀᴅʀᴜɢᴀᴅᴀ";
    if (hour < 12) return "ʙᴜᴇɴᴏꜱ ᴅíᴀꜱ";
    if (hour < 19) return "ʙᴜᴇɴᴀꜱ ᴛᴀʀᴅᴇꜱ";
    return "ʙᴜᴇɴᴀꜱ ɴᴏᴄʜᴇꜱ";
  } catch {
    return "ʜᴏʟᴀ";
  }
}

const MENU_CATEGORY_ALIASES = {
  downloads: "download",
  group: "groups",
};

function getMenuHelp(plugin) {
  const tags = Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags];
  const commands = Array.isArray(plugin.cmd) ? plugin.cmd : [];
  if (tags.includes("download") && commands.includes("ytdl")) return ["ytdl"];
  if (tags.includes("download") && Array.isArray(plugin.help) && plugin.help.includes("twitter")) {
    return ["twitter"];
  }
  if (Array.isArray(plugin.help)) return plugin.help;
  if (plugin.help) return [plugin.help];
  if (plugin.desc && Array.isArray(plugin.cmd) && plugin.cmd.length) {
    return [plugin.cmd[0]];
  }
  return [plugin.help];
}

function getMenuTags(plugin) {
  if (Array.isArray(plugin.tags)) return plugin.tags;
  if (plugin.tags) return [plugin.tags];
  if (plugin.category) {
    const category = String(plugin.category);
    return [MENU_CATEGORY_ALIASES[category.toLowerCase()] || category];
  }
  return [];
}

async function resolvePhoneJid(m, sock) {
  const candidates = [
    m.key?.senderPn,
    m.key?.participantPn,
    m.senderPn,
    m.participantPn,
    m.key?.participantAlt,
    m.key?.remoteJidAlt,
    m.participantAlt,
    m.remoteJidAlt,
    m.sender,
    m.key?.participant,
    m.key?.remoteJid,
    m.chat,
  ].filter(Boolean);

  for (const c of candidates) {
    const s = String(c);
    if (s.includes("@s.whatsapp.net") || s.includes("@c.us")) return s;
    if (/^\d{8,15}$/.test(s.split(":")[0])) {
      return s.includes("@") ? s : `${s}@s.whatsapp.net`;
    }
  }

  const lidCandidate = candidates.find((c) => String(c).endsWith("@lid"));
  if (lidCandidate && sock?.signalRepository?.lidMapping?.getPNForLID) {
    try {
      let pn = sock.signalRepository.lidMapping.getPNForLID(lidCandidate);
      if (pn && typeof pn.then === "function") pn = await pn;
      if (pn) {
        const clean = String(pn).split(":")[0];
        return clean.includes("@") ? clean : `${clean}@s.whatsapp.net`;
      }
    } catch (e) {
      console.log("[LID MAP ERROR]", e.message);
    }
  }

  return candidates[0] || m.sender || m.chat;
}

module.exports = {
  cmd: ["menu", "help"],
  help: ["help"],
  exec: async (m, Delirius, { prefix, plugins }) => {
    try {
      const phoneJid = await resolvePhoneJid(m, Delirius);
      const mentionJid = phoneJid || m.sender;
      const mentionNumber = String(mentionJid).split("@")[0].split(":")[0];
      const country = getCountryInfo(phoneJid);
      const device = getDevice(m.key.id) || "Web";
      const runtime = formatRuntime(process.uptime());
      const botMode = getBotMode();
      const saludo = getSaludo(phoneJid);
      const botName = BOT_CONFIG.BOT_NAME || "ムーディー・ボット";
      const databaseSizes = await getDatabaseSizes();

      const before = (commandCount) =>
        `${saludo} @${mentionNumber} 🌱\n` +
        `  ◦ʙɪᴇɴᴠᴇɴɪᴅᴏ ᴀʟ ᴍᴇɴᴜ ᴅᴇ *${toSmallCaps(botName)}*\n` +
        `> >ᴅʙ : ꜱqʟɪᴛᴇ (${databaseSizes.sqlite})\n` +
        ` *◦ ᴄᴏᴍᴀɴᴅᴏꜱ :* ${commandCount}\n` +
        ` *◦ ᴘʀᴇꜰɪx :* ( ${BOT_PREFIXES.join(" ")} )\n` +
        ` *◦ ᴍᴏᴅᴏ :* ${botMode}\n` +
        ` *◦ ᴘᴀɪꜱ & ᴅᴇᴠɪᴄᴇ :* ${country.name} ${country.emoji} (${device})\n` +
        ` *◦ ʀᴜɴᴛɪᴍᴇ :* ${runtime}\n\n`;

      const header = (catName) => `  \`⿻ ${toSmallCaps(catName)}\`\n`;
      const after = `\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${toSmallCaps(botName)}\n> ꜱɪ ᴇɴᴄᴜᴇɴᴛʀᴀꜱ ᴇʀʀᴏʀᴇꜱ, ᴀɢʀᴀᴅᴇᴄɪᴅᴏ ᴄᴏɴ ʀᴇᴘᴏʀᴛᴀʀʟᴏ ᴀʟ ᴅᴇꜱᴀʀʀᴏʟʟᴀᴅᴏʀ.`;

      const help = Object.values(plugins)
        .filter(
          (plugin) =>
            (!plugin.disabled && (plugin.help || (plugin.desc && plugin.cmd))) ||
            plugin.regex ||
            plugin.startsWith,
        )
        .map((x) => ({
          help: getMenuHelp(x),
          tags: getMenuTags(x),
          links: x.link !== "undefined" ? x.link : "",
          customPrefix: x.startsWith ? x.startsWith : "",
          opts: x.opts,
          args: x.args,
          flags: x.flags,
        }))
        .filter((menu) => menu.tags.length > 0);
      const commandCount = new Set(
        help.flatMap((menu) => menu.help || []).filter(Boolean).map((command) => String(command).toLowerCase()),
      ).size;

      const category = {};
      for (let plugin of help)
        if (plugin && "tags" in plugin)
          for (let tag of plugin.tags) category[tag] = _.capitalize(tag);

      const _text = [
        before(commandCount),
        ...Object.keys(category).map((tag) => {
          return (
            header(category[tag]) +
            "\n" +
            [
              ...help
                .filter(
                  (a) => a.tags && a.tags.includes(tag) && a.help,
                )
                .sort((a, b) => a.help[0].localeCompare(b.help[0]))
                .map((menu) =>
                  menu.help
                    .map((h) =>
                      ` *◦  ${menu.customPrefix ? menu.customPrefix : (prefix || ".") + toSmallCaps(h)}` +
                      `${menu.opts ? ` ${menu.opts.join(" | ")}` : ""}` +
                      `${menu.args ? ` « ${menu.args.join(" ")} »` : ""}` +
                      `${menu.flags ? ` ( --${menu.flags.join(" --")} )` : ""}*`,
                    )
                    .join("\n"),
                ),
              "",
            ].join("\n")
          );
        }),
        after,
      ].join("\n");

      let thumbnail;
      try {
        thumbnail = await fs.promises.readFile(MENU_IMAGE_PATH);
      } catch (error) {
        console.error("[MENU IMAGE] No se pudo leer la imagen local:", error);
      }

      const menuMessage = { text: _text, mentions: [mentionJid] };
      if (thumbnail) {
        menuMessage.contextInfo = {
          externalAdReply: {
            title: botName,
            body: "Menú de comandos",
            mediaType: 1,
            thumbnail,
            renderLargerThumbnail: true,
            showAdAttribution: false,
          },
        };
      }

      const sentMessage = await Delirius.sendMessage(
        m.chat || m.key.remoteJid,
        menuMessage,
        { quoted: m },
      );
      console.log(
        `[MENU] Envío solicitado a ${m.chat || m.key.remoteJid}; id=${sentMessage?.key?.id || "sin id"}`,
      );
    } catch (error) {
      console.error("[MENU ERROR]", error);
      try {
        await m.reply(`Error en el menú: ${error.message}`);
      } catch (e) {
        console.error("No se pudo ni responder el error:", e);
      }
    }
  },
};