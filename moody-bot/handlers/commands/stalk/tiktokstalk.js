const axios = require("axios");

module.exports = {
    cmd: ["tiktokstalk", "ttstalk", "tstalk"],
    desc: "Obtiene información de un perfil de TikTok",
    tags: ["stalk"],
    exec: async (m, sock, { args }) => {
        const jid = m.chat || m.key.remoteJid;
        let username = args[0];

        if (!username) {
            return m.reply("Uso: .tiktokstalk <usuario>\nEjemplo: .tiktokstalk maumancanto");
        }

        
        const cleanUsername = username.replace(/^@/, "").split("/").pop();
        await m.reply("*Obteniendo información...*");

        try {
            const url = `http://127.0.0.1:8008/stalk/${cleanUsername}`;
            const response = await axios.get(url, { timeout: 60000 });

            const data = response.data.data;

            if (!data || !data.usuario) {
                throw new Error("No se encontraron datos (posible usuario privado o no existe).");
            }

            const avatarUrl = data.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

            
            const caption = `	╭  ✦ Tiktok Stalk ✦  ╮\n
∘ Nombre : ${data.nombre || "Desconocido"}
∘ Usuario : @${cleanUsername}
∘ Seguidores : ${data.seguidores || "0"}
∘ Siguiendo : ${data.siguiendo || "0"}
∘ Total likes : ${data.likes || "0"}
∘ Biografía : ${data.bio || "Sin biografía"}\n
| https://www.tiktok.com/@${cleanUsername}`;

            await sock.sendMessage(jid, { 
                image: { url: avatarUrl }, 
                caption: caption 
            }, { quoted: m });

        } catch (e) {
            console.error("[TTSTALK ERROR]", e.message);
            
            if (e.code === 'ECONNREFUSED') {
                await m.reply("Error: El servidor de scraping (Python) está apagado.");
            } else if (e.response && e.response.data && e.response.data.detail) {
                await m.reply(`Error de Scrapling:\n\n_${e.response.data.detail}_`);
            } else {
                await m.reply(`No se pudo obtener el perfil.\n\n_${e.message}_`);
            }
        }
    }
};