
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

module.exports = {
    tags: ["gacha"],
    cmd: ["tienda", "shop"],
    help: ["tienda"],

    exec: async (m, Moody, { args: rawArgs = [] } = {}) => {
        try {
            if (!fs.existsSync(DB_PATH)) {
                return m.reply("❌ No existe la base de datos de waifus.");
            }

            const waifus = JSON.parse(
                fs.readFileSync(DB_PATH, "utf8")
            );

            if (!fs.existsSync(SHOP_PATH)) {
                fs.writeFileSync(SHOP_PATH, "{}");
            }

            const shop = JSON.parse(
                fs.readFileSync(SHOP_PATH, "utf8")
            );

            const args = rawArgs.join(" ").trim();

            if (/^quitar\s+/i.test(args)) {
                const nombre = args.replace(/^quitar\s+/i, "").trim();

                if (!nombre) {
                    return m.reply(
                        "Escribe el nombre del personaje.\n\nEjemplo: .tienda quitar Esdeath"
                    );
                }

                const waifu = waifus.find(w =>
                    w.name.toLowerCase() === nombre.toLowerCase()
                );

                if (!waifu) {
                    return m.reply("No encontré ese personaje.");
                }

                const listing = shop[waifu.id];

                if (!listing) {
                    return m.reply("Este personaje no está en la tienda.");
                }

                if (normalize(listing.seller) !== normalize(m.sender)) {
                    return m.reply(
                        "Solamente el vendedor puede retirar este personaje."
                    );
                }

                delete shop[waifu.id];

                fs.writeFileSync(
                    SHOP_PATH,
                    JSON.stringify(shop, null, 2)
                );

                return m.reply(
                    `¡Personaje retirado de la tienda!\n\n` +
                    `Personaje: ${waifu.name}\n` +
                    `Precio anterior: $${listing.price}`
                );
            }

            if (args) {
                const parts = args.split("|").map(x => x.trim());

                if (parts.length !== 3) {
                    return m.reply(
                        "Formato incorrecto.\n\n" +
                        "Publicar:\n.tienda Esdeath|Akame Ga Kill|5000\n\n" +
                        "Retirar:\n _.tienda quitar Esdeath_"
                    );
                }

                const [nombre, categoria, precioTexto] = parts;
                const precio = Number(precioTexto);

                if (
                    !nombre ||
                    !categoria ||
                    !Number.isSafeInteger(precio) ||
                    precio <= 0
                ) {
                    return m.reply(
                        "Formato incorrecto.\n\n" +
                        "Ejemplo: _.tienda Esdeath|Akame Ga Kill|5000_"
                    );
                }

                const waifu = waifus.find(w =>
                    w.name.toLowerCase() === nombre.toLowerCase() &&
                    String(w.category || "").toLowerCase() === categoria.toLowerCase()
                );

                if (!waifu) {
                    return m.reply(
                        "No encontré ese personaje y categoría."
                    );
                }

                if (!waifu.owner || normalize(waifu.owner) !== normalize(m.sender)) {
                    return m.reply(
                        "Solamente puedes vender personajes que hayas reclamado tú."
                    );
                }

                if (shop[waifu.id]) {
                    return m.reply(
                        "Este personaje ya está publicado en la tienda."
                    );
                }

                shop[waifu.id] = {
                    waifuId: waifu.id,
                    name: waifu.name,
                    category: waifu.category,
                    price: precio,
                    seller: m.sender,
                    listedAt: new Date().toISOString()
                };

                fs.writeFileSync(
                    SHOP_PATH,
                    JSON.stringify(shop, null, 2)
                );

                return m.reply(
                    `¡Personaje publicado en la tienda!\n\n` +
                    `Personaje: ${waifu.name}\n` +
                    `Categoría: ${waifu.category}\n` +
                    `Precio de venta: $${precio}\n` +
                    `Valor original: ${waifu.value}\n\n` +
                    `Tu personaje ya está disponible en la tienda.`
                );
            }

            const listings = Object.values(shop);

            const disponibles = listings.filter(item => {
                const waifu = waifus.find(w => w.id === item.waifuId);
                return waifu && normalize(waifu.owner) === normalize(item.seller);
            });

            if (disponibles.length === 0) {
                return m.reply(
                    "La tienda está vacía. ¡Sé el primero en vender una waifu!"
                );
            }

            const lista = disponibles.map((item, index) => {
                const waifu = waifus.find(w => w.id === item.waifuId);

                return (
                    `╭━━〔 ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹ \n` +
                    `| ${index + 1}. ${waifu.name} 〕━━╮\n` +
                    `│ Categoría: ${waifu.category}\n` +
                    `│ Precio: $${item.price}\n` +
                    `│ Valor original: ${waifu.value}\n` +
                    `│ Vendedor: @${item.seller.split("@")[0]}\n` +
                    `╰━━━━━━━━━━━━━━━━━━╯`
                );
            });

            const mensaje =
                `*TIENDA DE WAIFUS*\n\n` +
                lista.join("\n\n") +
                `\n\nPersonajes en venta: ${disponibles.length}`;

            const mentions = [...new Set(
                disponibles.map(item => item.seller)
            )];

            await Moody.sendMessage(
                m.chat,
                {
                    text: mensaje,
                    mentions
                },
                { quoted: m }
            );

        } catch (error) {
            console.error("Error en tienda:", error);
            await m.reply("Ocurrió un error al utilizar la tienda.");
        }
    }
};
