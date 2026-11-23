const { BOT_CONFIG, owner: OWNERS } = require("../../../utils/config.json");
const { default: axios } = require("axios");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { ConvertMiles } = require("../../../utils/index");
const settings = require("../../../db/settings");

const execFileAsync = promisify(execFile);

const RESULT_LIMIT = 5;
const FORMAT_KEY = "ytsearch_format";
const LIST_FORMATS = ["list", "lista", "texto"];
const PREVIEW_FORMATS = [
  "preview", "vista", "vistas", "cards", "card", "tarjeta", "tarjetas",
];
const FORMATS = ["list", "preview"];
const FORMAT_LABELS = {
  list: "Lista de texto",
  preview: "Vista previa por video",
};

function normalizeNumber(jid) {
  return String(jid || "").split("@")[0].split(":")[0];
}

function isOwner(m) {
  const sender = normalizeNumber(m.sender || m.key?.participant || m.key?.remoteJid);
  if (!sender) return false;
  return (OWNERS || []).some((owner) => normalizeNumber(owner) === sender);
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "-";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${secs}`
    : `${minutes}:${secs}`;
}

function getVideoLink(entry) {
  if (entry.webpage_url) return entry.webpage_url;
  if (entry.url && /^https?:\/\//i.test(entry.url)) return entry.url;
  return `https://www.youtube.com/watch?v=${entry.id}`;
}

function isVideo(entry) {
  return /^https:\/\/(?:[a-z0-9-]+\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/)|youtu\.be\/)/i.test(
    getVideoLink(entry),
  );
}

function parseEntries(stdout) {
  const entries = [];
  for (const line of String(stdout).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      const entry = JSON.parse(trimmed);
      if (entry && entry.id && entry.title) entries.push(entry);
    } catch {}
  }
  return entries;
}

function buildResultDetails({ index, entry, channel, duration, views }) {
  return (
    `*${index + 1}. ${entry.title}*\n` +
    `◦ Autor: ${channel}\n` +
    `◦ Duración: ${duration} · ${views} vistas\n` +
    `◦ ${getVideoLink(entry)}`
  );
}

function buildFooter(prefix) {
  return `> Descarga con ${prefix}ytdl <enlace> · 🍟 ${BOT_CONFIG.BOT_NAME}`;
}

function getThumbnail(entry) {
  const thumbnails = Array.isArray(entry.thumbnails) ? entry.thumbnails : [];
  const fromList = [...thumbnails].reverse().find((thumb) => thumb?.url)?.url;
  if (fromList) {
    const plain = fromList.split("?")[0].replace(/\.webp$/i, ".jpg");
    if (plain.endsWith(".jpg")) return plain;
  }
  return `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`;
}

async function getSavedFormat(m) {
  try {
    const saved = await settings.get(m.chat, FORMAT_KEY);
    return FORMATS.includes(saved) ? saved : "list";
  } catch (error) {
    return "list";
  }
}

async function saveFormat(m, format) {
  try {
    await settings.set(m.chat, FORMAT_KEY, format);
    return true;
  } catch (error) {
    return false;
  }
}


async function sendResultPreview(m, Moody, { prefix, result, isLast }) {
  const caption =
    buildResultDetails(result) + (isLast ? `\n\n${buildFooter(prefix)}` : "");

  try {
    const response = await axios.get(getThumbnail(result.entry), {
      responseType: "arraybuffer",
      timeout: 15000,
    });
    
    
    const buffer = Buffer.from(response.data);

    
    return await Moody.sendMessage(m.chat, {
      image: buffer,
      mimetype: "image/jpeg",
      caption,
    }, { quoted: m });

  } catch (error) {
    console.error("[ytsearch] Falló la vista previa, se envía solo el texto:", error?.message || error);
    return Moody.sendMessage(m.chat, { text: caption }, { quoted: m });
  }
}

