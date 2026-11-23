
const fs = require("fs");
const path = require("path");
const { sendImageFromUrl } = require("../../../utils/media");

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

function botNumber(Moody) {
    const candidates = [
        Moody?.user?.id,
        Moody?.user?.jid,
        Moody?.authState?.creds?.me?.id,
        Moody?.authState?.creds?.me?.jid,
    ];

    for (const jid of candidates) {
        const number = normalize(jid);
        if (number) return number;
    }

    return "Desconocido";
}

async function ownerName(Moody, jid) {
    try {
        const name = String((await Moody.getName(jid)) || "").trim();
        const invalid =
            !name ||
            ["no disponible", "desconocido"].includes(name.toLowerCase()) ||
            name.endsWith("@lid") ||
            name.endsWith("@s.whatsapp.net");

        if (!invalid) return name;
    } catch {}

    return normalize(jid);
}

function formatCard(waifu, estado, solicitado) {
    return (
        `Nombre : ${waifu.name}\n` +
        `Valor : ${Number(waifu.value) || 0}\n` +
        `Estado : ${estado}\n` +
        `Fuente : ${waifu.category || "Desconocida"}\n` +
        `Solicitado : ${solicitado}`
    );
}

module.exports = {
    tags: ["gacha"],
    cmd: ["rw", "rollwaifu"],
    help: ["rw", "rollwaifu"],

    exec: async (m, Moody) => {
        try {
            if (!m.isGroup) {
                return m.reply(
                    "Este comando solamente funciona en grupos."
                );
            }

            const waifus = loadWaifus();

            if (!Array.isArray(waifus) || waifus.length === 0) {
                return m.reply(
                    "Todavía no hay personajes registrados en RollWaifu."
                );
            }

            const randomIndex = Math.floor(
                Math.random() * waifus.length
            );

            const waifu = waifus[randomIndex];

            const waifuImages = Array.isArray(waifu?.images)
                ? waifu.images.filter(Boolean)
                : waifu?.image
                    ? [waifu.image]
                    : [];

            if (!waifu || !waifuImages.length) {
                return m.reply(
                    "El personaje seleccionado no tiene una imagen válida."
                );
            }

            const waifuImage =
                waifuImages[Math.floor(Math.random() * waifuImages.length)];

            const hasOwner = Boolean(waifu.owner);

            const pending = loadPending();

            if (hasOwner) {
                const estado = `Reclamado por ${await ownerName(Moody, waifu.owner)}`;

                delete pending[m.chat];
                savePending(pending);

                return sendImageFromUrl(Moody, m.chat, waifuImage, {
                    caption: formatCard(waifu, estado, botNumber(Moody)),
                    quoted: m
                });
            }

            const now = Date.now();

            pending[m.chat] = {
                waifuId: waifu.id,
                waifuName: waifu.name,
                expiresAt: now + CLAIM_TIME
            };

            savePending(pending);

            const caption = formatCard(waifu, "Libre", botNumber(Moody));

            await sendImageFromUrl(Moody, m.chat, waifuImage, {
                caption,
                quoted: m
            });

        } catch (error) {
            console.error("[rollwaifu] Error:", error);

            await m.reply(
                "Ocurrió un error al realizar el sorteo."
            );
        }
    }
};
