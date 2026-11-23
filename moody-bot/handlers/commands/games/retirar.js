
const { groupManage, Users } = require("../../../db");
const MSG_CNG = require("../../../utils/config.json");
const { milesToComas } = require("../../../utils/index");

module.exports = {
    tags: ["games"],
    cmd: ["retirar", "withdraw"],
    help: ["retirar"],

    exec: async (m, Moody, { prefix, args, cmd }) => {
        try {
            const user_info = await Users.get(m.sender);
            const group_db = await groupManage.get(m.chat);

            if (!m.isGroup)
                return m.reply(MSG_CNG.MSG.groupMsg);

            if (!group_db?.games)
                return m.reply(
                    "*Los minijuegos fueron desactivados en este grupo.*"
                );

            if (!args.length)
                return m.reply(
                    `*🚩 Ejemplo: ${prefix + cmd} 500*`
                );

            const amount = Number(args.join(" "));

            if (!Number.isSafeInteger(amount) || amount <= 0)
                return m.reply("*🍟 Ingresa una cantidad válida para retirar.*");

            const balance = Number(user_info.balance) || 0;
            const bank = Number(user_info.bank) || 0;

            if (bank < amount)
                return m.reply("* No tienes suficiente dinero en el banco.*");

            await Users.update(m.sender, {
                balance: balance + amount,
                bank: bank - amount
            });

            await m.reply(
                `*RETIRO REALIZADO*\n\n` +
                `Retiraste: ${MSG_CNG.BOT_CONFIG.MONEY_SYMBOL} ${milesToComas(amount)}\n` +
                `Dinero restante en el banco: ${MSG_CNG.BOT_CONFIG.MONEY_SYMBOL} ${milesToComas(bank - amount)}\n` +
                `Dinero disponible: ${MSG_CNG.BOT_CONFIG.MONEY_SYMBOL} ${milesToComas(balance + amount)}`
            );

        } catch (err) {
            m.reply(new Error(err).message);
        }
    },
};
