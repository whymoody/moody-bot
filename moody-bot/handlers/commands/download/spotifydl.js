const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = {
  cmd: ["spotifydl", "spdl"],
  desc: "Descarga una canción de Spotify.",
  tags: ["download"],
  owner: false,
  exec: async (m, sock, { args, prefix, cmd }) => {
    const jid = m.chat || m.key.remoteJid;

    const input = args.join(" ").trim();
    if (!input) {
      return sock.sendMessage(jid, { text: `🎵 *Uso:* ${prefix}${cmd} <link de Spotify>` }, { quoted: m });
    }

    await sock.sendMessage(jid, { text: "Descargando..." }, { quoted: m });

    const tempDir = path.resolve("./temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputTemplate = path.join(tempDir, "%(title)s.%(ext)s").replace(/\\/g, "/");
    
    const comando = `spotdl "${input}" --output "${outputTemplate}" --format mp3 --overwrite force`;

    exec(comando, { timeout: 180000 }, async (err, stdout, stderr) => {
      try {
        if (stdout) console.log("SALIDA DE SPOTDL:", stdout);

        await new Promise(resolve => setTimeout(resolve, 2000));

        const buscarMP3 = (dir) => {
            let results = [];
            const list = fs.readdirSync(dir);
            list.forEach(file => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat && stat.isDirectory()) {
                    results = results.concat(buscarMP3(fullPath)); 
                } else if (file.toLowerCase().endsWith(".mp3")) {
                    results.push(fullPath);
                }
            });
            return results;
        };

        const archivosEncontrados = buscarMP3(tempDir);

        if (archivosEncontrados.length === 0) {
          return sock.sendMessage(jid, { text: `No se encontró ningún archivo MP3.` }, { quoted: m });
        }

        const fileToSend = archivosEncontrados.map(f => {
            return { path: f, time: fs.statSync(f).mtime.getTime() };
        }).sort((a, b) => b.time - a.time)[0].path;

        const sizeMB = fs.statSync(fileToSend).size / (1024 * 1024);

        if (sizeMB > 64) {
          fs.unlinkSync(fileToSend);
          return sock.sendMessage(jid, { text: `El archivo pesa ${sizeMB.toFixed(1)}MB, demasiado grande.` }, { quoted: m });
        }

        await sock.sendMessage(
          jid,
          { audio: { url: fileToSend }, mimetype: "audio/mp4", fileName: path.basename(fileToSend) },
          { quoted: m }
        );

        await sock.sendMessage(jid, { text: `Descargado con éxito` }, { quoted: m });

        fs.unlinkSync(fileToSend);
        
      } catch (e) {
        console.error("[SPOTIFY CATCH]", e);
        sock.sendMessage(jid, { text: `Error interno: ${e.message}` }, { quoted: m });
      }
    });
  },
};