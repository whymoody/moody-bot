const ffmpeg = require("fluent-ffmpeg");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

module.exports = {
    cmd: ["toimg", "toimage"],
    desc: "Convierte un sticker en imagen o video",
    tags: ["tools"],
    exec: async (m, sock) => {
        const jid = m.chat || m.key.remoteJid;
        const ctx = m.message?.extendedTextMessage?.contextInfo;
        const rawSticker = ctx?.quotedMessage?.stickerMessage;
        const quoted = m.quoted;

        if (quoted?.mtype !== "stickerMessage" && !rawSticker) {
            return m.reply("Responde a un *sticker* con este comando para convertirlo a imagen.");
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
        const outputVid = path.join(tempDir, `video_${stamp}.mp4`);

        try {
            const buffer = await sock.downloadMediaMessage(mediaNode);

            
            const metadata = await sharp(buffer, { animated: true }).metadata();
            const isAnimated = (metadata.pages || 1) > 1;

            if (isAnimated) {
                
                const gifBuffer = await sharp(buffer, { animated: true }).gif().toBuffer();
                fs.writeFileSync(gifPath, gifBuffer);

                await new Promise((resolve, reject) => {
                    ffmpeg(gifPath)
                        .outputOptions([
                            "-movflags", "faststart",
                            "-pix_fmt", "yuv420p",
                            "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2" 
                        ])
                        .save(outputVid)
                        .on("end", resolve)
                        .on("error", reject);
                });

                const videoBuffer = fs.readFileSync(outputVid);
                await sock.sendMessage(jid, { video: videoBuffer, caption: "Sticker animado convertido a video." }, { quoted: m });
            } else {
                
                const imgBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
                await sock.sendMessage(jid, { image: imgBuffer, caption: "Sticker convertido a imagen." }, { quoted: m });
            }

        } catch (e) {
            console.error("[TOIMG]", e?.message || e);
            m.reply(`Error al convertir el sticker: ${e?.message || "error desconocido"}`);
        } finally {
            
            for (const file of [gifPath, outputVid]) {
                try {
                    if (fs.existsSync(file)) fs.unlinkSync(file);
                } catch { }
            }
        }
    }
};