const { BOT_CONFIG } = require("../../../utils/config.json");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { ConvertMiles } = require("../../../utils/index");
const axios = require("axios");

const execFileAsync = promisify(execFile);

async function stalkChannel(m, Moody, { prefix, cmd, args }) {
  if (args.length < 1) return m.reply(`*Ejemplo :* ${prefix + cmd} MrBeast`);
  
  const query = args.join(" ");
  await m.reply(`*Buscando canal:* ${query}...`);

  try {
    const { stdout: searchStdout } = await execFileAsync(
      "yt-dlp",
      [
        `ytsearch1:${query}`,
        "--flat-playlist",
        "--dump-single-json",
        "--no-warnings",
        "--socket-timeout", "15"
      ],
      { timeout: 60000, maxBuffer: 20 * 1024 * 1024 }
    );

    const searchData = JSON.parse(searchStdout);
    const entry = searchData.entries?.[0];
    if (!entry) throw new Error("No se encontraron resultados para esa búsqueda.");

    const channelUrl = entry.channel_url || entry.uploader_url;
    if (!channelUrl) throw new Error("No se pudo obtener la URL del canal desde el video.");

    const { stdout: channelStdout } = await execFileAsync(
      "yt-dlp",
      [
        `--dump-single-json`,
        "--playlist-items", "1",
        "--no-warnings",
        "--socket-timeout", "15",
        channelUrl
      ],
      { timeout: 60000, maxBuffer: 20 * 1024 * 1024 }
    );

    const channelData = JSON.parse(channelStdout);
    
    const thumbnails = channelData.thumbnails || entry.thumbnails || [];
    const bestThumb = thumbnails[thumbnails.length - 1]?.url;
    
    let imageBuffer = null;
    if (bestThumb) {
      try {
        const imgRes = await axios.get(bestThumb, { responseType: "arraybuffer", timeout: 10000 });
        imageBuffer = Buffer.from(imgRes.data);
      } catch (e) {
        console.error("[ytstalk] No se pudo descargar la miniatura:", e.message);
      }
    }

    const isSafe = channelData.age_limit === 0 || channelData.age_limit === undefined ? "Sí" : "No";
    const youtube_stalkk = `	*╭  ✦ Youtube Stalk ✦  ╮*\n
 *◦ Canal :* ${channelData.channel || channelData.uploader || "Desconocido"}
 *◦ Username :* ${channelData.uploader_id || channelData.channel_id || "-"}
 *◦ Suscriptores :* ${ConvertMiles(channelData.channel_follower_count || 0)}
 *◦ Videos :* ${channelData.playlist_count || "N/A"}
 *◦ Enlace :* ${channelData.channel_url || channelUrl}
 *◦ isFamilySafe :* ${isSafe}
 *◦ Descripcion :* ${(channelData.description || "Sin descripción").slice(0, 200)}...\n
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`;

    if (imageBuffer) {
      await Moody.sendMessage(m.chat, { image: imageBuffer, caption: youtube_stalkk }, { quoted: m });
    } else {
      await Moody.sendMessage(m.chat, { text: youtube_stalkk }, { quoted: m });
    }

  } catch (error) {
    console.error("[youtubestalk] Falló la consulta:", error.message || error);
    return m.reply("*No pude consultar ese canal ahora. Asegúrate de que el nombre sea correcto o inténtalo más tarde.*");
  }
}

module.exports = {
  tags: ["stalk"],
  args: ["texto"],
  cmd: ["youtubestalk", "ytstalk"],
  help: ["youtubestalk"],
  exec: async (m, Moody, context) => stalkChannel(m, Moody, context),
};