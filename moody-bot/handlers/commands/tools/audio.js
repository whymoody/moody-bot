const fs = require("fs");
const path = require("path");

const AUDIO_DIR = path.join(__dirname, "../../../media/audio");
const MAX_AUDIO_BYTES = 16 * 1024 * 1024;
const LIST_LIMIT = 20;
const MATCH_LIMIT = 10;

const AUDIO_MIMETYPES = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".opus": "audio/opus",
};

function normalize(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getBaseName(fileName) {
  return path.basename(fileName, path.extname(fileName));
}

async function listAudioFiles() {
  let entries;
  try {
    entries = await fs.promises.readdir(AUDIO_DIR, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        AUDIO_MIMETYPES[path.extname(entry.name).toLowerCase()],
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "es"));
}

module.exports = {
  tags: ["tools"],
  args: ["nombre"],
  cmd: ["audio", "musica"],
  help: ["audio"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    let files;
    try {
      files = await listAudioFiles();
    } catch (error) {
      console.error("[audio] No se pudo leer la carpeta:", error);
      return m.reply("*🚩 No pude leer la carpeta de audio.*");
    }

    if (!files.length) {
      return m.reply(
        "*🚩 No hay archivos de audio disponibles.*\n\nAgrega tus canciones en `media/audio` y vuelve a intentarlo.",
      );
    }

    const query = args.join(" ").trim();
    if (!query || normalize(query) === "lista") {
      const items = files
        .slice(0, LIST_LIMIT)
        .map((file, index) => `${index + 1}. ${getBaseName(file)}`);
      const extra =
        files.length > LIST_LIMIT
          ? `\n\n_... y ${files.length - LIST_LIMIT} más._`
          : "";
      return m.reply(
        `*🎵 Audio disponible:*\n\n${items.join("\n")}${extra}\n\n*Envía uno con:* ${prefix + cmd} nombre`,
      );
    }

    const normalizedQuery = normalize(query);
    const byFileName = files.find(
      (file) => normalize(file) === normalizedQuery,
    );
    const byBaseName = files.find(
      (file) => normalize(getBaseName(file)) === normalizedQuery,
    );
    const matches = files.filter((file) =>
      normalize(getBaseName(file)).includes(normalizedQuery),
    );
    const selected =
      byFileName || byBaseName || (matches.length === 1 ? matches[0] : null);

    if (!selected) {
      if (!matches.length) {
        return m.reply(
          `*🚩 No encontré audio que coincida con "${query}".* Usa ${prefix + cmd} para ver los disponibles.`,
        );
      }

      const options = matches
        .slice(0, MATCH_LIMIT)
        .map((file) => `◦ ${getBaseName(file)}`);
      const extra =
        matches.length > MATCH_LIMIT
          ? `\n_... y ${matches.length - MATCH_LIMIT} más._`
          : "";
      return m.reply(
        `*🎵 Varias coincidencias:*\n\n${options.join("\n")}${extra}\n\n*Sé más específico:* ${prefix + cmd} nombre completo`,
      );
    }

    const filePath = path.join(AUDIO_DIR, selected);
    let stats;
    try {
      stats = await fs.promises.stat(filePath);
    } catch (error) {
      console.error("[audio] No se pudo leer el archivo:", error);
      return m.reply("*🚩 No pude leer ese archivo de audio.*");
    }

    if (stats.size > MAX_AUDIO_BYTES) {
      return m.reply(
        `*🚩 "${getBaseName(selected)}" pesa ${(stats.size / (1024 * 1024)).toFixed(1)} MB y supera el límite de 16 MB para audio en WhatsApp.*`,
      );
    }

    try {
      const audio = await fs.promises.readFile(filePath);
      await Moody.sendMessage(
        m.chat,
        {
          audio,
          mimetype: AUDIO_MIMETYPES[path.extname(selected).toLowerCase()],
          fileName: selected,
          ptt: false,
        },
        { quoted: m },
      );
    } catch (error) {
      console.error("[audio] No se pudo enviar el archivo:", error);
      return m.reply("*🚩 No pude enviar ese archivo de audio.*");
    }
  },
};
