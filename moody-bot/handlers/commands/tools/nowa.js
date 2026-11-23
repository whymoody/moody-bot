
module.exports = {
    cmd: ["nowa", "checknowa"],
    desc: "Lista hasta 10 números que NO tienen WhatsApp (Uso: .nowa 521234567x)",
    tags: ["tools"],
    admin: true,
    exec: async (m, sock, { args, prefix, cmd }) => {
        const jid = m.chat || m.key.remoteJid;
        let match = args[0];

        if (!match) {
            return m.reply(`*Uso:* ${prefix}${cmd} 521234567x\n\n_Reemplaza la letra *x* por el dígito que quieras comprobar (del 0 al 9). Se verificarán 10 números en total._`);
        }

        const xCount = (match.match(/x/gi) || []).length;
        if (xCount === 0) {
            return m.reply("Debes incluir una letra *x* en el número. Ejemplo: 521234567x");
        }
        if (xCount > 1) {
            return m.reply("Por seguridad, solo se permite *una (1)* letra 'x' por comando (máximo 10 números).");
        }

        if (!/^[0-9]+x[0-9]*$/i.test(match) && !/^[0-9]*x[0-9]+$/i.test(match)) {
            return m.reply("Formato inválido. Solo se permiten números y una 'x'. Ejemplo: 521234567x");
        }

        await m.reply("*Verificando 10 números... Por favor espera.*");

        const combinaciones = [];
        for (let i = 0; i <= 9; i++) {
            combinaciones.push(match.toLowerCase().replace("x", i));
        }

        const noExisten = [];
        const siExisten = [];
        const errores = [];

        for (let i = 0; i < combinaciones.length; i += 2) {
            const lote = combinaciones.slice(i, i + 2);
            await Promise.all(lote.map(async (num) => {
                try {
                    const [result] = await sock.onWhatsApp(num);
                    if (result?.exists) {
                        siExisten.push(num);
                    } else {
                        noExisten.push(num);
                    }
                } catch (e) {
                    errores.push(num);
                }
            }));
            if (i + 2 < combinaciones.length) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        let texto = `	╭  ✦ Check WhatsApp ✦  ╮\n\n`;
        texto += ` *◦ Patrón :* ${match}\n`;
        texto += ` *◦ Revisados :* ${combinaciones.length}\n`;
        texto += ` *◦ Con WhatsApp :* ${siExisten.length}\n`;
        texto += ` *◦ Sin WhatsApp :* ${noExisten.length}\n`;
        if (errores.length > 0) texto += ` *◦ Fallidos :* ${errores.length}\n`;

        texto += `\n	╭  ✦ Sin WhatsApp ❌ ✦  ╮\n`;
        if (noExisten.length > 0) {
            noExisten.sort().forEach(num => {
                texto += ` *◦* wa.me/${num}\n`;
            });
        } else {
            texto += ` _Ninguno (todos tienen WhatsApp)_\n`;
        }

        texto += `\n> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ`;

        await sock.sendMessage(jid, { text: texto }, { quoted: m });
    }
};