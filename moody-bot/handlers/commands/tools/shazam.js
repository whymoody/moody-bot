const { Shazam } = require("unofficial-shazam");
const shazam = new Shazam();
const fs = require("fs");

module.exports = {
  tags: ["tools"],
  args: ["send/reply media"],
  cmd: ["shazam", "recognise"],
  help: ["shazam"],
  exec: async (m, Moody, { prefix, flags, cmd, arg, body, url }) => {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || "";
    if (/audio|video/.test(mime)) {
      let media = await q.download();
      let filePath = `./temp/${m.sender}.mp3`;
      fs.writeFileSync(filePath, media);
      try {
        let res = await shazam.recognise(filePath, "en-US");
        let imgthub =
          res.track.images.coverart.replace("400x400cc", "1080x1080cc") ||
          res.track.images.background.replace("400x400cc", "1080x1080cc") ||
          res.track.images.coverarthq;
        let resrulttt = `*亗 S H A Z A M*\n
*› Titulo :* ${res.track.title || "-"}
*› Artista:* ${res.track.subtitle || "-"}
*› Type :* ${res.track.type || "-"}
*› By :* ${res.track.hub.displayname || res.track.hub.type || "-"}
*› Genero :* ${res.track.genres ? res.track.genres.primary : "-"}
*› Url :* ${res.track.url || "-"}`;
        Moody.sendMessage(
          m.chat,
          { image: { url: imgthub }, caption: resrulttt },
          { quoted: m },
        );
      } catch (error) {
        m.reply("*🚩 Musica no encontrada.*");
      } finally {
        fs.unlinkSync(filePath);
      }
    } else {
      m.reply("*🚩 Responde a un audio o video.*");
    }
  },
};
