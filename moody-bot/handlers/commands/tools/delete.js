
const { getGroupContext } = require("../../../utils/groupHelper");

module.exports = {
    cmd: ["dlt", "delete"],
    desc: "Borra el mensaje citado (requiere bot admin)",
    tags: ["tools"],
    exec: async (m, sock) => {
        const ctx = await getGroupContext(sock, m);
        if (!ctx.isGroup) return m.reply("Solo funciona en grupos.");
        if (ctx.error) return m.reply(`${ctx.error}`);
        if (!ctx.isBotAdmin) return m.reply("Necesito ser admin para borrar mensajes ajenos.");
        if (!ctx.isAdmin && !ctx.isSuperAdmin) return m.reply("Solo admins pueden usar este comando.");

        const msgCtx = m.message?.extendedTextMessage?.contextInfo;
        if (!msgCtx?.stanzaId) {
            return m.reply("Responde al mensaje que quieres borrar.");
        }

        const quotedKey = m.quoted?.key;
        const participant = msgCtx.participant || quotedKey?.participant;

        try {
            await sock.sendMessage(ctx.jid, {
                delete: {
                    remoteJid: ctx.jid,
                    fromMe: Boolean(m.quoted?.fromMe ?? quotedKey?.fromMe),
                    id: msgCtx.stanzaId,
                    ...(participant ? { participant } : {})
                }
            });
        } catch (e) {
            console.error("[DELETE]", e?.message || e);
            return m.reply(`No se pudo borrar: ${e?.message || "error desconocido"}`);
        }
    }
};