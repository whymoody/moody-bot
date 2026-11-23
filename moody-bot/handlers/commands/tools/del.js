
module.exports = {
    cmd: ["del", "borrar"],
    desc: "Borra el mensaje al que estás respondiendo",
    tags: ["tools"],
    exec: async (m, sock) => {
        const jid = m.chat || m.key.remoteJid;
        const ctx = m.message?.extendedTextMessage?.contextInfo;

        if (!ctx?.stanzaId) {
            return m.reply("Responde al mensaje que quieres borrar con este comando.");
        }

        const quotedKey = m.quoted?.key;
        const participant = ctx.participant || quotedKey?.participant;

        try {
            await sock.sendMessage(jid, {
                delete: {
                    remoteJid: jid,
                    fromMe: Boolean(m.quoted?.fromMe ?? quotedKey?.fromMe),
                    id: ctx.stanzaId,
                    ...(participant ? { participant } : {})
                }
            });
        } catch (e) {
            console.error("[DEL]", e?.message || e);
            return m.reply(`No se pudo borrar: ${e?.message || "error desconocido"}`);
        }
    }
};