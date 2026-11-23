
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "waifus.json");
const PAGE_SIZE = 20;

function normalize(jid = "") {
    return String(jid)
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
}

module.exports = {
    tags: ["gacha"],
    cmd: ["harem"],
    args: ["pagina"],
    help: ["harem"],

    exec: async (m, Moody, { args = [] } = {}) => {
        try {
            const requestedPage = args[0] === undefined ? 1 : Number(args[0]);

            if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) {
                return m.reply("Indica un número de página válido. Ejemplo: harem 2");
            }

            if (!fs.existsSync(DB_PATH)) {
                return m.reply("No existe la base de datos de waifus.");
            }

            const waifus = JSON.parse(
                fs.readFileSync(DB_PATH, "utf8")
            );

            const target = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;

            if (!target) {
                return m.reply("No pude identificar al usuario.");
            }

            const harem = waifus
                .filter(w => w.owner && normalize(w.owner) === normalize(target))
                .sort((a, b) => Number(b.value) - Number(a.value));

            if (harem.length === 0) {
                return m.reply(
                    `@${normalize(target)} todavía no tiene waifus reclamadas.`,
                    m.chat,
                    { mentions: [target] }
                );
            }

            const pageCount = Math.ceil(harem.length / PAGE_SIZE);

            if (requestedPage > pageCount) {
                return m.reply(`Tu harem tiene ${pageCount} ${pageCount === 1 ? "página" : "páginas"}.`);
            }

            const pageItems = harem.slice(
                (requestedPage - 1) * PAGE_SIZE,
                requestedPage * PAGE_SIZE
            );
            const lista = pageItems.map(w =>
                `* *${w.name}* (${new Intl.NumberFormat("de-DE").format(Number(w.value) || 0)})`
            ).join("\n");
            const userName = await Moody.getName(target);

            const mensaje = `❀ Personajes reclamados ❀
⌦ Usuario: ${userName}
♡ Personajes: (${harem.length})

${lista}

> ⌦ Pagina ${requestedPage} de ${pageCount}`;

            await m.reply(mensaje, m.chat, { mentions: [target] });

        } catch (error) {
            console.error("Error en comando harem:", error);
            await m.reply("Ocurrió un error al mostrar el harem.");
        }
    }
};
