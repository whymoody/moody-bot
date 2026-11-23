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
const READ_MORE_SEPARATOR = String.fromCharCode(8206).repeat(4001);
const MAX_THUMBNAIL_BYTES = 60 * 1024;
const SIMPLE_MENU = process.env.MENU_SIMPLE === "1";
const MENU_IMAGE = process.env.MENU_IMAGE !== "0";
const MENU_CARD = process.env.MENU_CARD === "1";
const READ_MORE_ENABLED = process.env.MENU_READMORE === "1";
const MENU_TEST_CATEGORY = null;

async function loadMenuThumbnail() {
  let raw;
  try {
    raw = await fs.promises.readFile(MENU_IMAGE_PATH);
  } catch (error) {
    console.error("[MENU IMAGE] No se pudo leer la imagen local:", error);
    return null;
  }
  if (raw.length <= MAX_THUMBNAIL_BYTES) return raw;
  try {
    const sharp = require("sharp");
    const resized = await sharp(raw)
      .resize({ width: 320, height: 320, fit: "cover", withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
    console.log(
      `[MENU IMAGE] Miniatura reducida de ${raw.length} a ${resized.length} bytes`,
    );
    return resized;
  } catch (error) {
    console.error(
      "[MENU IMAGE] No se pudo reducir la miniatura; se omite la vista previa:",
      error?.message || error,
    );
    return null;
  }
}

function watchDelivery(sock, messageId, timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (!messageId) return resolve({ ok: false, label: "sin id" });
    let done = false;
    const finish = (ok, label) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        sock.ev.off("messages.update", onUpdate);
        sock.ev.off("message-receipt.update", onReceipt);
      } catch {}
      resolve({ ok, label });
    };
    const timer = setTimeout(() => finish(false, "sin acuse aún"), timeoutMs);
    const onUpdate = (updates) => {
      for (const update of updates || []) {
        if (update?.key?.id !== messageId) continue;
        const status = update?.update?.status;
        if (status === undefined) continue;
        if (status === 0) return finish(false, "ERROR (rechazado por WhatsApp)");
        const label =
          status === 2
            ? "aceptado por el servidor"
            : status === 3
              ? "entregado al destinatario"
              : status === 4
                ? "leído"
                : `estado ${status}`;
        finish(true, label);
      }
    };
    const onReceipt = (receipts) => {
      for (const entry of receipts || []) {
        if (entry?.key?.id !== messageId) continue;
        const user = String(entry.receipt?.userJid || "").split("@")[0];
        const who = user ? ` ${user}` : "";
        if (entry.receipt?.readTimestamp)
          return finish(true, `leído por${who || " un miembro"}`);
        if (entry.receipt?.receiptTimestamp)
          return finish(true, `entregado a${who || " un miembro"}`);
      }
    };
    try {
      sock.ev.on("messages.update", onUpdate);
      sock.ev.on("message-receipt.update", onReceipt);
    } catch {
      finish(false, "sin soporte de eventos");
    }
  });
}

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
      const chatJid = m.chat || m.key.remoteJid;
      const chatIsGroup = String(chatJid).endsWith("@g.us");
      const mentionIsPhone = String(mentionJid).endsWith("@s.whatsapp.net");
      const target =
        !chatIsGroup && String(chatJid).endsWith("@lid") && mentionIsPhone
          ? mentionJid
          : chatJid;
      const displayName = mentionIsPhone
        ? `@${mentionNumber}`
        : m.pushName || mentionNumber;
      const country = getCountryInfo(phoneJid);
      const device = getDevice(m.key.id) || "Web";
      const runtime = formatRuntime(process.uptime());
      const botMode = getBotMode();
      const saludo = getSaludo(phoneJid);
      const botName = BOT_CONFIG.BOT_NAME || "ムーディー・ボット";
      const databaseSizes = await getDatabaseSizes();

      const before = (commandCount) =>
        `  ${saludo} ${displayName} 🌱\n` +
        `  ʙɪᴇɴᴠᴇɴɪᴅᴏ ᴀʟ ᴍᴇɴᴜ ᴅᴇ *${toSmallCaps(botName)}*\n` +
        ` *◦ ᴄᴏᴍᴀɴᴅᴏꜱ :* ${commandCount}\n` +
        ` *◦ ᴘʀᴇꜰɪx :* ( ${BOT_PREFIXES.join(" ")} )\n` +
        ` *◦ ᴍᴏᴅᴏ :* ${botMode}\n` +
        ` *◦ ᴘᴀɪꜱ & ᴅᴇᴠɪᴄᴇ :* ${country.name} ${country.emoji} (${device})\n` +
        ` *◦ ʀᴜɴᴛɪᴍᴇ :* ${runtime}\n` +
        `> >ᴅʙ : ꜱqʟɪᴛᴇ (${databaseSizes.sqlite})\n\n` +
        (READ_MORE_ENABLED ? `${READ_MORE_SEPARATOR}\n\n` : "");

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
        ...Object.keys(category)
          .filter((tag) => !MENU_TEST_CATEGORY || tag === MENU_TEST_CATEGORY)
          .map((tag) => {
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

      const thumbnail = MENU_CARD ? await loadMenuThumbnail() : null;

      const menuMessage = { text: _text };
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

      console.log(
        `[MENU] Petición de ${m.sender} en ${chatJid} | mención=${mentionJid} | destino=${target} | imagen=${MENU_IMAGE && !MENU_CARD ? "separada" : "no"} | tarjeta=${thumbnail ? `${thumbnail.length}B` : "no"}`,
      );

      if (MENU_IMAGE && !MENU_CARD && !SIMPLE_MENU) {
        try {
          const imageBuffer = await fs.promises.readFile(MENU_IMAGE_PATH);
          await Delirius.sendMessage(target, { image: imageBuffer }, { quoted: m });
          console.log(
            `[MENU] Imagen del menú enviada a ${target} (${imageBuffer.length}B)`,
          );
        } catch (imageError) {
          console.error(
            "[MENU] No se pudo enviar la imagen del menú:",
            imageError?.message || imageError,
          );
        }
      }

      const attempts = SIMPLE_MENU
        ? [{ label: "texto simple (MENU_SIMPLE)", message: { text: _text }, options: {} }]
        : [
            ...(thumbnail
              ? [{ label: "vista previa", message: menuMessage, options: { quoted: m } }]
              : []),
            { label: "texto sin vista previa", message: { text: _text }, options: { quoted: m } },
            { label: "texto sin cita", message: { text: _text }, options: {} },
          ];

      let sentMessage;
      let lastError;
      let delivered = false;
      for (const attempt of attempts) {
        try {
          sentMessage = await Delirius.sendMessage(
            target,
            attempt.message,
            attempt.options,
          );
        } catch (sendError) {
          lastError = sendError;
          console.error(
            `[MENU] Falló el envío (${attempt.label}) a ${target}:`,
            sendError?.message || sendError,
          );
          continue;
        }
        const messageId = sentMessage?.key?.id;
        console.log(
          `[MENU] Enviado (${attempt.label}) a ${target}; id=${messageId || "sin id"}`,
        );
        const estado = await watchDelivery(Delirius, messageId);
        console.log(`[MENU] Estado del mensaje ${messageId}: ${estado.label}`);
        if (estado.ok) {
          delivered = true;
          break;
        }
        if (!estado.label.startsWith("ERROR")) break;
        console.warn(
          `[MENU] El intento "${attempt.label}" fue rechazado; probando el siguiente formato.`,
        );
      }
      if (!sentMessage) throw lastError || new Error("No se pudo enviar el menú");
      if (!delivered) {
        console.warn(
          "[MENU] WhatsApp no confirmó entrega en 8 s (en grupos el acuse puede tardar más o no llegar si los miembros están sin conexión).",
        );
      }
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