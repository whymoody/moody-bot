const { groupManage } = require('../../../db')

module.exports = {
  cmd: ['setwelcome', 'welcome', "bienvenida", "bien venida"],
  help: ['welcome'],
  args: ['msg', 'on', 'off'],
  tags: ['group'],
  group: true,
  botAdmin: false,
  admin: true,
  exec: async (m, Moody, { prefix, cmd, args, text }) => {
    try {
      let json = await groupManage.get(m.chat);
      if (!json.id) {
        const metadata = await Moody.groupMetadata(m.chat);
        await groupManage.add(m.chat, metadata.subject);
        json = await groupManage.get(m.chat);
      }
      if (args[0] == 'on') {
        if (json.welcome_status)
          return m.reply('*La bienvenida ya ha sido activado anteriormente.*')
        json.welcome_status = 1
        await groupManage.update(m.chat, { welcome_status: json.welcome_status })
        m.reply(
          '*La bienvenida ha sido activado con el mensaje ∙* \n' +
            json.welcome_text
        )
      } else if (args[0] == 'off') {
        if (!json.welcome_status)
          return m.reply('*La bienvenida ha sido deshabilitado anteriormente.*')
        json.welcome_status = 0
        await groupManage.update(m.chat, { welcome_status: json.welcome_status })
        m.reply('*La bienvenida ha sido deshabilitado.*')
      } else if (args[0] == 'msg') {
        const q = args.slice(1).join(' ')
        if (!q)
          return m.reply(
            `*Ingresa el nuevo mensaje de bienvenida para este grupo.*\n*Ejemplo ∙* ${
              prefix + cmd
            } *Bienvenido ∙* @user\n*Grupo ∙* {title}`
          )
        await groupManage.update(m.chat, { welcome_text: q })
        m.reply(
          '*El mensaje de bienvenida ha sido cambiado en este grupo por∙* \n' +
            q
        )
      } else {
        m.reply(`*Ejemplo ∙*\n
*${prefix + cmd} ∙* < Msg / On / Off >
*msg ∙* Cambiar el mensaje de bienvenida
*on ∙* Activar
*off ∙* Desactivar

*Formato ∙*
*@user ∙* Mensaje para mencionar al usuario.
*{title} ∙* Mensaje con el nombre del grupo.
*{foto} ∙* Foto del nuevo miembro.
`)
      }
    } catch (error) {
      m.reply(new Error(error).message);
      console.log(error)
    }
  }
}
