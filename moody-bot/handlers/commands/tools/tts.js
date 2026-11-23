
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const { Readable } = require("stream");

function convertToVoiceNote(audioBuffer) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const output = ffmpeg(Readable.from([audioBuffer]))
            .inputFormat("mp3")
            .noVideo()
            .audioCodec("libopus")
            .audioChannels(1)
            .audioFrequency(48000)
            .format("ogg")
            .on("error", reject)
            .pipe();

        output.on("data", (chunk) => chunks.push(chunk));
        output.on("error", reject);
        output.on("end", () => resolve(Buffer.concat(chunks)));
    });
}

module.exports = {
    cmd: ["tts", "audio", "voz"],
    desc: "Convierte un texto en una nota de voz",
    tags: ["tools"],
    exec: async (m, sock, { args, prefix, cmd }) => {
        const jid = m.chat || m.key.remoteJid;
        const texto = args.join(" ");

        
        if (!texto) {
            return m.reply(`*Uso:* ${prefix}${cmd} Hola, esto es un mensaje de voz\n\n_Puedes especificar el idioma así:_ ${prefix}${cmd} en Hello world`);
        }

        
        let idioma = "es"; 
        let textoFinal = texto;
        
        const matchIdioma = texto.match(/^([a-z]{2})\s+(.+)/i);
        if (matchIdioma) {
            idioma = matchIdioma[1].toLowerCase();
            textoFinal = matchIdioma[2];
        }

        
        if (textoFinal.length > 200) {
            return m.reply("El texto es demasiado largo. El límite es de 200 caracteres.");
        }

        await m.reply("*Generando audio...*");

        try {
            
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textoFinal)}&tl=${idioma}&client=tw-ob`;
            
            const response = await axios.get(url, {
                responseType: "arraybuffer",
                validateStatus: (status) => status === 200,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
                },
                timeout: 15000
            });

            const contentType = response.headers["content-type"] || "";
            if (!contentType.toLowerCase().startsWith("audio/")) {
                throw new Error("El servicio TTS no devolvió un archivo de audio.");
            }

            const audioBuffer = Buffer.from(response.data);
            if (!audioBuffer.length) {
                throw new Error("El servicio TTS devolvió un audio vacío.");
            }

            const voiceNote = await convertToVoiceNote(audioBuffer);
            await sock.sendMessage(jid, {
                audio: voiceNote,
                mimetype: "audio/ogg; codecs=opus",
                ptt: true
            }, { quoted: m });

        } catch (e) {
            console.error("[TTS]", e?.message || e);
            return m.reply(`Error al generar el audio: ${e?.message || "error desconocido"}`);
        }
    }
};