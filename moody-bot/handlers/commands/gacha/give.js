
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "waifus.json");
const SHOP_PATH = path.join(__dirname, "data", "tienda.json");

function normalize(jid = "") {
    return String(jid)
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
}

function normalizeJid(jid = "") {
    return String(jid).trim().replace(/:\d+@/, "@");
}

module.exports = {
    tags: ["gacha"],
    cmd: ["give"],
    help: ["give"],

    exec: async (m, Moody, { args = [] } = {}) => {
        try {
            if (!m.isGroup) {
                return m.reply("Este comando solo funciona en grupos.");
            }

            const nombre = args
                .filter((arg) => !String(arg).includes("@"))
                .join(" ")
                .trim();

            if (!nombre) {
                return m.reply(
                    "Escribe el nombre de la waifu y menciona al destinatario.\n\n" +
                    "Ejemplo: _.give Esdeath @usuario_"
                );
            }

            const contextInfo =
                m.message?.extendedTextMessage?.contextInfo ||
                m.msg?.contextInfo ||
                {};

            const recipient = normalizeJid(
                m.mentionedJid?.[0] ||
                m.quoted?.sender ||
                contextInfo.participant ||
                ""
            );

            if (!recipient) {
                return m.reply(
                    "Debes mencionar al usuario o responder a uno de sus mensajes."
                );
            }

            if (normalize(recipient) === normalize(m.sender)) {
                return m.reply("No puedes regalarte una waifu a ti mismo.");
            }

            if (!fs.existsSync(DB_PATH)) {
                return m.reply("No existe la base de datos de waifus.");
            }

            const waifus = JSON.parse(
                fs.readFileSync(DB_PATH, "utf8")
            );

            const waifu = waifus.find(w =>
                w.name.toLowerCase() === nombre.toLowerCase()
            );

            if (!waifu) {
                return m.reply(`No encontré a ${nombre}.`);
            }

            if (normalize(waifu.owner) !== normalize(m.sender)) {
                return m.reply(
                    "No puedes regalar una waifu que no te pertenece."
                );
            }

            waifu.owner = recipient;
            waifu.transferredAt = new Date().toISOString();

            if (fs.existsSync(SHOP_PATH)) {
                const shop = JSON.parse(
                    fs.readFileSync(SHOP_PATH, "utf8")
                );

                if (shop[waifu.id]) {
                    delete shop[waifu.id];

                    fs.writeFileSync(
                        SHOP_PATH,
                        JSON.stringify(shop, null, 2)
                    );
                }
            }

            fs.writeFileSync(
                DB_PATH,
                JSON.stringify(waifus, null, 2)
            );

            await Moody.sendMessage(
                m.chat,
                {
                    text:
                        
                        `De: @${m.sender.split("@")[0]}\n` +
                        `Para: @${recipient.split("@")[0]}\n` +
                        `Personaje: ${waifu.name}\n` +
                        `Categoría: ${waifu.category}\n` +
                        `Valor: ${waifu.value}\n\n` +
                        `Haz regalado un personaje`,
                    mentions: [m.sender, recipient]
                },
                { quoted: m }
            );

        } catch (error) {
            console.error("Error en give:", error);
            await m.reply("Ocurrió un error al regalar la waifu.");
        }
    }
};
