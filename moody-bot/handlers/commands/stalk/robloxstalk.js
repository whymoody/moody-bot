const axios = require("axios");

module.exports = {
    cmd: ["robloxstalk", "rbxstalk", "roblox"],
    desc: "Obtiene información de un usuario de Roblox",
     tags: ["stalk"],
    exec: async (m, sock, { args }) => {
        const jid = m.chat || m.key.remoteJid;
        let username = args[0];

        if (!username) {
            return m.reply("Uso: .robloxstalk <usuario>\nEjemplo: .robloxstalk Builderman");
        }

        username = username.replace(/^@/, "").split("/").pop();
        await m.reply("*Obteniendo información de Roblox...*");

        try {
            
            const url = `http://127.0.0.1:8010/robloxstalk/${username}`;
            const response = await axios.get(url, { timeout: 30000 });

            const data = response.data.data;

            const caption = `	╭  ✦ Roblox Stalk ✦  ╮\n
∘ Nombre : ${data.nombre || "Desconocido"}
∘ Usuario : @${data.usuario}
∘ ID : ${data.id || "N/A"}
∘ Bio : ${data.bio || "Sin biografía"}
∘ Creado : ${data.creado || "Desconocido"}
∘ Baneado : ${data.baneado ? "Sí" : "No"}
∘ Amigos : ${data.amigos || "0"}
∘ Seguidores : ${data.seguidores || "0"}
∘ Siguiendo : ${data.siguiendo || "0"}\n
| https://www.roblox.com/users/${data.id}/profile`;

            await sock.sendMessage(jid, { 
                image: { url: data.avatar }, 
                caption: caption 
            }, { quoted: m });

        } catch (e) {
            console.error("[ROBLOXSTALK ERROR]", e.message);
            
            if (e.code === 'ECONNREFUSED') {
                await m.reply("Error: El servidor de scraping (Python) está apagado.");
            } else if (e.response && e.response.data && e.response.data.detail) {
                await m.reply(`Error de Roblox:\n\n_${e.response.data.detail}_`);
            } else {
                await m.reply(`No se pudo obtener el perfil.\n\n_${e.message}_`);
            }
        }
    }
};