async function searchYouTube(m, Moody, { prefix, cmd, args }) {
  const words = [...args];
  const first = (words[0] || "").toLowerCase();
  const owner = isOwner(m);

  let requested = null;
  if (LIST_FORMATS.includes(first)) requested = "list";
  else if (PREVIEW_FORMATS.includes(first)) requested = "preview";

  if (requested) words.shift();
  const query = words.join(" ").trim();

  if (requested && !query) {
    if (!owner) {
      return m.reply("*🚩 Solo el owner puede cambiar el modo de envío de los resultados.*");
    }
    if (!(await saveFormat(m, requested))) {
      return m.reply("*🚩 No pude guardar el modo ahora. Inténtalo de nuevo más tarde.*");
    }
    return m.reply(
      `*Modo de envío:* ${FORMAT_LABELS[requested]}\n\n` +
        `*◦ Buscar:* ${prefix + cmd} <búsqueda>\n` +
        `*◦ Lista de texto:* ${prefix + cmd} list\n` +
        `*◦ Vista previa:* ${prefix + cmd} preview`,
    );
  }

  if (!query) {
    const saved = await getSavedFormat(m);
    const options = owner
      ? `*◦ Modo lista:* ${prefix + cmd} list\n*◦ Modo vista previa:* ${prefix + cmd} preview`
      : "*◦ Cambiar el modo: solo el owner*";
    return m.reply(
      `*Escribe lo que quieres buscar en YouTube.*\n` +
        `*Ejemplo:* ${prefix + cmd} bad bunny\n\n` +
        `*Modo actual:* ${FORMAT_LABELS[saved]}\n` +
        options,
    );
  }

  const format = requested && owner ? requested : await getSavedFormat(m);
  return searchAndSend(m, Moody, { prefix, query, format });
}

async function searchAndSend(m, Moody, { prefix, query, format }) {
  let stdout;
  try {
    ({ stdout } = await execFileAsync(
      "yt-dlp",
      [
        `ytsearch${RESULT_LIMIT * 2}:${query}`,
        "--flat-playlist",
        "--dump-json",
        "--no-warnings",
        "--ignore-errors",
        "--socket-timeout",
        "15",
      ],
      { timeout: 60000, maxBuffer: 20 * 1024 * 1024 },
    ));
  } catch (error) {
    if (error.code === "ENOENT") {
      return m.reply("*yt-dlp no está instalado en el servidor. Instálalo con:*\n`pip install -U yt-dlp`");
    }
    return m.reply("*No pude buscar en YouTube ahora. Inténtalo de nuevo más tarde.*");
  }

  const entries = parseEntries(stdout).filter(isVideo).slice(0, RESULT_LIMIT);
  if (!entries.length) {
    return m.reply(`*No encontré videos para:* ${query}`);
  }

  const results = entries.map((entry, index) => {
    const channel = entry.channel || entry.uploader || "Desconocido";
    const duration = entry.duration_string || formatDuration(entry.duration);
    const views = ConvertMiles(entry.view_count || 0);
    return { index, entry, channel, duration, views };
  });

  if (format === "preview") {
    await Moody.sendMessage(
      m.chat,
      { text: `*Resultados de YouTube:* ${query}` },
      { quoted: m },
    );

    for (const result of results) {
      await sendResultPreview(m, Moody, {
        prefix,
        result,
        isLast: result.index === results.length - 1,
      });
    }
    return;
  }

  const body = results.map(buildResultDetails).join("\n\n");
  return Moody.sendMessage(
    m.chat,
    {
      text: `*Resultados de YouTube:* ${query}\n\n${body}\n\n${buildFooter(prefix)}`,
    },
    { quoted: m },
  );
}

module.exports = {
  tags: ["search"],
  args: ["texto"],
  cmd: ["ytsearch", "yts", "ytbuscar"],
  help: ["ytsearch"],
  exec: async (m, Moody, context) => searchYouTube(m, Moody, context),
};