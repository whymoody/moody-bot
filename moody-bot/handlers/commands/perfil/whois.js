
const { Users } = require("../../../db");
const { fetchAbout } = require("../../../utils/whatsapp");
const { digits, messageJids, groupJids } = require("../../../utils/identity");

const INVALID_NAMES = ["no disponible", "desconocido", "undefined", "null"];

function isValidName(name) {
    const value = String(name || "").trim();
    if (!value || INVALID_NAMES.includes(value.toLowerCase())) return false;
    return !value.endsWith("@lid") && !value.endsWith("@s.whatsapp.net");
}

async function resolveJids(target, m, sock) {
    const jids = messageJids(target, m);
    const extra = await groupJids(jids, m.chat, sock);
    return [...new Set([target, ...jids, ...extra])].filter(Boolean);
}

async function resolveName(jids, sock) {
    for (const jid of jids) {
        try {
            const name = await sock.getName(jid);
            if (isValidName(name)) return name.trim();
        } catch {}
    }

    for (const jid of jids) {
        try {
            const user = await Users.get(jid);
            if (isValidName(user?.name)) return user.name.trim();
        } catch {}
    }

    for (const jid of jids) {
        const contact = sock.store?.contacts?.[jid];
        const name = contact?.notify || contact?.name || contact?.verifiedName;
        if (isValidName(name)) return name.trim();
    }

    return null;
}

module.exports = {
    cmd: ["whois", "quienes",],
    desc: "Muestra bio, foto y fecha del estado de un usuario",
    tags: ["perfil"],
    exec: async (m, sock, { args } = {}) => {
        const chat = m.chat || m.key?.remoteJid;
        const ctx = m.message?.extendedTextMessage?.contextInfo;

        let target =
            m.quoted?.sender ||
            ctx?.participant ||
            ctx?.mentionedJid?.[0] ||
            m.mentionedJid?.[0] ||
            null;

        if (!target && args?.[0]) {
            const num = String(args[0]).replace(/[^0-9]/g, "");
            if (num.length >= 8) target = num + "@s.whatsapp.net";
        }

        if (!target) target = m.sender;

        try {
            const jids = await resolveJids(target, m, sock);
            const phone = jids.find(
                (item) => item.endsWith("@s.whatsapp.net") || item.endsWith("@c.us"),
            );
            const num = digits(phone || target);

            const pp = await sock
                .profilePictureUrl(target, "image")
                .catch(() => null);

            const { about, setAt } = await fetchAbout(sock, [phone, target]);
            const nombre = await resolveName(jids, sock);

            const fecha = setAt
                ? setAt.toLocaleString("es-ES", {
                    year: "numeric", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit"
                })
                : "Desconocida";

            const caption = `	╭  ✦ Info de usuario ✦  ╮\n
 *◦ Número :* +${num}
 *◦ Nombre :* ${nombre || "No disponible"}
 *◦ About :* ${about || "No disponible"}
 *◦ Fecha del about :* ${fecha}\n
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ`;

            if (pp) {
                await sock.sendMessage(chat, { image: { url: pp }, caption }, { quoted: m });
            } else {
                await sock.sendMessage(chat, {
                    text: caption + "\n\n_Sin foto de perfil visible._"
                }, { quoted: m });
            }
        } catch (e) {
            console.error("[WHOIS]", e);
            m.reply(`Error al obtener la info: ${e.message}`);
        }
    }
};