const { getGroupContext, obtenerTargetJid } = require("../../../utils/groupHelper");

module.exports = {
    cmd: ["demote", "quitadmin"],
    desc: "Quita los permisos de admin a un usuario",
    tags: ["group"],
    exec: async (m, sock, { args, prefix, cmd }) => {
        const ctx = await getGroupContext(sock, m);
        if (!ctx.isGroup) return m.reply("Solo funciona en grupos.");
        if (ctx.error) return m.reply(`${ctx.error}`);
        if (!ctx.isBotAdmin) return m.reply("Necesito ser admin.");
        if (!ctx.isAdmin && !ctx.isSuperAdmin) return m.reply("Solo admins pueden usar este comando.");

        const target = obtenerTargetJid(m, args);
        if (!target) {
            return m.reply(`*Uso:* ${prefix}${cmd} @usuario\nO responde a un mensaje con ${prefix}${cmd}`);
        }

        const targetNum = target.split("@")[0];
        const participante = ctx.participants.find(p => {
            const pId = p.id || p.jid;
            return pId === target || p.phoneNumber === target;
        });

        if (!participante) {
            return sock.sendMessage(ctx.jid, {
                text: `@${targetNum} no está en el grupo.`,
                mentions: [target]
            }, { quoted: m });
        }
        if (participante.admin === "superadmin") {
            return m.reply("No puedo degradar al creador del grupo.");
        }
        if (!participante.admin) {
            return sock.sendMessage(ctx.jid, {
                text: `@${targetNum} no es admin.`,
                mentions: [target]
            }, { quoted: m });
        }

        try {
            await sock.groupParticipantsUpdate(ctx.jid, [target], "demote");
            await sock.sendMessage(ctx.jid, {
                text: `@${targetNum} ya no es admin.`,
                mentions: [target]
            }, { quoted: m });
        } catch (e) {
            console.error("[DEMOTE]", e);
            m.reply(`No se pudo degradar: ${e.message}`);
        }
    }
};