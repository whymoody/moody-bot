
const fs = require("fs");
const path = require("path");
const { BOT_CONFIG } = require("../../../utils/config.json");
const { milesToComas } = require("../../../utils/index");
const { Users } = require("../../../db");

const DATA_DIR = path.join(__dirname, "data");
const DATABASE = path.join(DATA_DIR, "waifus.json");
const PAGE_SIZE = 14;

function loadWaifus() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATABASE)) {
        fs.writeFileSync(DATABASE, "[]", "utf8");
    }

    return JSON.parse(fs.readFileSync(DATABASE, "utf8"));
}

function normalizeCategory(category = "") {
    return String(category)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

module.exports = {
    tags: ["gacha"],
    cmd: ["animelist"],
    args: ["pagina | serie"],
    help: ["animelist"],

    exec: async (m, Moody, { args = [] } = {}) => {
        try {
            if (!m.isGroup) {
                return m.reply(
                    "Este comando solamente funciona en grupos."
                );
            }

            const waifus = loadWaifus();

            if (!waifus.length) {
                return m.reply(
                    "Todavía no hay waifus registradas."
                );
            }

            const isPageArgument = args.length === 1 && /^\d+$/.test(args[0]);
            const requestedPage = isPageArgument ? Number(args[0]) : 1;

            if (isPageArgument && (!Number.isSafeInteger(requestedPage) || requestedPage < 1)) {
                return m.reply("Indica un número de página válido. Ejemplo: wc 2");
            }

            const requestedCategory = isPageArgument ? "" : args.join(" ").trim();

            const categories = {};

            for (const waifu of waifus) {
                const category = waifu.category || "Sin categoría";

                if (!categories[category]) {
                    categories[category] = [];
                }

                categories[category].push(waifu);
            }

            let selectedCategories = Object.entries(categories);

            if (requestedCategory) {
                selectedCategories = selectedCategories.filter(
                    ([category]) =>
                        normalizeCategory(category) ===
                        normalizeCategory(requestedCategory)
                );

                if (!selectedCategories.length) {
                    const available = Object.keys(categories)
                        .map(category => `• ${category}`)
                        .join("\n");

                    return m.reply(
                        `No encontré la categoría "${requestedCategory}".\n\n` +
                        `*Categorías disponibles:*\n${available}`
                    );
                }
            } else {
                selectedCategories.sort(([categoryA], [categoryB]) =>
                    categoryA.localeCompare(categoryB, "es", { sensitivity: "base" })
                );

                const pageCount = Math.ceil(selectedCategories.length / PAGE_SIZE);
                if (requestedPage > pageCount) {
                    return m.reply(`La lista tiene ${pageCount} ${pageCount === 1 ? "página" : "páginas"}.`);
                }

                const pageCategories = selectedCategories.slice(
                    (requestedPage - 1) * PAGE_SIZE,
                    requestedPage * PAGE_SIZE
                );
                const entries = pageCategories.map(
                    ([category, characters]) => `*›* ${category} (${characters.length})`
                );
                const message =
                    `🌵 Lista de series *${waifus.length}*\n\n` +
                    `${entries.join("\n")}\n\n` +
                    `Página *${requestedPage}* de *${pageCount}*`;

                return Moody.sendMessage(
                    m.chat,
                    { text: message },
                    { quoted: m }
                );
            }

            let message = " ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹ \n\n";
            const mentions = [];

            let totalCharacters = 0;

            for (const [category, characters] of selectedCategories) {
                message += ` ${category.toUpperCase()} \n\n`;

                for (const waifu of characters) {
                    let ownerName = "Disponible";

                    if (waifu.owner) {
                        try {
                            const user = await Users.get(waifu.owner);

                            if (user) {
                                ownerName = await Moody.getName(waifu.owner);
                                mentions.push(waifu.owner);
                            } else {
                                ownerName = "Usuario desconocido";
                            }
                        } catch {
                            ownerName = "Usuario desconocido";
                        }
                    }

                    message +=
                        `*${waifu.name}*\n` +
                        `   Reclamado por: ${ownerName}\n` +
                        `   Valor: ${BOT_CONFIG.MONEY_SYMBOL}${milesToComas(Number(waifu.value) || 0)}\n\n`;
                }

                message += "\n\n";

                totalCharacters += characters.length;
            }

            message +=
                `_Categorías: ${selectedCategories.length}_\n` +
                `_Personajes registrados:* ${totalCharacters}_`;

            return Moody.sendMessage(
                m.chat,
                {
                    text: message,
                    mentions: [...new Set(mentions)]
                },
                { quoted: m }
            );

        } catch (error) {
            console.error("[waifucategorias] Error:", error);

            return m.reply(
                "Ocurrió un error al consultar las categorías."
            );
        }
    }
};
