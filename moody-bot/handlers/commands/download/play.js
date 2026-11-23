const { exec } = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

// Reintenta la limpieza si Windows mantiene bloqueado el archivo temporal
// justo después de detener yt-dlp.
function rmDirRetry(dir, retries = 5, delay = 1000) {
  fs.rm(dir, { recursive: true, force: true }, (err) => {
    if (!err) return;
    const retryable = ["EBUSY", "EPERM", "ENOTEMPTY"].includes(err.code);
    if (retryable && retries > 0) {
      setTimeout(() => rmDirRetry(dir, retries - 1, delay), delay);
    } else {
      console.error("[PLAY CLEANUP]", err);
    }
  });
}

module.exports = {
  tags: ["download"],
  args: ["query"],
  cmd: ["play"],
  help: ["play <nombre de canción o artista>"],
  exec: async (m, Moody, { args }) => {
    const query = args.join(" ").trim();
    if (!query) {
      return m.reply("*∙ Ingresa el nombre de la canción o artista.*\n_Ej: .play Bad Bunny Monaco_");
    }

    const jobDir = path.join(os.tmpdir(), `play-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    fs.mkdirSync(jobDir, { recursive: true });

    try {
      // 1️⃣ Buscar en YouTube
      const resultado = await yts(query);
      const video = resultado.videos?.[0];

      if (!video) {
        throw new Error("No se encontraron resultados en YouTube.");
      }

      const videoUrl = video.url;
      const titulo = video.title;
      const canal = video.author?.name || "Desconocido";
      const duracion = video.timestamp || "N/D";

      // 2️⃣ Descargar audio con yt-dlp (incrusta portada y metadatos: título, artista, álbum)
      // Usamos un nombre de archivo controlado para evitar problemas con caracteres especiales.
      const outputTemplate = path.join(jobDir, "audio.%(ext)s").replace(/\\/g, "/");
      const comando = `yt-dlp -x --audio-format mp3 --audio-quality 0 --embed-thumbnail --embed-metadata --no-playlist --retries 3 --socket-timeout 30 -o "${outputTemplate}" "${videoUrl}"`;

      let errorYt = null;
      await new Promise((resolve) => {
        exec(comando, { timeout: 600000, maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
          if (err) errorYt = stderr || err.message;
          resolve();
        });
      });

      if (errorYt) {
        console.error("[PLAY] Error de yt-dlp:", errorYt);
      }

      // Buscar el archivo MP3 generado
      let archivoAudio = null;
      const archivos = fs.readdirSync(jobDir);
      for (const file of archivos) {
        if (file.endsWith(".mp3")) {
          archivoAudio = path.join(jobDir, file);
          break;
        }
      }

      if (!archivoAudio || !fs.existsSync(archivoAudio)) {
        throw new Error("No se pudo descargar el audio. Verifica que yt-dlp y ffmpeg estén instalados correctamente.");
      }

      // 3️⃣ Enviar primero el audio y después la portada con la información
      const sizeMB = fs.statSync(archivoAudio).size / (1024 * 1024);
      const buffer = fs.readFileSync(archivoAudio);
      const caption = `🎵 *${titulo}*\n*◦ Artista:* ${canal}\n*◦ Duración:* ${duracion}`;

      // Descargar la portada antes de enviar
      let portada = null;
      try {
        const thumbUrl = video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
        const thumbRes = await axios.get(thumbUrl, { responseType: "arraybuffer", timeout: 30000 });
        portada = Buffer.from(thumbRes.data);
      } catch (thumbErr) {
        console.warn("[PLAY] No se pudo descargar la portada:", thumbErr.message);
      }

      // 1) Audio primero
      if (sizeMB > 16) {
        await Moody.sendMessage(m.chat, {
          document: buffer,
          mimetype: "audio/mpeg",
          fileName: `${titulo.replace(/[^\w\s-]/g, "").slice(0, 60)}.mp3`,
        }, { quoted: m });
      } else {
        await Moody.sendMessage(m.chat, {
          audio: buffer,
          mimetype: "audio/mpeg",
          ptt: false,
        }, { quoted: m });
      }

      // 2) Después la portada con la información
      if (portada) {
        await Moody.sendMessage(m.chat, { image: portada, caption }, { quoted: m });
      } else {
        await m.reply(caption).catch(() => {});
      }
      
    } catch (e) {
      console.error("[PLAY]", e);
      await m.reply(`❌ No se pudo reproducir la música.\n\n_${e.message}_`).catch(() => {});
    } finally {
      // Limpiar archivos temporales
      rmDirRetry(jobDir);
    }
  },
};