const { Sticker } = require('../../../utils/sticker')
const { removeBG } = require('../../../utils/config.json')

module.exports = {
  tags: ['tools'],
  args: ['send/reply image'],
  cmd: ['removebg'],
  help: ['removebg'],
  exec: async (m, client, { prefix, cmd }) => {
    const image =
      m.quoted && m.quoted.mtype === 'imageMessage'
        ? m.quoted
        : m.mtype === 'imageMessage'
          ? m
          : null

    if (!image) {
      return m.reply(
        `Envía o responde a una imagen con el comando: ${prefix + cmd}`
      )
    }

    if (!removeBG) {
      return m.reply(
        'Configura REMOVEBG_API_KEY en el archivo .env para quitar el fondo.'
      )
    }

    try {
      const input = await client.downloadMediaMessage(image)
      const output = await Sticker.removeBG(input)
      await client.sendMessage(
        m.chat,
        { image: output, caption: 'Fondo eliminado.' },
        { quoted: m }
      )
    } catch (error) {
      console.error('[REMOVEBG]', error)
      m.reply(error instanceof Error ? error.message : String(error))
    }
  }
}
