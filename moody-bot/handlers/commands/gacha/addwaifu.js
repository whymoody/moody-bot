
const fs = require("fs");
const path = require("path");

const {
    owner: OWNERS = []
} = require("../../../utils/config.json");

const moderators = require("../../../db/moderators");

const DATA_DIR = path.join(__dirname, "data");
const DATABASE = path.join(DATA_DIR, "waifus.json");

function loadWaifus() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATABASE)) {
        fs.writeFileSync(DATABASE, "[]", "utf8");
    }

    return JSON.parse(fs.readFileSync(DATABASE, "utf8"));
}

function saveWaifus(waifus) {
    fs.writeFileSync(
        DATABASE,
        JSON.stringify(waifus, null, 2),
        "utf8"
    );
}

function normalize(jid = "") {
    return String(jid)
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
}

function getCallerJids(m) {
    return [
        m.sender,
        m.participant,
        m.key?.participant
    ].filter(Boolean);
}

function isOwner(m) {
    return getCallerJids(m).some(jid =>
        OWNERS.some(owner => normalize(owner) === normalize(jid))
    );
}

async function hasPermission(m) {
    if (isOwner(m)) return true;

    const mods = await moderators.list();

    return mods.some(mod =>
        getCallerJids(m).some(jid =>
            normalize(mod) === normalize(jid)
        )
    );
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

module.exports = {
    tags: ["gacha"],
    cmd: ["addwaifu", "addw"],
    help: ["addwaifu"],

    exec: async (m, Moody) => {
        try {
            if (!(await hasPermission(m))) {
                return m.reply(
                    "Solamente los moderadores del bot pueden agregar waifus."
                );
            }

            let text = getMessageText(m);

            text = text.replace(
                /^\.?(?:addwaifu|add)\s*/i,
                ""
            ).trim();

            if (!text) {
                return m.reply(
                    "Formato incorrecto.\n\n" +
                    "Uso:\n" +
                    ".addwaifu Nombre|Categoría|Valor|URL1, URL2, URL3\n\n" +
                    "Ejemplo:\n" +
                    ".addwaifu Mikasa Ackerman|Shingeki No Kyoujin|1500|https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg\n\n" +
                    "Si el personaje ya existe, las imágenes se agregan a ese personaje."
                );
            }

            const parts = text.split("|").map(x => x.trim());

            if (parts.length !== 4) {
                return m.reply(
                    "Debes proporcionar exactamente 4 datos separados por |."
                );
            }

            const [name, category, rawValue, rawImages] = parts;
            const value = Number(rawValue);

            if (!name || !category || !rawValue || !rawImages) {
                return m.reply(
                    "Ningún campo puede estar vacío."
                );
            }

            if (!Number.isSafeInteger(value) || value <= 0) {
                return m.reply(
                    "El valor debe ser un número entero positivo."
                );
            }

            const imageUrls = [];
            for (const image of rawImages.split(",").map(url => url.trim()).filter(Boolean)) {
                let imageUrl;

                try {
                    imageUrl = new URL(image);
                } catch {
                    return m.reply(
                        `El enlace de la imagen no es válido: ${image}`
                    );
                }

                if (imageUrl.protocol !== "https:") {
                    return m.reply(
                        `La imagen debe utilizar HTTPS: ${image}`
                    );
                }

                imageUrls.push(imageUrl.toString());
            }

            if (!imageUrls.length) {
                return m.reply(
                    "Debes proporcionar al menos un enlace de imagen."
                );
            }

            const waifus = loadWaifus();

            const existing = waifus.find(waifu =>
                waifu.name.toLowerCase() === name.toLowerCase() &&
                waifu.category.toLowerCase() === category.toLowerCase()
            );

            if (existing) {
                const storedImages = Array.isArray(existing.images)
                    ? existing.images.filter(Boolean)
                    : existing.image
                        ? [existing.image]
                        : [];
                const images = [...new Set(storedImages.flatMap(image =>
                    String(image)
                        .split(/,\s*(?=(?:%20)?https:\/\/)/i)
                        .map(url => url.trim().replace(/^%20(?=https:\/\/)/i, ""))
                        .filter(Boolean)
                ))];

                const newImages = imageUrls.filter(image => !images.includes(image));

                if (!newImages.length) {
                    existing.images = images;
                    saveWaifus(waifus);

                    return m.reply(
                        `*Esta imagen ya está registrada para el personaje.*\n\n` +
                        `*Nombre:* ${existing.name}\n` +
                        `*Imágenes:* ${images.length}`
                    );
                }

                images.push(...newImages);

                existing.images = images;

                if (!existing.image) {
                    existing.image = images[0];
                }

                saveWaifus(waifus);

                return m.reply(
                    `*Imagen agregada correctamente.*\n\n` +
                    `*Nombre:* ${existing.name}\n` +
                    `*Categoría:* ${existing.category}\n` +
                    `*Imágenes:* ${images.length}\n` +
                    `*Imágenes agregadas:*\n${newImages.join("\n")}`
                );
            }

            const newWaifu = {
                id: Date.now().toString(),
                name,
                category,
                value,
                image: imageUrls[0],
                images: imageUrls,
                owner: null,
                addedBy: m.sender,
                addedAt: new Date().toISOString()
            };

            waifus.push(newWaifu);
            saveWaifus(waifus);

            return m.reply(
                `*PERSONAJE AGREGADO A ROLLWAIFU*\n\n` +
                `*Nombre:* ${name}\n` +
                `*Categoría:* ${category}\n` +
                `*Valor:* ${value}\n` +
                `*Imágenes:* ${imageUrls.length}\n` +
                `${imageUrls.join("\n")}\n\n` +
                `Puedes agregar más imágenes repitiendo el comando con el mismo nombre.`
            );

        } catch (error) {
            console.error("[addwaifu] Error:", error);

            return m.reply(
                "Ocurrió un error al registrar el personaje."
            );
        }
    }
};
