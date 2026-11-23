const { jidNormalizedUser } = require("@whiskeysockets/baileys");

module.exports = {
    cmd: ["pp", "setpp", "botpp"],
    desc: "Cambia la foto de perfil del bot (solo owner)",
    tags: ["owner"],
    owner: true,
    exec: async (m, sock) => {
        if (m.quoted?.mtype !== "imageMessage") {
            return m.reply("Responde a una imagen con este comando para cambiar la foto del bot.");
        }

        try {
            const buffer = await sock.downloadMediaMessage(m.quoted);
            const botJid = sock.user?.id;

            if (!botJid) {
                throw new Error("No se pudo identificar la cuenta de WhatsApp del bot.");
            }

            await sock.updateProfilePicture(jidNormalizedUser(botJid), buffer);

            await m.reply("Foto de perfil del bot actualizada.");
        } catch (e) {
            console.error("[SETPP]", e?.message || e);
            return m.reply(`No se pudo cambiar la foto: ${e?.message || "error desconocido"}`);
        }
    }
};