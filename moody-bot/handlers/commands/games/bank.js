
const { Users } = require("../../../db");
const MSG_CNG = require("../../../utils/config.json");
const { milesToComas } = require("../../../utils/index");

module.exports = {
    tags: ["games"],
    cmd: ["bank"],
    help: ["bank"],

    exec: async (m, Moody) => {
        try {
            const user_info = await Users.get(m.sender);

            if (!m.isGroup)
                return m.reply(MSG_CNG.MSG.groupMsg);

            const balance = Number(user_info.balance) || 0;
            const bank = Number(user_info.bank) || 0;

            await m.reply(
                ` ⊹₊˚‧︵‿₊୨ BANCO ୧₊‿︵‧˚₊⊹ \n\n` +
                `Usuario: @${m.sender.split("@")[0]}\n\n` +
                `Dinero disponible: ${MSG_CNG.BOT_CONFIG.MONEY_SYMBOL} ${milesToComas(balance)}\n` +
                `Dinero depositado: ${MSG_CNG.BOT_CONFIG.MONEY_SYMBOL} ${milesToComas(bank)}\n\n`
                ,
                m.chat,
                { mentions: [m.sender] }
            );

        } catch (err) {
            m.reply(new Error(err).message);
        }
    },
};
