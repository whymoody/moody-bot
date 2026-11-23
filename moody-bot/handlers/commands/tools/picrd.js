
const axios = require("axios");
const FormData = require("form-data");
const {
    downloadMediaMessage
} = require("@whiskeysockets/baileys");


const UPLOAD_HOSTS = [
    {
        name: "pomf2.lain.la",
        url: "https://pomf2.lain.la/upload.php",
        field: "files[]"
    }
];

const MAX_SIZE = 10 * 1024 * 1024;


function unwrapMessage(message) {
    if (!message) return null;

    if (message.ephemeralMessage) {
        return unwrapMessage(
            message.ephemeralMessage.message
        );
    }

    if (message.viewOnceMessage) {
        return unwrapMessage(
            message.viewOnceMessage.message
        );
    }

    if (message.viewOnceMessageV2) {
        return unwrapMessage(
            message.viewOnceMessageV2.message
        );
    }

    if (message.documentWithCaptionMessage) {
        return unwrapMessage(
            message.documentWithCaptionMessage.message
        );
    }

    return message;
}

function buildForm(buffer, mimetype, field) {
    const extension = (mimetype.split("/")[1] || "jpg")
        .replace("jpeg", "jpg")
        .split(";")[0];
    const form = new FormData();

    form.append(field, buffer, {
        filename: `moody_${Date.now()}.${extension}`,
        contentType: mimetype,
        knownLength: buffer.length
    });

    return form;
}

async function uploadToHost(host, buffer, mimetype) {
    const form = buildForm(buffer, mimetype, host.field);

    const response = await axios.post(host.url, form, {
        headers: {
            ...form.getHeaders(),
            "Content-Length": form.getLengthSync(),
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "application/json, text/plain, */*"
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000
    });

    const file = response.data?.files?.[0];
    const url = file?.url;

    if (typeof url !== "string" || !url.startsWith("https://")) {
        throw new Error(
            `${host.name} no devolvió una URL válida: ${JSON.stringify(response.data).slice(0, 120)}`
        );
    }

    return {
        url,
        host: host.name,
        expiresAt: file?.expires_at || null
    };
}

async function uploadImage(buffer, mimetype) {
    const errors = [];

    for (const host of UPLOAD_HOSTS) {
        try {
            return await uploadToHost(host, buffer, mimetype);
        } catch (error) {
            const status = error.response?.status;
            console.error(
                `[picrd] ${host.name} falló:`,
                status ? `HTTP ${status}` : error.message,
                typeof error.response?.data === "string"
                    ? error.response.data.slice(0, 120)
                    : ""
            );
            errors.push(`${host.name}: ${status || error.message}`);
        }
    }

    throw new Error(`Ningún host aceptó la imagen (${errors.join(" | ")})`);
}

module.exports = {
    tags: ["tools"],
    cmd: ["picrd", "trl",],
    help: ["picrd"],

    exec: async (m, Moody) => {
        try {
            
            const contextInfo =
                m.message?.extendedTextMessage?.contextInfo ||
                m.msg?.contextInfo ||
                m.message?.imageMessage?.contextInfo;

            const quotedMessage = contextInfo?.quotedMessage;
            const quotedImage = unwrapMessage(quotedMessage)?.imageMessage;
            const selfImage = unwrapMessage(m.message)?.imageMessage;
            const imageMessage = quotedImage || selfImage;

            if (!imageMessage) {
                return m.reply(
                    quotedMessage
                        ? "El mensaje citado no contiene una imagen."
                        : "Envía una imagen con *.picrd* en el pie de foto o responde a una imagen con *.picrd*."
                );
            }

            
            const fileLength = Number(imageMessage.fileLength || 0);

            if (fileLength > MAX_SIZE) {
                return m.reply(
                    "La imagen supera el límite de 10 MB."
                );
            }

            
            let sourceMessage;

            if (quotedImage) {
                if (!contextInfo.stanzaId) {
                    return m.reply(
                        "No pude identificar el mensaje original. Intenta responder nuevamente a la imagen."
                    );
                }

                
                sourceMessage = {
                    key: {
                        remoteJid: m.chat,
                        id: contextInfo.stanzaId,
                        participant: contextInfo.participant,
                        fromMe: Boolean(m.quoted?.fromMe)
                    },
                    message: quotedMessage
                };
            } else {
                sourceMessage = {
                    key: m.key,
                    message: m.message
                };
            }

            await m.reply("Subiendo la imagen");

            const downloadOptions = {
                logger: console
            };

            if (typeof Moody.updateMediaMessage === "function") {
                downloadOptions.reuploadRequest =
                    Moody.updateMediaMessage.bind(Moody);
            }

            let buffer;

            try {
                buffer = await downloadMediaMessage(
                    sourceMessage,
                    "buffer",
                    {},
                    downloadOptions
                );
            } catch (error) {
                console.error(
                    "No se pudo descargar la imagen:",
                    error.message || error
                );
                return m.reply(
                    "No pude descargar la imagen desde WhatsApp. Inténtalo de nuevo."
                );
            }

            if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
                return m.reply(
                    "No pude descargar la imagen desde WhatsApp. Inténtalo de nuevo."
                );
            }

            
            if (buffer.length > MAX_SIZE) {
                return m.reply(
                    "La imagen supera el límite de 10 MB."
                );
            }

            
            const mimetype = imageMessage.mimetype || "image/jpeg";

            
            const uploaded = await uploadImage(buffer, mimetype);
            const imageUrl = uploaded.url;

            
            await Moody.sendMessage(
                m.chat,
                {
                    text:
                        
                        `${imageUrl}\n\n`
                        
                },
                {
                    quoted: m
                }
            );

        } catch (error) {
            const status = error.response?.status;
            const detail =
                typeof error.response?.data === "string"
                    ? error.response.data.slice(0, 200)
                    : JSON.stringify(error.response?.data ?? "").slice(0, 200);

            console.error("\nERROR");
            console.error("Mensaje:", error.message);
            console.error("Estado HTTP:", status ?? "-");
            console.error("Respuesta del servidor:", detail);
            

            await m.reply(
                "No pude subir la imagen a ningún host. Revisa la consola para conocer el error."
            );
        }
    }
};
