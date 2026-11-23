const { groupManage, Users } = require("../../../db");
const { BOT_CONFIG, MSG } = require("../../../utils/config.json");
const { milesToComas } = require("../../../utils/index");

const ITEMS = {
  fish: { name: "peces", price: 10, aliases: ["pez", "peces", "fish"] },
  squid: { name: "calamares", price: 25, aliases: ["calamar", "calamares", "squid"] },
  marucha: { name: "maruchas", price: 5, aliases: ["marucha", "maruchas"] },
  gold: { name: "oro", price: 80, aliases: ["oro", "gold"] },
  diamonds: {
    name: "diamantes",
    price: 100,
    aliases: ["diamante", "diamantes", "diamond", "diamonds"],
  },
  mine: { name: "minerales", price: 2, aliases: ["mina", "minas", "mineral", "minerales", "mine"] },
  apple: { name: "manzanas", price: 3, aliases: ["manzana", "manzanas", "apple"] },
  orange: { name: "naranjas", price: 3, aliases: ["naranja", "naranjas", "orange"] },
  lemon: { name: "limones", price: 3, aliases: ["limon", "limones", "lemon"] },
  pines: { name: "pinos", price: 4, aliases: ["pino", "pinos"] },
  palm: { name: "palmeras", price: 5, aliases: ["palmera", "palmeras"] },
  three: { name: "arboles", price: 6, aliases: ["arbol", "arboles"] },
};

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getItem(value) {
  const normalized = normalize(value);
  return Object.entries(ITEMS).find(([, item]) =>
    item.aliases.includes(normalized),
  )?.[0];
}

module.exports = {
  tags: ["games"],
  cmd: ["sell", "vender"],
  args: ["recurso [cantidad] | all"],
  help: ["sell"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    if (!m.isGroup) return m.reply(MSG.groupMsg);

    const group = await groupManage.get(m.chat);
    if (!group?.games) {
      return m.reply("*🚩 Los minijuegos están desactivados en este grupo.*");
    }

    const user = await Users.get(m.sender);
    if (!user) {
      return m.reply("*🚩 No estás registrado en mi base de datos.*");
    }

    if (!args.length) {
      return m.reply(
        `*🍟 Uso:* ${prefix + cmd} peces [cantidad]\n*🍟 También puedes usar:* ${prefix + cmd} all\n\n*Precios por unidad:*\n${Object.values(
          ITEMS,
        )
          .map(
            (item) =>
              `◦ ${item.name}: ${BOT_CONFIG.MONEY_SYMBOL}${item.price}`,
          )
          .join("\n")}`,
      );
    }

    const input = args.map(normalize);
    const sellAll = input.length === 1 && input[0] === "all";
    let selectedItems;
    let quantity = null;

    if (sellAll) {
      selectedItems = Object.keys(ITEMS);
    } else {
      const itemIndex = input.findIndex((word) => getItem(word));
      const itemKey = itemIndex === -1 ? null : getItem(input[itemIndex]);
      if (!itemKey) {
        return m.reply(
          `*🚩 Indica un recurso válido.* Ejemplo: ${prefix + cmd} peces 10 o ${prefix + cmd} all`,
        );
      }
      selectedItems = [itemKey];

      const quantityText = input.find(
        (word, index) => index !== itemIndex && word !== "all",
      );
      if (quantityText) {
        quantity = Number(quantityText);
        if (!Number.isSafeInteger(quantity) || quantity <= 0) {
          return m.reply("*🚩 La cantidad debe ser un número entero mayor que cero.*");
        }
      }
    }

    const sold = [];
    const updates = {};
    let earnings = 0;

    for (const key of selectedItems) {
      const item = ITEMS[key];
      const available = Math.max(0, Number(user[key]) || 0);
      const amount = quantity === null ? available : Math.min(quantity, available);
      if (!amount) continue;

      updates[key] = available - amount;
      earnings += amount * item.price;
      sold.push(`${amount} ${item.name}`);
    }

    if (!sold.length) {
      return m.reply("*🚩 No tienes recursos de ese tipo para vender.*");
    }

    updates.balance = (Number(user.balance) || 0) + earnings;
    await Users.update(m.sender, updates);

    return Moody.sendMessage(
      m.chat,
      {
        text: `*🪙 Venta realizada*\n${sold.map((item) => `◦ ${item}`).join("\n")}\n\n*Ganaste:* ${BOT_CONFIG.MONEY_SYMBOL}${milesToComas(earnings)} ${BOT_CONFIG.MONEY_NAME}\n*Saldo:* ${BOT_CONFIG.MONEY_SYMBOL}${milesToComas(updates.balance)}`,
      },
      { quoted: m },
    );
  },
};
