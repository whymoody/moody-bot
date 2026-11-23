const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
  tags: ["tools"],
  cmd: ["view", "viewonce", "ver",],
  help: ["view"],
  exec: async (m, Moody, { args }) => {
    const isQuoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!isQuoted) {
      return m.reply("• Etiqueta a un mensaje en ver una vez: *① foto | video*");
    }

    const quotedMsg = isQuoted.viewOnceMessageV2 || isQuoted.viewOnceMessage || isQuoted;
    const type = Object.keys(quotedMsg)[0]; 

    if (type !== "imageMessage" && type !== "videoMessage") {
      return m.reply("El mensaje etiquetado no es una foto ni un video.");
    }

    try {
      const messageToDownload = {
        key: {
          remoteJid: m.chat,
          fromMe: m.quoted?.fromMe || false,
          id: m.message.extendedTextMessage.contextInfo.stanzaId,
          participant: m.message.extendedTextMessage.contextInfo.participant
        },
        message: quotedMsg
      };

      const buffer = await downloadMediaMessage(
        messageToDownload,
        "buffer",
        {},
        { logger: console, reuploadRequest: Moody.updateMediaMessage }
      );

      if (!buffer) throw new Error("Buffer vacío");

      
      
      if (type === "imageMessage") {
        await Moody.sendMessage(m.chat, { image: buffer, caption: "*Imagen recuperada*" });
      } else {
        await Moody.sendMessage(m.chat, { video: buffer, caption: "*Video recuperado*" });
      }

    } catch (e) {
      if (e.message && e.message.includes("404")) {
          console.log("[VIEW] Imagen enviada, error 404 ignorado.");
      } else {
          console.error("[VIEW ERROR REAL]", e);
          
          m.reply("*Error real al intentar abrir el mensaje.*");
      }
    }
  }
};