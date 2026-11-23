
const fs = require("fs");
const path = require("path");

const {
    owner: OWNERS = []
} = require("../../../utils/config.json");

const DATA_DIR = path.join(__dirname, "data");
const DATABASE = path.join(DATA_DIR, "waifus.json");
const PENDING_DATABASE = path.join(DATA_DIR, "pending.json");

function normalize(jid = "") {
    return String(jid)
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
}

function isOwner(jid) {
    return OWNERS.some(owner =>
        normalize(owner) === normalize(jid)
    );
}

function getCallerJids(m) {
    return [
        m.sender,
        m.participant,
        m.key?.participant
    ].filter(Boolean);
}

function getMessageText(m) {
    return (
        m.text ||
        m.body ||
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.msg?.text ||
        ""
    );
}

function loadDatabase(file, fallback) {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(file)) {
        fs.writeFileSync(
            file,
            JSON.stringify(fallback, null, 2),
            "utf8"
        );
    }

    return JSON.parse(
        fs.readFileSync(file, "utf8")
    );
}

function saveDatabase(file, data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

module.exports = {
    tags: ["gacha"],
    cmd: ["delwaifu"],
    help: ["delwaifu"],

    exec: async (m, Moody) => {
        try {
            const owner = getCallerJids(m).some(isOwner);

            if (!owner) {
                return m.reply(
                    "Este comando solamente puede utilizarlo el propietario del bot."
                );
            }

            let text = getMessageText(m);

            text = text.replace(
                /^\.?delwaifu\s*/i,
                ""
            ).trim();

            if (!text) {
                return m.reply(
                    "Debes indicar el nombre del personaje.\n\n" +
                    "Ejemplo:\n" +
                    ".delwaifu Mikasa Ackerman"
                );
            }

            const waifus = loadDatabase(DATABASE, []);

            if (!Array.isArray(waifus)) {
                return m.reply(
                    "La base de datos de waifus no es válida."
                );
            }

            const index = waifus.findIndex(waifu =>
                waifu.name.toLowerCase() === text.toLowerCase()
            );

            if (index === -1) {
                return m.reply(
                    `No encontré ninguna waifu llamada *${text}*.`
                );
            }

            const deleted = waifus[index];

            waifus.splice(index, 1);

            saveDatabase(DATABASE, waifus);

            const pending = loadDatabase(
                PENDING_DATABASE,
                {}
            );

            let pendingRemoved = false;

            for (const chat of Object.keys(pending)) {
                if (
                    String(pending[chat].waifuId) ===
                    String(deleted.id)
                ) {
                    delete pending[chat];
                    pendingRemoved = true;
                }
            }

            if (pendingRemoved) {
                saveDatabase(PENDING_DATABASE, pending);
            }

            await m.reply(
                "*WAIFU ELIMINADA CORRECTAMENTE*\n\n" +
                `*Nombre:* ${deleted.name}\n` +
                `*Categoría:* ${deleted.category}\n` +
                `*Valor:* ${deleted.value}\n` +
                `*Propietario anterior:* ${
                    deleted.owner || "Sin propietario"
                }\n\n` +
                "El personaje fue eliminado de la base de datos."
            );

        } catch (error) {
            console.error("[delwaifu] Error:", error);

            await m.reply(
                "Ocurrió un error al eliminar la waifu."
            );
        }
    }
};
