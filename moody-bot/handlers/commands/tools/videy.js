const axios = require("axios");
const FormData = require("form-data");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
    cmd: ["videy", "videyup"],
    desc: "Sube un video o imagen a Videy y devuelve el enlace",
    tags: ["tools"],
    exec: async (m, sock, { prefix, cmd }) => {
        const jid = m.chat || m.key.remoteJid;
        const msg = m.message;

        
        let ctxInfo = null;
        for (const key in msg) {
            if (msg[key] && msg[key].contextInfo) {
                ctxInfo = msg[key].contextInfo;
                break;
            }
        }
        const quoted = ctxInfo?.quotedMessage;
        const mediaMsg = quoted?.videoMessage || quoted?.imageMessage || msg?.videoMessage || msg?.imageMessage;

        if (!mediaMsg) {
            return m.reply(`Envía o responde a un *video* o *imagen* con el comando *${prefix + cmd}*`);
        }

        await m.reply("*Subiendo archivo a Videy, espera un momento...*");

        try {
            
            let mensajeADescargar = (quoted && ctxInfo) 
                ? { key: { remoteJid: jid, fromMe: false, id: ctxInfo.stanzaId, participant: ctxInfo.participant || ctxInfo.remoteJid }, message: quoted }
                : m;

            const buffer = await downloadMediaMessage(
                mensajeADescargar, "buffer", {}, { logger: console, reuploadRequest: sock.updateMediaMessage }
            );

           
            const form = new FormData();
            
            form.append("file", buffer, { 
                filename: mediaMsg.videoMessage ? "video.mp4" : "image.jpg",
                contentType: mediaMsg.mimetype || "video/mp4" 
            });

            
            const response = await axios.post("https://videy.co/api/upload", form, {
                headers: form.getHeaders(),
                timeout: 120000 
            });

            if (!response.data || !response.data.id) {
                console.error("[VIDEY RESPONSE]", response.data);
                throw new Error("La API de Videy no devolvió un ID válido.");
            }

           
            const videyUrl = `https://videy.co/v?id=${response.data.id}`;

           
            await sock.sendMessage(jid, { 
                text: `*Archivo subido exitosamente*\n\n> › *Enlace :* ${videyUrl}\n> › *Expiración :* 24 horas` 
            }, { quoted: m });

        } catch (err) {
            console.error("[VIDEY ERROR]", err?.response?.data || err.message);
            await m.reply(`Ocurrió un error al subir el archivo.\n\n_${err.message}_`);
        }
    },
};