const { Users } = require("../../../db");
const schema = require("../../../db/schema");

module.exports = {
  tags: ["perfil"],
  cmd: ["setgenre", "setgenero", "setgender"],
  help: ["setgenre"],
  args: ["Masculino / Femenino / Otro"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    try {
      const user = await Users.get(m.sender);
      if (!user) return m.reply("Primero debes registrarte en el bot.");

      let genderInput = args.join(" ").trim().toLowerCase();
      if (!genderInput) {
        return m.reply(`° Ejemplo : ${prefix + cmd} Masculino`);
      }

      let genderToSave = "";

      
      if (["m", "masculino", "hombre", "v", "varon", "varón", "chico"].includes(genderInput)) {
        genderToSave = "Masculino";
      } else if (["f", "femenino", "mujer", "chica"].includes(genderInput)) {
        genderToSave = "Femenino";
      } else if (["o", "otro", "otros"].includes(genderInput)) {
        genderToSave = "Otro";
      } else {
        return m.reply("Género inválido. Opciones válidas: *Masculino*, *Femenino* u *Otro*.");
      }

      
      await schema.ready();
      await Users.update(m.sender, { gender: genderToSave });
      
      return m.reply(`Tu género ha sido guardado como: *${genderToSave}*`);
      
    } catch (error) {
      console.error("[SETGENRE ERROR]", error);
      m.reply("Ocurrió un error al guardar tu género.");
    }
  },
};