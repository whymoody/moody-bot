
const axios = require("axios");
const crypto = require("crypto");
const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand
} = require("@aws-sdk/client-s3");

const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const settings = require("../../../db/settings");
const { owner: OWNERS } = require("../../../utils/config.json");

const sessions = new Map();



const MIX_SETTING_ID = "global";
const MIX_SETTING_KEY = "mix";

const SESSION_TIME = 5 * 60 * 1000;
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_RESULT_SIZE = 200 * 1024 * 1024;
const POLL_INTERVAL = 5000;
const MAX_POLLS = 60;

const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "")
    .trim()
    .replace(/\/+$/, "");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));



const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
});



function normalize(jid = "") {
    return String(jid)
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
}

function isOwner(m) {
    const callers = [
        m.sender,
        m.participant,
        m.key?.participant
    ].filter(Boolean);

    return callers.some(jid =>
        (OWNERS || []).some(owner =>
            normalize(owner) === normalize(jid)
        )
    );
}

async function isMixEnabled() {
    return (await settings.get(MIX_SETTING_ID, MIX_SETTING_KEY)) === "on";
}

function validateConfig() {
    const required = [
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET_NAME",
        "R2_PUBLIC_URL",
        "VIGGLE_API_KEY"
    ];

    const missing = required.filter(key =>
        !process.env[key]?.trim()
    );

    if (missing.length) {
        throw new Error(
            `Faltan variables en .env: ${missing.join(", ")}`
        );
    }
}



function unwrapMessage(message) {
    if (!message) return null;

    if (message.ephemeralMessage)
        return unwrapMessage(message.ephemeralMessage.message);

    if (message.viewOnceMessage)
        return unwrapMessage(message.viewOnceMessage.message);

    if (message.viewOnceMessageV2)
        return unwrapMessage(message.viewOnceMessageV2.message);

    if (message.documentWithCaptionMessage)
        return unwrapMessage(message.documentWithCaptionMessage.message);

    return message;
}

function getMediaType(message) {
    const content = unwrapMessage(message);

    if (!content) return null;
    if (content.imageMessage) return "image";
    if (content.videoMessage) return "video";

    return null;
}

function getQuotedSource(m) {
    const contextInfo =
        m.message?.extendedTextMessage?.contextInfo ||
        m.msg?.contextInfo ||
        m.message?.imageMessage?.contextInfo ||
        m.message?.videoMessage?.contextInfo;

    if (!contextInfo?.quotedMessage) return null;

    return {
        key: {
            remoteJid: m.chat,
            id: contextInfo.stanzaId,
            participant: contextInfo.participant,
            fromMe: Boolean(m.quoted?.fromMe)
        },
        message: contextInfo.quotedMessage
    };
}

async function downloadMedia(Moody, source) {
    const buffer = await downloadMediaMessage(
        source,
        "buffer",
        {},
        {
            logger: console,
            reuploadRequest:
                typeof Moody.updateMediaMessage === "function"
                    ? Moody.updateMediaMessage.bind(Moody)
                    : undefined
        }
    );

    return Buffer.from(buffer);
}



function detectImage(buffer) {
    if (
        buffer[0] === 0xFF &&
        buffer[1] === 0xD8 &&
        buffer[2] === 0xFF
    ) {
        return { extension: "jpg", mime: "image/jpeg" };
    }

    if (buffer.toString("hex", 0, 8) === "89504e470d0a1a0a") {
        return { extension: "png", mime: "image/png" };
    }

    if (
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
        return { extension: "webp", mime: "image/webp" };
    }

    throw new Error("Formato de imagen no compatible.");
}

function detectVideo(buffer) {
    if (buffer.toString("ascii", 4, 8) === "ftyp") {
        return { extension: "mp4", mime: "video/mp4" };
    }

    if (buffer.toString("hex", 0, 4) === "1a45dfa3") {
        return { extension: "webm", mime: "video/webm" };
    }

    throw new Error("Formato de video no compatible. Utiliza MP4 o WebM.");
}



function getPublicUrl(key) {
    const encodedKey = key
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/");

    return `${R2_PUBLIC_URL}/${encodedKey}`;
}

async function uploadToR2(buffer, extension, mimeType) {
    const filename =
        `mix/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    await r2.send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME.trim(),
            Key: filename,
            Body: buffer,
            ContentType: mimeType,
            CacheControl: "public, max-age=3600"
        })
    );

    return {
        filename,
        publicUrl: getPublicUrl(filename)
    };
}

async function deleteFromR2(filename) {
    if (!filename) return;

    try {
        await r2.send(
            new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME.trim(),
                Key: filename
            })
        );
    } catch (error) {
        console.error(
            "Error eliminando archivo de R2:",
            error.message
        );
    }
}


async function createViggleRender(imageUrl, videoUrl) {
    const form = new URLSearchParams();

    form.append("image_url", imageUrl);
    form.append("motion_video_url", videoUrl);

    const response = await axios.post(
        "https://apis.viggle.ai/v1/renders",
        form.toString(),
        {
            headers: {
                Authorization: `Bearer ${process.env.VIGGLE_API_KEY.trim()}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            timeout: 120000
        }
    );

    if (!response.data?.id) {
        throw new Error("Viggle no devolvió un ID de procesamiento.");
    }

    return response.data.id;
}

