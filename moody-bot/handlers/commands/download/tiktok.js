const { exec } = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { ConvertMiles } = require("../../../utils/index");
const { BOT_CONFIG } = require("../../../utils/config.json");

module.exports = {
  tags: ["download"],
  args: ["url"],
  cmd: ["tiktok", "tt", "tiktokdl"],
  help: ["tiktok"],
  exec: async (m, Moody, { args }) => {
    const url = args.find(arg => arg.includes("tiktok.com"));
    if (!url) return m.reply("*∙ Ingresa un enlace válido de TikTok.*");

    await m.reply("*Obteniendo información y descargando...*");

    const jobDir = path.join(os.tmpdir(), `tt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    fs.mkdirSync(jobDir, { recursive: true });

    const comandoInfo = `yt-dlp --dump-json --no-playlist "${url}"`;

    exec(comandoInfo, { timeout: 60000, maxBuffer: 1024 * 1024 * 10 }, async (errInfo, stdoutInfo, stderrInfo) => {
      let data = null;
      let esFoto = false;

      if (!errInfo) {
        for (const line of stdoutInfo.split("\n")) {
          try {
            const parsed = JSON.parse(line.trim());
            if (parsed) { data = parsed; break; }
          } catch (_) {}
        }
      }

      if (errInfo || !data) {
        const errorMsg = (stderrInfo || errInfo?.message || "").toLowerCase();
        if (errorMsg.includes("unsupported url") || errorMsg.includes("no video formats found")) {
          esFoto = true;
          console.log("[TIKTOK] Post de fotos detectado. yt-dlp no lo soporta, usando gallery-dl...");
        } else {
          console.error("[TIKTOK INFO ERR]", stderrInfo || errInfo?.message);
          fs.rm(jobDir, { recursive: true, force: true }, () => {});
          return m.reply("No se pudo obtener el video. Asegúrate de que el enlace sea público.");
        }
      }

      let txtdlauto = null;
      if (data) {
        let duracion = "0s";
        if (Number.isFinite(data.duration) && data.duration > 0) {
          const min = Math.floor(data.duration / 60);
          const seg = Math.floor(data.duration % 60);
          duracion = min > 0 ? `${min}m ${seg}s` : `${seg}s`;
        }

        txtdlauto = `	╭  ✦ TikTok Download ✦  ╮\n
 *◦ Nombre :* ${data.uploader || 'Desconocido'}
 *◦ Usuario :* @${data.uploader_id || 'Desconocido'}
 *◦ Duración :* ${duracion}
 *◦ Reproducido :* ${ConvertMiles(data.view_count || 0)}
 *◦ Likes :* ${ConvertMiles(data.like_count || 0)}
 *◦ Comentarios :* ${ConvertMiles(data.comment_count || 0)}
 *◦ Compartido :* ${ConvertMiles(data.repost_count || 0)}\n
	╭  ✦ Music Info ✦  ╮\n
 *◦ Música :* ${data.track || 'Original Sound'}\n
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`;
      }

      if (esFoto) {
        await ejecutarGalleryDl(url, jobDir, m, Moody, txtdlauto);
      } else {
        await ejecutarYtDlpDescarga(url, jobDir, m, Moody, txtdlauto);
      }
    });
  },
};

async function ejecutarYtDlpDescarga(url, jobDir, m, Moody, caption) {
  const outputTemplate = path.join(jobDir, "tt_media_%(id)s_%(autonumber)s.%(ext)s").replace(/\\/g, "/");
  const comandoDescarga = `yt-dlp "${url}" -o "${outputTemplate}" --no-playlist --retries 3 --fragment-retries 3`;

  try {
    await new Promise((resolve, reject) => {
      exec(comandoDescarga, { timeout: 120000, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
        if (err) {
          const combined = (stdout || "") + (stderr || "");
          const completa = /\[download\]\s+100%/.test(combined) || /has already been downloaded/i.test(combined);
          if (err || !completa) {
            console.error("[TIKTOK DL]", err?.message, combined.slice(-400));
            return reject(new Error("Error al descargar el video."));
          }
        }
        resolve();
      });
    });

    const files = fs.existsSync(jobDir)
      ? fs.readdirSync(jobDir).filter(f => f.startsWith("tt_media_") && !f.endsWith(".part"))
      : [];

    if (files.length === 0) throw new Error("No se generó ningún archivo.");

    for (const fileName of files) {
      const filePath = path.join(jobDir, fileName);
      await enviarArchivo(filePath, caption || "*Video descargado*", m, Moody);
    }
  } catch (e) {
    console.error("[TIKTOK YTDLP]", e);
    m.reply(`${e.message}`);
  } finally {
    fs.rm(jobDir, { recursive: true, force: true }, () => {});
  }
}

async function ejecutarGalleryDl(url, jobDir, m, Moody, captionBase) {
  const cookiesPath = "C:/moody/cookies/tiktok-cookies.txt";
  const cookiesFlag = fs.existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : "";

  const comandoGallery = `gallery-dl ${cookiesFlag} -d "${jobDir.replace(/\\/g, "/")}" -o "directory=[]" -o "filename={num}.{extension}" "${url}"`;

  try {
    await new Promise((resolve) => {
      exec(comandoGallery, { timeout: 120000, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
        if (stdout) console.log("SALIDA DE GALLERY-DL:", stdout);
        if (err) console.error("ERROR DE GALLERY-DL:", err.message);
        if (stderr) console.error("STDERR DE GALLERY-DL:", stderr);
        resolve();
      });
    });

    const files = listarArchivos(jobDir);
    if (files.length === 0) {
      return m.reply("No se pudieron descargar las imágenes. El post puede ser privado o requerir cookies.");
    }

    const caption = captionBase || `	╭  ✦ TikTok Download ✦  ╮\n\n *◦ Tipo :* Post de fotos\n *◦ Archivos :* ${files.length}\n\n> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`;

    for (const filePath of files) {
      await enviarArchivo(filePath, caption, m, Moody);
    }
  } catch (e) {
    console.error("[TIKTOK GALLERY]", e);
    m.reply(`Error al descargar las fotos: ${e.message}`);
  } finally {
    fs.rm(jobDir, { recursive: true, force: true }, () => {});
  }
}

async function enviarArchivo(filePath, caption, m, Moody) {
  const fileName = path.basename(filePath);
  try {
    const buffer = fs.readFileSync(filePath);
    const sizeMB = buffer.length / (1024 * 1024);
    const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(fileName);
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(fileName);
    if (!isVideo && !isImage) return;

    if (sizeMB > 64) {
      const lower = fileName.toLowerCase();
      let docMimetype = "application/octet-stream";
      if (lower.endsWith(".mp4")) docMimetype = "video/mp4";
      else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) docMimetype = "image/jpeg";
      else if (lower.endsWith(".webp")) docMimetype = "image/webp";
      else if (lower.endsWith(".png")) docMimetype = "image/png";

      await Moody.sendMessage(m.chat, {
        document: buffer,
        mimetype: docMimetype,
        fileName: fileName,
        caption: `${caption}\n\n_Archivo de ${sizeMB.toFixed(1)}MB enviado como documento_`
      }, { quoted: m });
    } else if (isVideo) {
      await Moody.sendMessage(m.chat, { video: buffer, caption }, { quoted: m });
    } else {
      await Moody.sendMessage(m.chat, { image: buffer, caption }, { quoted: m });
    }
  } catch (e) {
    console.error(`[TIKTOK SEND FAIL] ${fileName}:`, e.message);
  }
}

function listarArchivos(dir) {
  const resultados = [];
  const extValidas = /\.(mp4|mov|webm|mkv|jpg|jpeg|png|webp)$/i;

  function walk(current) {
    let items;
    try { items = fs.readdirSync(current, { withFileTypes: true }); } catch (_) { return; }
    for (const item of items) {
      const full = path.join(current, item.name);
      if (item.isDirectory()) walk(full);
      else if (extValidas.test(item.name) && !item.name.endsWith(".part")) resultados.push(full);
    }
  }
  walk(dir);
  return resultados;
}