
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "waifus.json");
const SHOP_PATH = path.join(__dirname, "data", "tienda.json");
const TRADE_PATH = path.join(__dirname, "data", "trades.json");

const TRADE_TIME = 2 * 60 * 1000;

function normalize(jid = "") {
    return String(jid)
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
}

function normalizeJid(jid = "") {
    return String(jid).trim().replace(/:\d+@/, "@");
}

module.exports = {
    tags: ["gacha"],
    cmd: ["trade"],
    help: ["trade"],

    exec: async (m, Moody, { prefix = ".", cmd = "trade", args: rawArgs = [] } = {}) => {
        try {
            if (!m.isGroup) {
                return m.reply("Este comando solo funciona en grupos.");
            }

            if (!fs.existsSync(DB_PATH)) {
                return m.reply("No existe la base de datos de waifus.");
            }

            const waifus = JSON.parse(
                fs.readFileSync(DB_PATH, "utf8")
            );

            if (!fs.existsSync(TRADE_PATH)) {
                fs.writeFileSync(TRADE_PATH, "{}");
            }

            const trades = JSON.parse(
                fs.readFileSync(TRADE_PATH, "utf8")
            );

            const args = rawArgs.join(" ").trim();

            const saveTrades = () => {
                fs.writeFileSync(
                    TRADE_PATH,
                    JSON.stringify(trades, null, 2)
                );
            };

            if (/^aceptar$/i.test(args)) {
                const trade = trades[m.chat];

                if (!trade) {
                    return m.reply("No hay intercambios pendientes en este grupo.");
                }

                if (trade.expiresAt < Date.now()) {
                    delete trades[m.chat];
                    saveTrades();
                    return m.reply("La solicitud de intercambio ha expirado.");
                }

                if (normalize(m.sender) !== normalize(trade.recipient)) {
                    return m.reply("Solo el usuario que recibió la solicitud puede aceptarla.");
                }

                const offered = waifus.find(w => w.id === trade.offeredId);
                const requested = waifus.find(w => w.id === trade.requestedId);

                if (
                    !offered ||
                    !requested ||
                    normalize(offered.owner) !== normalize(trade.requester) ||
                    normalize(requested.owner) !== normalize(trade.recipient)
                ) {
                    delete trades[m.chat];
                    saveTrades();

                    return m.reply(
                        "El intercambio ya no es válido. Alguno de los personajes cambió de propietario."
                    );
                }

                offered.owner = trade.recipient;
                requested.owner = trade.requester;

                offered.transferredAt = new Date().toISOString();
                requested.transferredAt = new Date().toISOString();

                if (fs.existsSync(SHOP_PATH)) {
                    const shop = JSON.parse(
                        fs.readFileSync(SHOP_PATH, "utf8")
                    );

                    delete shop[offered.id];
                    delete shop[requested.id];

                    fs.writeFileSync(
                        SHOP_PATH,
                        JSON.stringify(shop, null, 2)
                    );
                }

                fs.writeFileSync(
                    DB_PATH,
                    JSON.stringify(waifus, null, 2)
                );

                delete trades[m.chat];
                saveTrades();

                return Moody.sendMessage(
                    m.chat,
                    {
                        text:
                            `*¡INTERCAMBIO COMPLETADO!*\n\n` +
                            `@${trade.requester.split("@")[0]} entregó:\n` +
                            `${offered.name}\n\n` +
                            `@${trade.recipient.split("@")[0]} entregó:\n` +
                            `${requested.name}\n\n` +
                            `¡Los personajes ahora tienen nuevos propietarios!`,
                        mentions: [trade.requester, trade.recipient]
                    },
                    { quoted: m }
                );
            }

            if (/^rechazar$/i.test(args)) {
                const trade = trades[m.chat];

                if (!trade) {
                    return m.reply("No hay intercambios pendientes.");
                }

                if (normalize(m.sender) !== normalize(trade.recipient)) {
                    return m.reply("Solo el destinatario puede rechazar el intercambio.");
                }

                delete trades[m.chat];
                saveTrades();

                return m.reply("Has rechazado la solicitud de intercambio.");
            }

            if (/^cancelar$/i.test(args)) {
                const trade = trades[m.chat];

                if (!trade) {
                    return m.reply("No hay intercambios pendientes.");
                }

                if (normalize(m.sender) !== normalize(trade.requester)) {
                    return m.reply("Solo quien inició el intercambio puede cancelarlo.");
                }

                delete trades[m.chat];
                saveTrades();

                return m.reply("Has cancelado tu solicitud de intercambio.");
            }

            if (trades[m.chat]) {
                if (trades[m.chat].expiresAt > Date.now()) {
                    return m.reply(
                        "Ya existe un intercambio pendiente en este grupo."
                    );
                }

                delete trades[m.chat];
                saveTrades();
            }

            if (!args.includes("|")) {
                return m.reply(
                    "Formato incorrecto.\n\n" +
                    "Responde al mensaje del usuario con:\n" +
                    `${prefix}${cmd} Esdeath|Mikasa\n\n` +
                    `Aceptar: ${prefix}${cmd} aceptar\n` +
                    `Rechazar: ${prefix}${cmd} rechazar\n` +
                    `Cancelar: ${prefix}${cmd} cancelar`
                );
            }

            const contextInfo =
                m.message?.extendedTextMessage?.contextInfo ||
                m.msg?.contextInfo ||
                {};

            const mentioned =
                contextInfo.mentionedJid ||
                m.mentionedJid ||
                [];

            const recipient = normalizeJid(
                mentioned[0] ||
                contextInfo.participant ||
                m.quoted?.sender ||
                ""
            );

            if (!recipient) {
                return m.reply(
                    "Debes mencionar al usuario o responder a uno de sus mensajes."
                );
            }

            if (normalize(recipient) === normalize(m.sender)) {
                return m.reply("No puedes intercambiar personajes contigo mismo.");
            }

            const parts = args.split("|").map(x =>
                x.replace(/@\d+/g, "").trim()
            );

            if (parts.length !== 2 || !parts[0] || !parts[1]) {
                return m.reply(
                    `Formato incorrecto.\n\nEjemplo: ${prefix}${cmd} Esdeath|Mikasa`
                );
            }

            const [offeredName, requestedName] = parts;

            const offered = waifus.find(w =>
                w.name.toLowerCase() === offeredName.toLowerCase()
            );

            const requested = waifus.find(w =>
                w.name.toLowerCase() === requestedName.toLowerCase()
            );

            if (!offered) {
                return m.reply(`No encontré a ${offeredName}.`);
            }

            if (!requested) {
                return m.reply(`No encontré a ${requestedName}.`);
            }

            if (offered.id === requested.id) {
                return m.reply("No puedes intercambiar un personaje por sí mismo.");
            }

            if (normalize(offered.owner) !== normalize(m.sender)) {
                return m.reply(`${offered.name} no te pertenece.`);
            }

            if (normalize(requested.owner) !== normalize(recipient)) {
                return m.reply(
                    `${requested.name} no pertenece al usuario seleccionado.`
                );
            }

            trades[m.chat] = {
                requester: m.sender,
                recipient,
                offeredId: offered.id,
                requestedId: requested.id,
                expiresAt: Date.now() + TRADE_TIME
            };

            saveTrades();

            await Moody.sendMessage(
                m.chat,
                {
                    text:
                        `*SOLICITUD DE INTERCAMBIO*\n\n` +
                        `De: @${m.sender.split("@")[0]}\n` +
                        `Ofrece: ${offered.name}\n\n` +
                        `Para: @${recipient.split("@")[0]}\n` +
                        `Recibirá: ${requested.name}\n\n` +
                        `Tienes 2 minutos para responder.\n\n` +
                        `Aceptar: ${prefix}${cmd} aceptar\n` +
                        `Rechazar: ${prefix}${cmd} rechazar`,
                    mentions: [m.sender, recipient]
                },
                { quoted: m }
            );

        } catch (error) {
            console.error("Error en trade:", error);
            await m.reply("Ocurrió un error al realizar el intercambio.");
        }
    }
};
