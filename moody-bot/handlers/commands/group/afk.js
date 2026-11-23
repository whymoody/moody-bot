const { AFK } = require("../../../db");

module.exports = {
    tags: ['group'],
    cmd: ['afk'],
    help: ['afk'],
    group: true,
    exec: async (m, client, { args, formattedTitle }) => {
        try {
            const metadata = await client.groupMetadata(m.chat);
            const groupName = metadata.subject || formattedTitle || "Grupo sin nombre";
            const reason = args.join(" ").trim() || "-";
            await AFK.add(m.sender, m.chat, groupName, Date.now(), reason);
            await m.reply(`✅ ${m.pushName} ¡Ahora está AFK!`, m.chat);
            try {
                await client.sendMessage(m.sender, {
                    text: `✅ Activaste el modo AFK en *${groupName}*.\nRazón: ${reason}\nAl enviar otro mensaje en el grupo, se quitará tu estado AFK.`,
                });
            } catch (error) {
                console.error("[AFK PRIVATE MESSAGE ERROR]", error);
                await m.reply("✅ AFK quedó activado, pero no pude enviarte la confirmación por privado.");
            }
        } catch (error) {
            console.error("[AFK COMMAND ERROR]", error);
            await m.reply(`Error al activar AFK: ${error.message}`);
        }
    }
};
