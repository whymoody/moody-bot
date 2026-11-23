const { Users } = require("../../../db");
const schema = require("../../../db/schema");

module.exports = {
  tags: ["perfil"],
  cmd: ["setbirth", "setcumple", "setbirthday"],
  help: ["setbirth"],
  args: ["DD/MM o DD/MM/YYYY"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    try {
      const user = await Users.get(m.sender);
      if (!user) return m.reply("Primero debes registrarte en el bot.");

      const birthday = args.join(" ").trim();
      if (!birthday) {
        return m.reply(`° Ejemplo : ${prefix + cmd} 15/08/2000`);
      }

      
      if (!/^\d{1,2}\/\d{1,2}(\/\d{4})?$/.test(birthday)) {
        return m.reply("Formato inválido. Usa *DD/MM* o *DD/MM/YYYY* (Ej: 15/08/2000).");
      }

     
      await schema.ready();
      await Users.update(m.sender, { birthday: birthday });
      
      return m.reply(`Tu cumpleaños ha sido guardado como: *${birthday}*`);
      
    } catch (error) {
      console.error("[SETBIRTH ERROR]", error);
      m.reply("Ocurrió un error al guardar tu cumpleaños.");
    }
  },
};