
const fs = require("fs");
const path = require("path");
const { sendImageFromUrl } = require("../../../utils/media");

const DB_PATH = path.join(__dirname, "data", "waifus.json");

function getImages(waifu) {
    if (Array.isArray(waifu.images) && waifu.images.length) {
        return waifu.images.filter(Boolean);
    }

    return waifu.image ? [waifu.image] : [];
}

module.exports = {
    tags: ["gacha"],
    cmd: ["wimage"],
    help: ["wimage"],

    exec: async (m, Moody, { args = [] } = {}) => {
        try {
            const nombre = args.join(" ").trim();

            if (!nombre) {
                return m.reply(
                    "Escribe el nombre del personaje.\n\nEjemplo: .wimage Esdeath"
                );
            }

            if (!fs.existsSync(DB_PATH)) {
                return m.reply("No existe la base de datos de waifus.");
            }

            const waifus = JSON.parse(
                fs.readFileSync(DB_PATH, "utf8")
            );

            const personajes = waifus.filter(w =>
                w.name.toLowerCase() === nombre.toLowerCase()
            );

            const imagenes = personajes.flatMap(getImages);

            if (imagenes.length === 0) {
                return m.reply(
                    `No encontré imágenes de ${nombre} en la base de datos.`
                );
            }

            const imagen = imagenes[
                Math.floor(Math.random() * imagenes.length)
            ];

            await sendImageFromUrl(Moody, m.chat, imagen, {
                caption: `${personajes[0].name}`,
                quoted: m
            });

        } catch (error) {
            console.error("Error en wimage:", error);
            await m.reply("Ocurrió un error al enviar la imagen.");
        }
    }
};
