const { jidDecode, jidNormalizedUser } = require("@whiskeysockets/baileys");
const { AFK } = require("../../db");
const moment = require("moment-timezone");
const tanda = '```'

module.exports = {
    group: true,
    groupEvent: true,
    exec: async (m, client, { prefix, cmd, body }) => {
        if (m.isBot) return
        let listAfk = await AFK.getAll()
        if (listAfk.length > 0) {
            for (const x of listAfk) {
                if (m.sender == x.jid && x.groupId == m.chat) {
                    if (!body.toLowerCase().startsWith(`${prefix}afk`)) {
                        m.reply(`❌ @${m.sender.split('@')[0]} ¡Ahora no está AFK!`, m.chat, { mentions: [m.sender] })
                        await AFK.delete(m.sender, m.chat)
                    }
                } else {
                    var duration = moment.duration(moment().diff(moment(x.timestamp)));
                    const times = `${tanda}${duration.days()}d: ${duration.hours()}h: ${duration.minutes()}m: ${duration.seconds()}s:${tanda}`
                    const afkJid = jidNormalizedUser(x.jid);
                    const quotedJid = m.quoted?.sender
                        ? jidNormalizedUser(m.quoted.sender)
                        : null;
                    const wasMentioned = (m.mentionedJid || []).some(
                        (jid) => jidNormalizedUser(jid) === afkJid,
                    );
                    const wasNamedInText = String(body || "").includes(x.jid.split("@")[0]);
                    if (
                        m.chat == x.groupId &&
                        (quotedJid === afkJid || wasMentioned || wasNamedInText)
                    ) {
                        let groupName = x.groupName;
                        if (!groupName) {
                            try {
                                const metadata = await client.groupMetadata(m.chat);
                                groupName = metadata.subject;
                            } catch (error) {
                                console.error("[AFK GROUP NAME ERROR]", error);
                            }
                        }
                        groupName = groupName || "Grupo sin nombre";
                        if (/image|video/i.test(m.quoted ? m.quoted.mtype : m.mtype)) {
                            await m.reply(`❌ @${x.jid.split('@')[0]} ¡Está AFK!\n├ Desde ${times}\n└ Razón: *${x.reason}*`, m.chat, { mentions: [x.jid] })
                            let text = `Porque estás ${x.reason}, tu amigo envió una imagen.\n\n` +
                                `GRUPO = ${groupName}\nNÚMERO = ${m.sender.split('@')[0]}\nMENSAJE = ${body.replace(`@${jidDecode(x.jid).user}`, `@TAG`)}`
                            let ms = m.quoted ? m.getQuotedObj() : m
                            await client.copyNForward(x.jid, client.cMod(x.jid, ms, text, client.user.id), true)
                        } else {
                            await m.reply(`❌ @${x.jid.split('@')[0]} ¡Está AFK!\n├ Desde ${times}\n└ Razón: *${x.reason}*`, m.chat, { mentions: [x.jid] })
                            let text = `Porque estás ${x.reason}, tu amigo envió un mensaje.\n\n` +
                                `GRUPO = ${groupName}\nNÚMERO = ${m.sender.split('@')[0]}\nMENSAJE = ${body.replace(`@${jidDecode(x.jid).user}`, `@TAG`)}`
                            await client.sendMessage(x.jid, { text })
                        }
                    }
                }
            }
        }
    }
}
