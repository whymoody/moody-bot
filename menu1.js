const path = require('path');

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

let BOT_CONFIG = {};
try {
  const cfg = require("../../../utils/config.json");
  BOT_CONFIG = cfg.BOT_CONFIG || cfg;
} catch {}

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

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
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
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
  return [plugin.tags];
}

function getSaludo(senderJid) {
  try {
    const timeInfo = getTimeByJid(senderJid);
    const hour = (timeInfo && timeInfo.hora24 !== undefined) ? timeInfo.hora24 : 12;

    if (hour >= 0 && hour < 6) return "ʙᴜᴇɴᴀ ᴍᴀᴅʀᴜɢᴀᴅᴀ 🌙";
    if (hour >= 6 && hour < 12) return "ʙᴜᴇɴᴏꜱ ᴅíᴀꜱ 🌄";
    if (hour >= 12 && hour < 19) return "ʙᴜᴇɴᴀꜱ ᴛᴀʀᴅᴇꜱ 🌅";
    return "ʙᴜᴇɴᴀꜱ ɴᴏᴄʜᴇꜱ 🌃";
  } catch {
    return "ʜᴏʟᴀ";
  }
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
      const mentionJid =
        m.key?.senderPn ||
        m.key?.participantPn ||
        m.key?.participantAlt ||
        m.sender ||
        m.key?.participant ||
        phoneJid;

      const country = getCountryInfo(phoneJid);
      const saludo = getSaludo(phoneJid);
      const device = getDevice(m.key.id) || "Web";
      const runtime = formatRuntime(process.uptime());
      const botMode = getBotMode();

      console.log("========== MENU DEBUG ==========");
      console.log("phoneJid (para país):", phoneJid);
      console.log("country:", country);
      console.log("key:", JSON.stringify(m.key, null, 2));
      console.log("m.sender:", m.sender);
      console.log("================================");

      const before =
        `*${saludo} @${String(mentionJid).split("@")[0]} 🌱*\n\n` +
        `> › *ᴅʙ :* ꜱqʟ\n` +
        `> › *ᴄᴏᴍᴀɴᴅᴏꜱ ᴛᴏᴛᴀʟᴇꜱ :* ${Object.keys(plugins).length}\n` +
        `> › *ᴘᴀíꜱ & ᴅᴇᴠɪᴄᴇ :* ${country.name} ${country.emoji} (${device})\n` +
        `> › *ʀᴜɴᴛɪᴍᴇ :* ${runtime}\n` +
        `> › *ᴘʀᴇғɪx :* \`( ${BOT_PREFIXES.join(", ")} )\`\n` +
        `> › *ᴍᴏᴅᴏ :* ${botMode}\n\n` +
        `${readMore}\n\n` +
        `         \`ʟɪꜱᴛᴀ ᴅᴇ ᴄᴏᴍᴀɴᴅᴏꜱ\` \n\n`;

      const header = (catName) => `\`⿻  ${catName.toUpperCase()}\`\n`;
      const body = "* *%cmd*%opts%args %flags";
      const after = `\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴏᴏᴅʏ\n> ꜱɪ ᴇɴᴄᴜᴇɴᴛʀᴀꜱ ᴇʀʀᴏʀᴇꜱ, ᴀɢʀᴀᴅᴇᴄɪᴅᴏ ᴄᴏɴ ʀᴇᴘᴏʀᴛᴀʀʟᴏ ᴀʟ ᴅᴇꜱᴀʀʀᴏʟʟᴀᴅᴏʀ.`;

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
        }));

      const category = {};
      for (let plugin of help)
        if (plugin && "tags" in plugin)
          for (let tag of plugin.tags) category[tag] = _.capitalize(tag);

      const _text = [
        before,
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
                      body
                        .replace(/%cmd/g, menu.customPrefix ? menu.customPrefix : prefix + toSmallCaps(h))
                        .replace(/%opts/g, menu.opts ? ` ${menu.opts.join(" | ")}` : "")
                        .replace(/%args/g, menu.args ? ` < ${menu.args.join(" ")} >` : "")
                        .replace(/%flags/g, menu.flags ? ` ( --${menu.flags.join(" --")} )` : "")
                        .trim(),
                    )
                    .join("\n"),
                ),
              "",
            ].join("\n")
          );
        }),
        after,
      ].join("\n");

      await Delirius.sendMessage(
        m.chat || m.key.remoteJid,
        { text: _text, mentions: [mentionJid] },
        { quoted: m },
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