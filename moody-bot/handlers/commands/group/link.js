module.exports = {
  tags: ["group"],
  cmd: ["link", "enlace"],
  help: ["link"],
  group: true,
  botAdmin: true,
  admin: true,
  exec: async (m, Moody) => {
    const url_groupxd = await Moody.groupInviteCode(m.chat);
    m.reply("https://chat.whatsapp.com/" + url_groupxd);
  },
};
