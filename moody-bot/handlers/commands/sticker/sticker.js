const { cropStyle, Sticker } = require('../../../utils/sticker')
const { Emoji } = require('../../../utils/exif')
const { isUrl } = require('../../../utils/index')
let { statistics } = require('../../../db')
let packMessage = require('../../../utils/config.json')

module.exports = {
  tags: ['sticker'],
  flags: ['args'],
  args: ['send/reply media'],
  cmd: ['sticker', 's', 'stiker'],
  help: ['sticker'],
  exec: async (m, client, { prefix, flags, cmd, arg, body, url }) => {
    if (typeof arg === 'string' && arg.trim().toLowerCase() === 'help') {
      return m.reply(
        `> *🚩 Variantes de .sticker:*\n\n${cropStyle
          .map(x => '--' + x)
          .join('\n')}\n\n*🌾 Ejemplo :* ${prefix}sticker --circle`
      )
    }

    let crop = flags.find(v => cropStyle.map(x => x == v.toLowerCase()))
    let packname = /\|/i.test(body)
      ? arg.split('|')[0]
      : packMessage.stickerMetadata.packauthor
    let stickerAuthor = /\|/i.test(body)
      ? arg.split('|')[1]
      : packMessage.stickerMetadata.packname
    let categories = Object.keys(Emoji).includes(arg.split('|')[2])
      ? arg.split('|')[2]
      : 'love' || 'love'
    try {
      if (
        m.mtype == 'imageMessage' ||
        (m.quoted && m.quoted.mtype == 'imageMessage')
      ) {
        const message = m.quoted ? m.quoted : m
        const buff = await client.downloadMediaMessage(message)
        const data = new Sticker(
          buff,
          { packname, author: stickerAuthor, packId: '', categories },
          crop
        )
        await client.sendMessage(m.chat, await data.toMessage(), { quoted: m })
        statistics('sticker')
      } else if (
        m.mtype == 'videoMessage' ||
        (m.quoted && m.quoted.mtype == 'videoMessage')
      ) {
        if (
          m.quoted ? m.quoted.seconds > 15 : m.message.videoMessage.seconds > 15
        )
          return m.reply('Duración demasiado larga, máximo 15 segundos')
        const message = m.quoted ? m.quoted : m
        const buff = await client.downloadMediaMessage(message)
        const data = new Sticker(buff, {
          packname,
          author: stickerAuthor,
          packId: '',
          categories
        })
        await client.sendMessage(m.chat, await data.toMessage(), { quoted: m })
        statistics('sticker')
      } else if (
        m.mtype == 'documentMessage' ||
        (m.quoted && m.quoted.mtype == 'documentMessage')
      ) {
        const message = m.quoted ? m.quoted : m
        const buff = await client.downloadMediaMessage(message)
        const data = new Sticker(
          buff,
          { packname, author: stickerAuthor, packId: '', categories },
          crop
        )
        await client.sendMessage(m.chat, await data.toMessage(), { quoted: m })
      } else if (
        m.quoted &&
        m.quoted.mtype == 'stickerMessage' &&
        !m.quoted.isAnimated
      ) {
        const buff = await client.downloadMediaMessage(m.quoted)
        const data = new Sticker(
          buff,
          { packname, author: stickerAuthor, packId: '', categories },
          crop
        )
        await client.sendMessage(m.chat, await data.toMessage(), { quoted: m })
        statistics('sticker')
      } else if (isUrl(url)) {
        const data = new Sticker(
          url,
          { packname, author: stickerAuthor, packId: '', categories },
          crop
        )
        await client.sendMessage(m.chat, await data.toMessage(), { quoted: m })
        statistics('sticker')
      } else if (flags.find(v => v.match(/args|help/))) {
        m.reply(
          `> *🚩 Lista de variantes:*\n\n${cropStyle
            .map(x => '--' + x)
            .join('\n')}\n\n*🌾 Ejemplo :* ${prefix + cmd} --circle`
        )
      } else {
        m.reply(`*🎈 Menciona una imagen/video/gif junto al comando:* ${prefix + cmd}\n

* *${prefix + cmd} --rounded* →  ( *¡Redondeado!* )
* *${prefix + cmd} --circle*  →  ( *¡Circular!* )
* *${prefix + cmd} --nobg*  →  ( *¡Sin fondo!* )
* *${prefix + cmd} --negate*  →  ( *¡Negativo!* )
* *${prefix + cmd} --pixelate*  →  ( *¡Pixelado!* )
* *${prefix + cmd} --greyscale*  →  ( *Color Grey!* )
* *${prefix + cmd} --grayscale*  →  ( *¡Color Gray!* )
* *${prefix + cmd} --b-w*  →  ( *¡Color Negro!* )
* *${prefix + cmd} --cmyk*  →  ( *¡No se!* )
* *${prefix + cmd} --srgb*  →  ( *¡Color Srgb!* )

\`🌾 Enlace :\`
> ${prefix + cmd} *+ Url*`)
      }
    } catch (error) {
      m.reply(new Error(error).message)
      console.log(error)
    }
  }
}
