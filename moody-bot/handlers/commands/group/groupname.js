const { getGroupContext } = require("../../../utils/groupHelper");

module.exports = {
    cmd: ["groupname", "setgcname", "setgroupname", "gcname"],
    desc: "Cambia el nombre del grupo",
    tags: ["group"],
    exec: async (m, sock, { args, prefix, cmd }) => {
        const ctx = await getGroupContext(sock, m);
        if (!ctx.isGroup) return m.reply("Solo funciona en grupos.");
        if (ctx.error) return m.reply(`${ctx.error}`);
        if (!ctx.isBotAdmin) return m.reply("Necesito ser admin.");
        if (!ctx.isAdmin && !ctx.isSuperAdmin) return m.reply("Solo admins pueden usar este comando.");

        const nuevoNombre = args.join(" ").trim();
        if (!nuevoNombre) return m.reply(`*Uso:* ${prefix}${cmd} Nuevo nombre del grupo`);
        if (nuevoNombre.length > 100) return m.reply("El nombre no puede superar los 100 caracteres.");

        try {
            await sock.groupUpdateSubject(ctx.jid, nuevoNombre);
            await m.reply(`Nombre del grupo cambiado a:\n\n*${nuevoNombre}*`);
        } catch (e) {
            console.error("[GROUPNAME]", e);
            m.reply(`No se pudo cambiar el nombre: ${e.message}`);
        }
    }
};