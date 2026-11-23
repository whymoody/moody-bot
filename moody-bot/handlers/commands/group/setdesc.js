const { getGroupContext } = require("../../../utils/groupHelper");

module.exports = {
    cmd: ["setdesc", "setgroupdesc"],
    desc: "Cambia la descripción del grupo",
    tags: ["group"],
    exec: async (m, sock, { args, prefix, cmd }) => {
        const ctx = await getGroupContext(sock, m);
        if (!ctx.isGroup) return m.reply("Solo funciona en grupos.");
        if (ctx.error) return m.reply(`${ctx.error}`);
        if (!ctx.isBotAdmin) return m.reply("Necesito ser admin.");
        if (!ctx.isAdmin && !ctx.isSuperAdmin) return m.reply("Solo admins pueden usar este comando.");

        const nuevaDesc = args.join(" ").trim();
        if (!nuevaDesc) return m.reply(`*Uso:* ${prefix}${cmd} Nueva descripción del grupo`);
        if (nuevaDesc.length > 500) return m.reply("La descripción no puede superar los 500 caracteres.");

        try {
            await sock.groupUpdateDescription(ctx.jid, nuevaDesc);
            await m.reply("Descripción del grupo actualizada.");
        } catch (e) {
            console.error("[GCDESC]", e);
            m.reply(`No se pudo cambiar la descripción: ${e.message}`);
        }
    }
};