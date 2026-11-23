const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "waifus.json");

const PAGE_SIZE = 50;

function normalizeCategory(category = "") {
    return String(category)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

function loadWaifus() {
    const waifus = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));

    if (!Array.isArray(waifus)) {
        throw new Error("La base de datos de waifus no contiene una lista.");
    }

    return waifus;
}

const INVALID_NAMES = ["no disponible", "desconocido", "undefined", "null"];

function isValidName(name) {
    const value = String(name || "").trim();
    if (!value || INVALID_NAMES.includes(value.toLowerCase())) return false;
    return !value.endsWith("@lid") && !value.endsWith("@s.whatsapp.net");
}

function uniqueCharacters(characters) {
    const seen = new Set();
    const list = [];

    for (const waifu of characters) {
        const key = String(waifu.id ?? waifu.name ?? "");
        if (seen.has(key)) continue;

        seen.add(key);
        list.push(waifu);
    }

    return list;
}

module.exports = {
    tags: ["gacha"],
    cmd: ["animeinfo", "anime"],
    help: ["animeinfo <serie> [página]"],

    exec: async (m, Moody, { args = [], prefix = "." } = {}) => {
        try {
            const waifus = loadWaifus();
            const categories = new Map();

            for (const waifu of waifus) {
                const name = waifu.category || "Sin categoría";
                const key = normalizeCategory(name);

                if (!categories.has(key)) {
                    categories.set(key, { name, characters: [] });
                }

                categories.get(key).characters.push(waifu);
            }

            const query = args.join(" ").trim();

            if (!query) {
                return m.reply(
                    `Indica la serie que quieres consultar.\n° Ejemplo : ${prefix}animeinfo Chainsaw Man\n\n> Usa *${prefix}animelist* para ver la lista de series.`,
                );
            }

            let anime = categories.get(normalizeCategory(query));
            let requestedPage = 1;

            if (!anime) {
                const last = String(args[args.length - 1] ?? "");
                const candidate = args.slice(0, -1).join(" ").trim();

                if (/^\d+$/.test(last) && candidate) {
                    const found = categories.get(normalizeCategory(candidate));

                    if (found) {
                        anime = found;
                        requestedPage = Number(last);
                    }
                }
            }

            if (!anime) {
                return m.reply(`No encontré la serie *${query}*.`);
            }

            if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) {
                return m.reply(
                    `Indica un número de página válido.\n° Ejemplo : ${prefix}animeinfo ${anime.name} 2`,
                );
            }

            const characters = uniqueCharacters(anime.characters).sort(
                (a, b) => (Number(b.value) || 0) - (Number(a.value) || 0),
            );

            const total = characters.length;
            const claimed = characters.filter((waifu) => Boolean(waifu.owner)).length;
            const percentage = total ? Math.round((claimed / total) * 100) : 0;
            const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

            if (requestedPage > pageCount) {
                return m.reply(
                    `*${anime.name}* tiene ${pageCount} ${pageCount === 1 ? "página" : "páginas"}.`,
                );
            }

            const pageItems = characters.slice(
                (requestedPage - 1) * PAGE_SIZE,
                requestedPage * PAGE_SIZE,
            );

            const ownerNames = new Map();

            const ownerLabel = async (owner) => {
                const key = String(owner);
                if (ownerNames.has(key)) return ownerNames.get(key);

                let label = null;

                try {
                    const name = await Moody.getName(owner);
                    if (isValidName(name)) label = String(name).trim();
                } catch {}

                if (!label) label = key.split("@")[0].split(":")[0];

                ownerNames.set(key, label);
                return label;
            };

            const list = [];
            for (const waifu of pageItems) {
                const value = Number(waifu.value) || 0;
                const estado = waifu.owner
                    ? `Reclamado por ${await ownerLabel(waifu.owner)}`
                    : "Libre";

                list.push(`» *${waifu.name}* (${value}) • ${estado}`);
            }

            const text = [
                `✦ Nombre *[${anime.name}]*`,
                `• Personajes » *${total}*`,
                `• Reclamados » ${claimed}/${total} (${percentage}%)`,
                `• Lista de personajes:`,
                ...list
            ].join("\n");

            const footer = pageCount > 1
                ? `\n\n> ⌦ Página ${requestedPage} de ${pageCount}`
                : "";

            return Moody.sendMessage(m.chat, { text: text + footer }, { quoted: m });
        } catch (error) {
            console.error("[animeinfo] No se pudo consultar la serie:", error);
            return m.reply("Ocurrió un error al consultar la información de la serie.");
        }
    }
};
