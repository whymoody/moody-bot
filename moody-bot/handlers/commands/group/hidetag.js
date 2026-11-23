const { getGroupContext } = require("../../../utils/groupHelper");

module.exports = {
    cmd: ["hidetag", "htag", "hidden"],
    desc: "Menciona a todos sin que se vea en el texto",
    tags: ["group"],
    exec: async (m, sock, { args, prefix, cmd }) => {
        const ctx = await getGroupContext(sock, m);
        if (!ctx.isGroup) return m.reply("Solo funciona en grupos.");
        if (ctx.error) return m.reply(`${ctx.error}`);
        if (!ctx.isAdmin && !ctx.isSuperAdmin) return m.reply("Solo admins pueden usar este comando.");

        let texto = args.join(" ").trim();
        const ctxInfo = m.message?.extendedTextMessage?.contextInfo;
        const quoted = ctxInfo?.quotedMessage;

        if (!texto && quoted) {
            texto = quoted.conversation ||
                    quoted.extendedTextMessage?.text ||
                    quoted.imageMessage?.caption ||
                    quoted.videoMessage?.caption ||
                    "";
        }

        if (!texto) {
            return m.reply(`*Uso:* ${prefix}${cmd} Tu mensaje\nO responde a un mensaje con ${prefix}${cmd}`);
        }

        const mentions = ctx.participants
            .map(p => p.id || p.jid || p.phoneNumber)
            .filter(Boolean);

        try {
            await sock.sendMessage(ctx.jid, {
                text: texto,
                mentions
            }, { quoted: m });
        } catch (e) {
            console.error("[HIDETAG]", e);
            m.reply(`No se pudo enviar el mensaje: ${e.message}`);
        }
    }
};