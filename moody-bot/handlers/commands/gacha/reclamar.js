
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DATABASE = path.join(DATA_DIR, "waifus.json");
const PENDING_DATABASE = path.join(DATA_DIR, "pending.json");

const CLAIM_TIME = 30 * 1000;

function initializeDatabase() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATABASE)) {
        fs.writeFileSync(DATABASE, "[]", "utf8");
    }

    if (!fs.existsSync(PENDING_DATABASE)) {
        fs.writeFileSync(PENDING_DATABASE, "{}", "utf8");
    }
}

function loadWaifus() {
    initializeDatabase();

    return JSON.parse(
        fs.readFileSync(DATABASE, "utf8")
    );
}

function saveWaifus(waifus) {
    fs.writeFileSync(
        DATABASE,
        JSON.stringify(waifus, null, 2),
        "utf8"
    );
}

function loadPending() {
    initializeDatabase();

    return JSON.parse(
        fs.readFileSync(PENDING_DATABASE, "utf8")
    );
}

function savePending(pending) {
    fs.writeFileSync(
        PENDING_DATABASE,
        JSON.stringify(pending, null, 2),
        "utf8"
    );
}

function normalize(jid = "") {
    return String(jid)
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
}

module.exports = {
    tags: ["gacha"],
    cmd: ["rc", "reclamar"],
    help: ["reclamar"],

    exec: async (m, Moody) => {
        try {
            if (!m.isGroup) {
                return m.reply(
                    "Este comando solamente funciona en grupos."
                );
            }

            const user = m.sender;

            if (!user) {
                return m.reply(
                    "No pude identificar al usuario que reclama."
                );
            }

            const waifus = loadWaifus();
            const pending = loadPending();

            const current = pending[m.chat];

            if (!current) {
                return m.reply(
                    "No hay ningún personaje disponible para reclamar."
                );
            }

            if (Date.now() > current.expiresAt) {
                delete pending[m.chat];
                savePending(pending);

                return m.reply(
                    "El tiempo para reclamar este personaje ha terminado."
                );
            }

            const waifu = waifus.find(
                item => String(item.id) === String(current.waifuId)
            );

            if (!waifu) {
                delete pending[m.chat];
                savePending(pending);

                return m.reply(
                    "No pude encontrar el personaje sorteado."
                );
            }

            if (waifu.owner) {
                delete pending[m.chat];
                savePending(pending);

                return m.reply(
                    "Este personaje ya fue reclamado."
                );
            }

            waifu.owner = user;
            waifu.claimedAt = new Date().toISOString();

            saveWaifus(waifus);

            delete pending[m.chat];
            savePending(pending);

            const caption =
                "*¡PERSONAJE RECLAMADO!*\n\n" +
                `*Personaje:* ${waifu.name}\n` +
                `*Categoría:* ${waifu.category}\n` +
                `*Valor:* ${waifu.value}\n\n` +
                `*Reclamado por:* @${normalize(user)}\n\n` +
                "";

            await Moody.sendMessage(
                m.chat,
                {
                    text: caption,
                    mentions: [user]
                },
                {
                    quoted: m
                }
            );

        } catch (error) {
            console.error("[reclamar] Error:", error);

            await m.reply(
                "Ocurrió un error al intentar reclamar el personaje."
            );
        }
    }
};
