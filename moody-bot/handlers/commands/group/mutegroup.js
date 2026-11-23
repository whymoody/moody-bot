const { getGroupContext } = require("../../../utils/groupHelper");

module.exports = {
    cmd: ["mutegroup","closegroup", "opengroup"],
    desc: "Abre o cierra el grupo (sin args = toggle)",
    tags: ["group"],
    exec: async (m, sock, { args, prefix, cmd }) => {
        const ctx = await getGroupContext(sock, m);
        if (!ctx.isGroup) return m.reply("Solo funciona en grupos.");
        if (ctx.error) return m.reply(`${ctx.error}`);
        if (!ctx.isBotAdmin) return m.reply("Necesito ser admin para cambiar los ajustes del grupo.");
        if (!ctx.isAdmin && !ctx.isSuperAdmin) return m.reply("Solo admins pueden usar este comando.");

        const arg = (args[0] || "").toLowerCase();
        const estaCerrado = ctx.metadata.announce === true;

        let accion;
        if (["on", "close", "cerrar"].includes(arg)) accion = "cerrar";
        else if (["off", "open", "abrir"].includes(arg)) accion = "abrir";
        else if (["mute", "closegroup"].includes(cmd)) accion = "cerrar";
        else if (["unmute", "opengroup"].includes(cmd)) accion = "abrir";
        else accion = estaCerrado ? "abrir" : "cerrar";

        try {
            if (accion === "cerrar") {
                await sock.groupSettingUpdate(ctx.jid, "announcement");
                await m.reply("*Grupo cerrado.*\n\nSolo los admins pueden enviar mensajes.");
            } else {
                await sock.groupSettingUpdate(ctx.jid, "not_announcement");
                await m.reply("*Grupo abierto.*\n\nTodos los miembros pueden enviar mensajes.");
            }
        } catch (e) {
            console.error("[MUTEGROUP]", e);
            m.reply(`No se pudo cambiar el estado: ${e.message}`);
        }
    }
};