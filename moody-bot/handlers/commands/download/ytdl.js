const { exec } = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { ConvertMiles } = require("../../../utils/index");
const { BOT_CONFIG } = require("../../../utils/config.json");

// En Windows, el archivo .part puede quedar bloqueado un instante después de
// matar a yt-dlp por timeout; reintentamos la eliminación en ese caso.
function rmDirRetry(dir, retries = 5, delay = 1000) {
  fs.rm(dir, { recursive: true, force: true }, (err) => {
    if (!err) return;
    const retryable = ["EBUSY", "EPERM", "ENOTEMPTY"].includes(err.code);
    if (retryable && retries > 0) {
      setTimeout(() => rmDirRetry(dir, retries - 1, delay), delay);
    } else {
      console.error("[YOUTUBE CLEANUP]", err);
    }
  });
}

module.exports = {
  tags: ["download"],
  args: ["url"],
  cmd: ["ytdl", "yt", "youtube", "yutu"],
  help: ["youtube"],
  exec: async (m, Moody, { args }) => {
    const url = args.find(arg => arg.includes("youtube.com") || arg.includes("youtu.be"));
    
    if (!url) return m.reply("*∙ Ingresa un enlace válido de YouTube.*");

    await m.reply("*Obteniendo información y descargando...*");

    const jobDir = path.join(os.tmpdir(), `yt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    fs.mkdirSync(jobDir, { recursive: true });

    const comandoInfo = `yt-dlp --dump-json --no-playlist "${url}"`;

    exec(comandoInfo, { timeout: 60000, maxBuffer: 1024 * 1024 * 20 }, async (err, stdout, stderr) => {
      try {
        if (err) {
          console.error("[YOUTUBE ERR]", err.message);
          return m.reply("No se pudo obtener el video. Asegúrate de que el enlace sea público y válido.");
        }

        let data = null;
        for (const line of (stdout || "").split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("{")) continue;
          try { data = JSON.parse(trimmed); break; } catch {}
        }
        if (!data) throw new Error("No se pudo interpretar la información del video");

        let duracion = "Desconocida";
        if (Number.isFinite(data.duration) && data.duration > 0) {
          const h = Math.floor(data.duration / 3600);
          const min = Math.floor((data.duration % 3600) / 60);
          const seg = Math.floor(data.duration % 60);
          duracion = h > 0
            ? `${h}:${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`
            : `${min}:${String(seg).padStart(2, "0")}`;
        }

        let txtdlauto = `	╭  ✦ YouTube Download ✦  ╮\n
 *◦ Título :* ${data.title || 'Desconocido'}
 *◦ Canal :* ${data.uploader || data.channel || 'Desconocido'}
 *◦ Duración :* ${duracion}
 *◦ Vistas :* ${ConvertMiles(data.view_count || 0)}
 *◦ Likes :* ${ConvertMiles(data.like_count || 0)}\n
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`;

        const outputTemplate = path.join(jobDir, "yt_video.%(ext)s").replace(/\\/g, "/");
        const comandoDescarga = `yt-dlp "${url}" -o "${outputTemplate}" -f "b[height<=720][ext=mp4]/b[height<=720]/bv*[height<=720][ext=mp4]+ba[ext=m4a]/bv*[height<=720]+ba" --no-playlist --retries 3 --fragment-retries 3 --socket-timeout 30`;

        exec(comandoDescarga, { timeout: 600000, maxBuffer: 1024 * 1024 * 20 }, async (errDescarga, stdoutD, stderrD) => {
          try {
            const combined = (stdoutD || "") + (stderrD || "");
            const completa = /\[download\]\s+100%/.test(combined) || /has already been downloaded/i.test(combined);

            const files = fs.existsSync(jobDir)
              ? fs.readdirSync(jobDir).filter(f => f.startsWith("yt_video.") && !f.endsWith(".part"))
              : [];

            if (errDescarga || !completa || files.length === 0) {
              console.error("[YOUTUBE DL]", errDescarga && errDescarga.message, combined.slice(-400));
              return m.reply("Error al descargar el video. Puede que se haya cortado la conexión o que el enlace sea privado.");
            }

            const fileName = files[0];
            const filePath = path.join(jobDir, fileName);
            const sizeMB = fs.statSync(filePath).size / (1024 * 1024);

            if (sizeMB > 64) {
              await Moody.sendMessage(
                m.chat,
                {
                  document: { url: filePath },
                  mimetype: "video/mp4",
                  fileName: fileName,
                  caption: `${txtdlauto}\n\n_Archivo de ${sizeMB.toFixed(1)}MB enviado como documento_`
                },
                { quoted: m }
              );
              return;
            }

            await Moody.sendMessage(
              m.chat,
              {
                video: { url: filePath },
                caption: txtdlauto,
              },
              { quoted: m }
            );

          } catch (sendErr) {
            console.error("[YOUTUBE SEND]", sendErr);
            m.reply("Error al enviar el video.");
          } finally {
            rmDirRetry(jobDir);
          }
        });

      } catch (e) {
        console.error("[YOUTUBE CATCH]", e);
        m.reply(`Error al procesar la información: ${e.message}`);
        rmDirRetry(jobDir);
      }
    });
  },
};