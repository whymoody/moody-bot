
const fs = require("fs");
const path = require("path");
const { BOT_CONFIG } = require("../../../utils/config.json");

const DATA_DIR = path.join(__dirname, "data");
const DATABASE = path.join(DATA_DIR, "waifus.json");
const VOTES_DATABASE = path.join(DATA_DIR, "votes.json");

function loadWaifus() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATABASE)) {
        fs.writeFileSync(DATABASE, "[]", "utf8");
    }

    return JSON.parse(
        fs.readFileSync(DATABASE, "utf8")
    );
}

function normalizeText(value = "") {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function formatDate(value) {
    if (!value) {
        return "Nunca";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "Nunca";
    }

    return new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Mexico_City"
    }).format(date);
}

function getLastVote(waifu) {
    if (!fs.existsSync(VOTES_DATABASE)) {
        return "Nunca";
    }

    const votes = JSON.parse(fs.readFileSync(VOTES_DATABASE, "utf8"));
    const suffix = `_${waifu.id}`;
    const lastVote = Object.entries(votes)
        .filter(([key, timestamp]) =>
            key.endsWith(suffix) && Number.isFinite(Number(timestamp))
        )
        .reduce((latest, [, timestamp]) => Math.max(latest, Number(timestamp)), 0);

    return lastVote ? formatDate(lastVote) : "Nunca";
}

async function showCharacter(m, Moody, query, prefix) {
    const waifus = loadWaifus();
    const needle = normalizeText(query);

    if (!needle) {
        return m.reply(
            "Escribe el nombre del personaje que quieres consultar."
        );
    }

    const exact = waifus.filter(
        waifu => normalizeText(waifu.name) === needle
    );

    const found = exact.length
        ? exact
        : waifus.filter(waifu =>
            normalizeText(waifu.name).includes(needle)
        );

    if (!found.length) {
        return m.reply(
            `No encontré ningún personaje con ese nombre: *${query}*`
        );
    }

    if (found.length > 1) {
        const names = found
            .slice(0, 15)
            .map(waifu => `*◦* ${waifu.name}`)
            .join("\n");

        return m.reply(
            `Varios personajes coinciden con *${query}*:\n\n${names}\n\n` +
            "Escribe el nombre completo para ver la información del personaje."
        );
    }

    const waifu = found[0];
    const ownerName = waifu.owner
        ? await Moody.getName(waifu.owner)
        : "";
    const ownerStatus = waifu.owner
        ? `Reclamado por ${ownerName}`
        : "Disponible";
    const info = [
        "*✦.──  Waifu Info  ──.✦*",
        "",
        ` ❀ *Nombre :* ${waifu.name}`,
        ` ✰ *Valor :* ${waifu.value}`,
        ` ❖ *Fuente :* ${waifu.category || "Sin categoría"}`,
        ` ❏ *Puesto :* #${waifus.indexOf(waifu) + 1}`,
        ` ♡ *Estado :* ${ownerStatus}`,
        ` ⴵ *Fecha de reclamo :* ${formatDate(waifu.claimedAt)}`,
        ` ◦ *Votar :* ${prefix}votar ${waifu.name}`,
        ` ⴵ *Ultimo voto :* ${getLastVote(waifu)}`,
        "",
        `*ʙᴜɪʟᴛ ᴀɴᴅ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${BOT_CONFIG.CREATOR_NAME}*`
    ].join("\n");

    return Moody.sendMessage(m.chat, {
        text: info,
        mentions: waifu.owner ? [waifu.owner] : []
    }, { quoted: m });
}

module.exports = {
    tags: ["gacha"],
    cmd: ["winfo", "waifuinfo"],
    help: ["waifuinfo"],

    exec: async (m, Moody, { prefix = "", args = [] } = {}) => {
        try {
            if (!m.isGroup) {
                return m.reply(
                    "Este comando solamente funciona en grupos."
                );
            }

            const query = args.join(" ").trim();

            if (!query) {
                return m.reply(
                    "*CONSULTA DE PERSONAJE*\n\n" +
                    "Menciona el nombre del personaje que quieres consultar.\n\n" +
                    `*Ejemplo:* ${prefix}waifu Esdeath`
                );
            }

            return await showCharacter(m, Moody, query, prefix);

        } catch (error) {
            console.error("[waifu] Error:", error);

            return m.reply(
                "Ocurrió un error al consultar el personaje."
            );
        }
    }
};
