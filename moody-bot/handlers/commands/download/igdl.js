const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  cmd: ["ig","instagram"],
  desc: "Descarga videos o fotos de Instagram.",
  tags: ["download"],
  exec: async (m, sock, { args, prefix, cmd }) => {
    const jid = m.chat || m.key.remoteJid;

    const url = args.find(arg => arg.includes("instagram.com"));
    if (!url) {
      return sock.sendMessage(jid, { 
        text: `*Uso:* ${prefix}${cmd} <link de Instagram>\n\n*Ejemplo:*\n${prefix}${cmd} https://www.instagram.com/p/...` 
      }, { quoted: m });
    }

    await sock.sendMessage(jid, { text: "*Descargando contenido de Instagram*" }, { quoted: m });

    const tempRoot = path.resolve("./temp");
    if (!fs.existsSync(tempRoot)) fs.mkdirSync(tempRoot, { recursive: true });

    const jobDir = path.join(tempRoot, `ig_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
    fs.mkdirSync(jobDir, { recursive: true });

    const outputTemplate = path.join(jobDir, "ig_media_%(id)s_%(autonumber)s.%(ext)s").replace(/\\/g, "/");
    const comando = `yt-dlp "${url}" -o "${outputTemplate}"`;

    exec(comando, { timeout: 180000 }, async (err, stdout, stderr) => {
      try {
        if (stdout) console.log("SALIDA DE YT-DLP:", stdout);
        await sleep(2000); // Pausa inicial

        let archivos = listarArchivos(jobDir);

        const necesitaFallback =
          (stderr && stderr.includes("No video formats found")) || archivos.length === 0;

        if (necesitaFallback) {
          console.log("[INSTAGRAM] Ejecutando fallback con gallery-dl (cookies.txt)...");
          const cookiesPath = "C:/moody/cookies/instagram-cookies.txt";

          if (!fs.existsSync(cookiesPath)) {
            console.error("[INSTAGRAM] No existe el archivo de cookies:", cookiesPath);
            return sock.sendMessage(jid, {
              text: "No se pudo descargar. Este post parece ser un carrusel de imágenes y falta el archivo de cookies del bot."
            }, { quoted: m });
          }

          const comandoGallery = `gallery-dl --cookies "${cookiesPath}" -d "${jobDir.replace(/\\/g, "/")}" -o "directory=[]" -o "filename={num}.{extension}" "${url}"`;

          await new Promise((resolve) => {
            exec(comandoGallery, { timeout: 180000, maxBuffer: 1024 * 1024 * 10 }, (errG, stdoutG, stderrG) => {
              if (stdoutG) console.log("SALIDA DE GALLERY-DL:", stdoutG);
              if (errG) console.error("ERROR DE GALLERY-DL:", errG.message);
              if (stderrG) console.error("STDERR DE GALLERY-DL:", stderrG);
              resolve();
            });
          });

          archivos = listarArchivos(jobDir);
        }

        if (archivos.length === 0) {
          if (stderr) console.error("ERROR DE YT-DLP:", stderr);
          return sock.sendMessage(jid, {
            text: `No se pudo descargar. Asegúrate de que el enlace sea público.`
          }, { quoted: m });
        }

        console.log(`[INSTAGRAM] Archivos a enviar: ${archivos.length}`);

        for (const filePath of archivos) {
          const fileName = path.basename(filePath);
          try {
            const buffer = fs.readFileSync(filePath);
            const sizeMB = buffer.length / (1024 * 1024);
            const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(fileName);

            if (sizeMB > 64) {
              const lower = fileName.toLowerCase();
              let docMimetype = "application/octet-stream";
              if (lower.endsWith(".mp4")) docMimetype = "video/mp4";
              else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) docMimetype = "image/jpeg";
              else if (lower.endsWith(".webp")) docMimetype = "image/webp";
              else if (lower.endsWith(".png")) docMimetype = "image/png";

              console.log(`[IG SEND] Doc buffer=${buffer.length}B file=${fileName} size=${sizeMB.toFixed(1)}MB`);
              await sock.sendMessage(jid, {
                document: buffer,
                mimetype: docMimetype,
                fileName: fileName,
                caption: `*Archivo descargado (${sizeMB.toFixed(1)}MB)*`
              }, { quoted: m });
              console.log(`[IG SEND] Doc enviado OK: ${fileName}`);
              
              await sleep(2000); 
              continue;
            }

            if (isVideo) {
              console.log(`[IG SEND] Video buffer=${buffer.length}B file=${fileName}`);
              await sock.sendMessage(jid, {
                video: buffer,
                mimetype: "video/mp4",
                fileName: fileName,
                caption: "*Video descargado*"
              }, { quoted: m });
              console.log(`[IG SEND] Video enviado OK: ${fileName}`);
            } else {
              console.log(`[IG SEND] Imagen buffer=${buffer.length}B file=${fileName}`);
              await sock.sendMessage(jid, {
                image: buffer,
                caption: "*Imagen descargada*"
              }, { quoted: m });
              console.log(`[IG SEND] Imagen enviada OK: ${fileName}`);
            }
            
            
            await sleep(2000); 
            
          } catch (sendErr) {
            console.error(`[IG SEND FAIL] ${fileName}:`, sendErr.stack || sendErr.message);
          }
        }

        console.log("[INSTAGRAM] Todos los envíos completados");

      } catch (e) {
        console.error("[INSTAGRAM CATCH]", e);
        sock.sendMessage(jid, { text: `Error interno: ${e.message}` }, { quoted: m });
      } finally {
        
        fs.rm(jobDir, { recursive: true, force: true }, (cleanupErr) => {
          if (cleanupErr) console.error("[INSTAGRAM CLEANUP]", cleanupErr);
        });
      }
    });
  },
};

function listarArchivos(dir) {
  const resultados = [];
  const extValidas = /\.(mp4|mov|webm|mkv|jpg|jpeg|png|webp|gif)$/i;

  function walk(current) {
    let items;
    try {
      items = fs.readdirSync(current, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const item of items) {
      const full = path.join(current, item.name);
      if (item.isDirectory()) {
        walk(full);
      } else if (extValidas.test(item.name) && !item.name.endsWith(".part")) {
        resultados.push(full);
      }
    }
  }

  walk(dir);
  return resultados;
}