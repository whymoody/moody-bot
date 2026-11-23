const { groupManage } = require('../../../db')

module.exports = {
  cmd: ['unmute', 'unmute_bot'],
  help: ['unmute'],
  tags: ['group'],
  group: true,
  botAdmin: false,
  admin: true,
  groupMuteAllowed: true,
  exec: async (m, Moody, { prefix, cmd, args }) => {
    try {
      let json = groupManage.get(m.chat)
      if (!json.mute)
        return m.reply('*🔑 El bot ya ha sido activado anteriormente.*')
      json.mute = false
      groupManage.update(m.chat, json)
      m.reply('*🔑 El bot ha sido habilitado exitosamente.*')
    } catch (error) {
      m.reply(new Error(error).message)
      console.log(error)
    }
  }
}