async function waitForViggle(renderId) {
    for (let i = 0; i < MAX_POLLS; i++) {
        await sleep(POLL_INTERVAL);

        const response = await axios.get(
            `https://apis.viggle.ai/v1/videos/${encodeURIComponent(renderId)}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.VIGGLE_API_KEY.trim()}`
                },
                timeout: 60000
            }
        );

        const data = response.data;

        if (data.status === "ready") {
            if (!data.video_url) {
                throw new Error("Viggle no devolvió la URL del resultado.");
            }

            return data.video_url;
        }

        if (["failed", "cancelled"].includes(data.status)) {
            throw new Error(
                `Procesamiento terminado con estado: ${data.status}`
            );
        }
    }

    throw new Error("Viggle tardó demasiado en generar el video.");
}

async function downloadResult(url) {
    const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 300000,
        maxContentLength: MAX_RESULT_SIZE,
        maxBodyLength: MAX_RESULT_SIZE
    });

    return Buffer.from(response.data);
}



module.exports = {
    tags: ["tools"],
    cmd: ["viggle", "mezclar", "vigglemix", "vgl"],
    help: ["viggle"],

    exec: async (
        m,
        Moody,
        { prefix = "", cmd = "viggle", args = [] } = {}
    ) => {
        const sessionKey = `${m.chat}:${m.sender}`;
        const action = String(args[0] || "").toLowerCase();

        try {

            if (action === "on" || action === "off") {
                if (!isOwner(m)) {
                    return m.reply(
                        "*Solo el owner puede activar o desactivar este comando.*"
                    );
                }

                await settings.set(
                    MIX_SETTING_ID,
                    MIX_SETTING_KEY,
                    action
                );

                return m.reply(
                    action === "on"
                        ? "*Viggle Mix activado.*"
                        : "*Viggle Mix desactivado.*"
                );
            }

            if (!(await isMixEnabled())) {
                return m.reply(
                    "*Viggle Mix está desactivado.*\n\n" +
                    `Un owner puede activarlo con *${prefix}${cmd} on*`
                );
            }

            validateConfig();

            const quoted = getQuotedSource(m);
            const quotedType = getMediaType(quoted?.message);


            if (!sessions.has(sessionKey)) {
                if (!quoted || quotedType !== "image") {
                    return m.reply(
                        "*VIGGLE MIX*\n\n" +
                        `Responde a una fotografía con *${prefix}${cmd}*.\n\n` +
                        "Después te pediré un video de referencia."
                    );
                }

                await m.reply("Descargando fotografía...");

                const imageBuffer = await downloadMedia(Moody, quoted);

                if (imageBuffer.length > MAX_IMAGE_SIZE) {
                    return m.reply("La fotografía supera los 15 MB.");
                }

                const imageInfo = detectImage(imageBuffer);

                sessions.set(sessionKey, {
                    imageBuffer,
                    imageInfo,
                    createdAt: Date.now()
                });

                return m.reply(
                    "*Fotografía recibida.*\n\n" +
                    `Ahora responde al video de referencia con *${prefix}${cmd}*.\n\n` +
                    "Tienes 5 minutos."
                );
            }

            const session = sessions.get(sessionKey);

            if (Date.now() - session.createdAt > SESSION_TIME) {
                sessions.delete(sessionKey);

                return m.reply(
                    `Tu sesión expiró. Vuelve a enviar la fotografía con *${prefix}${cmd}*.`
                );
            }


            if (!quoted || quotedType !== "video") {
                return m.reply(
                    `Responde a un video de referencia con *${prefix}${cmd}*.`
                );
            }

            await m.reply("Descargando video de referencia...");

            const videoBuffer = await downloadMedia(Moody, quoted);

            if (videoBuffer.length > MAX_VIDEO_SIZE) {
                return m.reply("El video supera los 50 MB.");
            }

            const videoInfo = detectVideo(videoBuffer);

            sessions.delete(sessionKey);

            let imageUpload;
            let videoUpload;

            try {
                await m.reply("Subiendo archivos...");

                imageUpload = await uploadToR2(
                    session.imageBuffer,
                    session.imageInfo.extension,
                    session.imageInfo.mime
                );

                videoUpload = await uploadToR2(
                    videoBuffer,
                    videoInfo.extension,
                    videoInfo.mime
                );

                await m.reply(
                
                    "Enviando solicitud a Viggle..."
                );

                const renderId = await createViggleRender(
                    imageUpload.publicUrl,
                    videoUpload.publicUrl
                );

                await m.reply(
                    "*Viggle está procesando tu video.*\n\n" +
                    "Esto puede tardar varios minutos."
                );

                const resultUrl = await waitForViggle(renderId);

                await m.reply("Descargando video terminado...");

                const resultBuffer = await downloadResult(resultUrl);

                await Moody.sendMessage(
                    m.chat,
                    {
                        video: resultBuffer,
                        mimetype: "video/mp4",
                        fileName: "viggle-mix.mp4",
                        caption: "*¡Tu video está listo!*"
                    },
                    { quoted: m }
                );

            } finally {
                if (imageUpload?.filename) {
                    await deleteFromR2(imageUpload.filename);
                }

                if (videoUpload?.filename) {
                    await deleteFromR2(videoUpload.filename);
                }
            }

        } catch (error) {
            console.error(
                "Error en MIX:",
                error.response?.data || error.message
            );

            sessions.delete(sessionKey);

            const status = error.response?.status;

            let message = error.message;

            if (status === 401 || status === 403) {
                message =
                    "Cloudflare R2 rechazó la operación. Revisa tus credenciales y permisos del token.";
            } else if (status === 404) {
                message =
                    "No se encontró el bucket. Revisa R2_BUCKET_NAME.";
            }

            await m.reply(
                `*Error en Viggle Mix*\n\n${message}\n\n` +
                `Puedes volver a intentarlo con *${prefix}${cmd}*.`
            );
        }
    }
};
