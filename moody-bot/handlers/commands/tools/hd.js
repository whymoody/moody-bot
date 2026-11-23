const axios = require("axios");
const FormData = require("form-data");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

const DEAPI_KEY = process.env.DEAPI_KEY;

module.exports = {
    cmd: ["hd", "upscale"],
    desc: "Mejora la calidad de una imagen",
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
        const imageMsg = quoted?.imageMessage || msg?.imageMessage;

        if (!imageMsg) {
            return m.reply(`Envía una *imagen* junto al comando *${prefix + cmd}* o responde a una imagen.`);
        }

        if (!DEAPI_KEY) {
            return m.reply("Configura DEAPI_KEY en el archivo .env para usar este comando.");
        }

        await m.reply("Mejorando la imagen");

        try {
            let mensajeADescargar = (quoted && ctxInfo) 
                ? { key: { remoteJid: jid, fromMe: false, id: ctxInfo.stanzaId, participant: ctxInfo.participant || ctxInfo.remoteJid }, message: quoted }
                : m;

            const buffer = await downloadMediaMessage(
                mensajeADescargar, "buffer", {}, { logger: console, reuploadRequest: sock.updateMediaMessage }
            );

            
            const form = new FormData();
            form.append("image", buffer, { filename: "image.jpg" });
            form.append("model", "RealESRGAN_x4");

            const createRes = await axios.post("https://api.deapi.ai/api/v2/images/upscales", form, {
                headers: {
                    ...form.getHeaders(),
                    "Authorization": `Bearer ${DEAPI_KEY}`,
                    "Accept": "application/json"
                },
                timeout: 60000
            });

            const requestId = createRes.data?.data?.request_id || createRes.data?.request_id;
            if (!requestId) {
                console.error("[DEAPI RESPONSE]", JSON.stringify(createRes.data, null, 2));
                throw new Error("deAPI no devolvió un ID de trabajo válido.");
            }

            console.log(`[DEAPI] Trabajo creado: ${requestId}. Iniciando polling...`);

            let outputUrl = null;
            for (let i = 1; i <= 15; i++) {
                await new Promise(r => setTimeout(r, 10000));

                const jobRes = await axios.get(`https://api.deapi.ai/api/v2/jobs/${requestId}`, {
                    headers: { "Authorization": `Bearer ${DEAPI_KEY}` }
                });

                const data = jobRes.data?.data || jobRes.data;
                const status = data?.status;

                console.log(`[DEAPI] Intento ${i}/15 - Estado: ${status}`);

                if (status === "done" || status === "completed") {
                    outputUrl = data.result_url || data.result?.url || data.url;
                    if (outputUrl) {
                        console.log(`[DEAPI] ¡Listo! URL del resultado: ${outputUrl}`);
                        break;
                    }
                }

                if (status === "failed" || status === "error") {
                    throw new Error(`El trabajo falló en deAPI. Estado: ${status}`);
                }
            }

            if (!outputUrl) {
                throw new Error("Tiempo de espera agotado. La imagen puede ser muy grande o el servicio está lento. Intenta con una imagen más pequeña.");
            }

            const imgRes = await axios.get(outputUrl, { responseType: "arraybuffer" });
            const enhancedBuffer = Buffer.from(imgRes.data);

            await sock.sendMessage(jid, { 
                image: enhancedBuffer, 
                caption: "*Imagen mejorada*" 
            }, { quoted: m });

        } catch (err) {
            console.error("[HD ERROR]", err?.response?.data || err.message);
            await m.reply(`Ocurrió un error al procesar la imagen.\n\n_${err.message}_`);
        }
    },
};