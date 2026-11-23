const { getGroupContext } = require("../../../utils/groupHelper");

module.exports = {
    cmd: ["revoke", "resetlink", "resetgclink", "newlink"],
    desc: "Resetea el link de invitación del grupo",
    tags: ["group"],
    exec: async (m, sock, { prefix, cmd }) => {
        const ctx = await getGroupContext(sock, m);
        if (!ctx.isGroup) return m.reply("Solo funciona en grupos.");
        if (ctx.error) return m.reply(`${ctx.error}`);
        if (!ctx.isBotAdmin) return m.reply("Necesito ser admin.");
        if (!ctx.isAdmin && !ctx.isSuperAdmin) return m.reply("Solo admins pueden usar este comando.");

        try {
            await sock.groupRevokeInvite(ctx.jid);
            const nuevoCodigo = await sock.groupInviteCode(ctx.jid);
            const nuevoLink = `https://chat.whatsapp.com/${nuevoCodigo}`;

            const totalMiembros = ctx.participants.length;
            const totalAdmins = ctx.participants.filter(p => p.admin).length;

            await m.reply(
                `*LINK RESETEADO*\n\n` +
                `*Grupo:* ${ctx.metadata.subject || "N/A"}\n` +
                `*Miembros:* ${totalMiembros}\n` +
                `*Admins:* ${totalAdmins}\n\n` +
                `*Nuevo link:*\n${nuevoLink}\n\n` +
                `_El link anterior fue revocado._`
            );
        } catch (e) {
            console.error("[REVOKE]", e);
            m.reply(`No se pudo resetear el link: ${e.message}`);
        }
    }
};