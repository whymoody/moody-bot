module.exports = {
  tags: ["owner"],
  cmd: ["broadcast", "bc"],
  help: ["broadcast"],
  args: ["texto o responder a un mensaje"],
  owner: true,
  exec: async (m, client, { prefix, cmd, args }) => {
    // 1. Obtener la lista de grupos
    try {
      const allGroups = await client.groupFetchAllParticipating();
      const grupos = Object.values(allGroups);
      
      if (grupos.length === 0) {
        return client.sendMessage(m.chat, { text: 'El bot no está en ningún grupo.' }, { quoted: m });
      }

      // 2. Determinar qué se va a enviar
      let esRespuesta = false;
      let forwardMsg = null;
      let textToSend = "";

      if (m.quoted) {
        forwardMsg = typeof m.getQuotedObj === 'function' ? m.getQuotedObj() : null;
        if (!forwardMsg) {
          return client.sendMessage(m.chat, { text: 'No se pudo reconstruir el mensaje citado.' }, { quoted: m });
        }
        esRespuesta = true;
      } else if (args.length > 0) {
        textToSend = args.join(' ');
      } else {
        return client.sendMessage(m.chat, { text: `Uso: ${prefix + cmd} <texto> o responde a un mensaje.` }, { quoted: m });
      }

      // 3. Enviar aviso de inicio
      await client.sendMessage(m.chat, {
        text: `⚠️ *Broadcast iniciado*\n\nGrupos encontrados: ${grupos.length}\nContenido: ${esRespuesta ? 'Mensaje reenviado' : 'Texto'}\n\nEnviando en 3 segundos...`
      }, { quoted: m });

      // Esperar 3 segundos (puedes subirlo a 5 si quieres más margen)
      await new Promise(resolve => setTimeout(resolve, 3000));

      let exito = 0;
      let fallos = 0;

      // 4. Bucle de envío a todos los grupos
      for (const grupo of grupos) {
        try {
          if (esRespuesta) {
            // 🚀 REENVÍO NATIVO DE BAILEYS (Soporta texto, imágenes, videos, stickers, etc.)
            await client.sendMessage(grupo.id, {
              forward: forwardMsg,
              force: true
            });
          } else {
            // Envío de texto normal
            await client.sendMessage(grupo.id, { text: textToSend });
          }
          
          exito++;
          
          // 🚨 PAUSA DE 2 SEGUNDOS ANTI-SPAM
          await new Promise(resolve => setTimeout(resolve, 2000)); 
          
        } catch (err) {
          console.error(`[BROADCAST] Error en el grupo ${grupo.subject || grupo.id}:`, err.message);
          fallos++;
        }
      }

      // 5. Reporte final
      await client.sendMessage(m.chat, {
        text: `*Broadcast completado*\n\n✔️ Enviados con éxito: ${exito}\n❌ Fallos: ${fallos}\n📊 Total de grupos: ${grupos.length}`
      }, { quoted: m });

    } catch (error) {
      console.error("[BROADCAST ERROR]", error);
      await client.sendMessage(m.chat, { text: `Error interno: ${error?.message || error}` }, { quoted: m });
    }
  },
};