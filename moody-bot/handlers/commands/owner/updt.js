const { exec } = require("child_process");

module.exports = {
  tags: ["owner"],
  help: ["updt"],
  cmd: ["updt"],
  owner: true,
  exec: async (m, client) => {
    await m.reply("*Buscando actualizaciones*");

    // 🚀 Usamos exec (asíncrono) para no congelar el bot
    exec("git pull origin master", async (error, stdout, stderr) => {
      if (error) {
        console.error("[UPDATE ERROR]", error.message);
        return m.reply(`❌ Error al actualizar:\n_${error.message}_`);
      }

      // Limpiamos la salida para ocultar IPs
      const cleanOutput = stdout.toString().replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, "");

      if (cleanOutput.includes("Already up to date.") || cleanOutput.includes("Ya está actualizado")) {
        return m.reply("✅ *El bot ya está en la última versión.*");
      }

      await m.reply(`✅ *Actualización descargada:*\n\n_${cleanOutput}_\n\n♻️ *Reiniciando el bot para aplicar cambios...*`);

      
      setTimeout(() => {
        
        process.exit(1); 
      }, 3000);
    });
  },
};