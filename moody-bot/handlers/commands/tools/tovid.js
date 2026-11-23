const ffmpeg = require("fluent-ffmpeg");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

module.exports = {
    cmd: ["tovideo", "tovid"],
    desc: "Convierte un sticker animado a video",
    tags: ["tools"],
    exec: async (m, sock) => {
        const jid = m.chat || m.key.remoteJid;
        const ctx = m.message?.extendedTextMessage?.contextInfo;
        const rawSticker = ctx?.quotedMessage?.stickerMessage;
        const quoted = m.quoted;

        if (quoted?.mtype !== "stickerMessage" && !rawSticker) {
            return m.reply("Responde a un *sticker animado* con este comando para convertirlo a video.");
        }

        
        const mediaNode = quoted?.mtype === "stickerMessage"
            ? quoted
            : {
                ...rawSticker,
                mtype: "stickerMessage",
                key: {
                    remoteJid: jid,
                    fromMe: Boolean(quoted?.fromMe),
                    id: ctx.stanzaId,
                    participant: ctx.participant,
                },
            };

        if (!mediaNode.mediaKey || !mediaNode.mediaKey.length) {
            return m.reply("No pude descargar ese sticker porque el mensaje citado no incluye sus datos de descarga. Reenvíalo o prueba con otro sticker.");
        }

        const tempDir = path.resolve("./temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const stamp = Date.now();
        const gifPath = path.join(tempDir, `sticker_${stamp}.gif`);
        const outputPath = path.join(tempDir, `video_${stamp}.mp4`);

        try {
            const buffer = await sock.downloadMediaMessage(mediaNode);

            const metadata = await sharp(buffer, { animated: true }).metadata();
            if ((metadata.pages || 1) <= 1) {
                return m.reply("Ese sticker es estático. Usa *.toimg* para convertirlo a imagen.");
            }

            await m.reply("*Convirtiendo sticker a video...*");

            const gifBuffer = await sharp(buffer, { animated: true }).gif().toBuffer();
            fs.writeFileSync(gifPath, gifBuffer);

            await new Promise((resolve, reject) => {
                ffmpeg(gifPath)
                    .outputOptions([
                        "-movflags", "faststart",
                        "-pix_fmt", "yuv420p",
                        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2"
                    ])
                    .save(outputPath)
                    .on("end", resolve)
                    .on("error", reject);
            });

            const videoBuffer = fs.readFileSync(outputPath);
            await sock.sendMessage(jid, { video: videoBuffer, caption: "Sticker convertido a video." }, { quoted: m });

        } catch (e) {
            console.error("[TOVIDEO]", e?.message || e);
            m.reply(`Error: ${e?.message || "error desconocido"}`);
        } finally {
            for (const file of [gifPath, outputPath]) {
                try {
                    if (fs.existsSync(file)) fs.unlinkSync(file);
                } catch { }
            }
        }
    }
};