const { Users } = require("../../../db");
const schema = require("../../../db/schema");
const { BOT_CONFIG } = require("../../../utils/config.json");


const marryProposals = new Map();

const INVALID_NAMES = ["no disponible", "desconocido", "undefined", "null"];

async function displayName(jid, m, Moody) {
  const pushName =
    m && jid === m.sender ? String(m.pushName || "").trim() : "";

  const name = pushName || String((await Moody.getName(jid).catch(() => "")) || "").trim();

  if (name && !INVALID_NAMES.includes(name.toLowerCase()) && !name.endsWith("@lid") && !name.endsWith("@s.whatsapp.net")) {
    return name;
  }

  return String(jid).split("@")[0];
}

module.exports = {
  tags: ["perfil"],
  cmd: ["marry", "aceptar", "rechazar", "divorce", "divorcio"],
  help: ["marry"],
  exec: async (m, Moody, { prefix, cmd }) => {
    try {
      const sender = m.sender;
      const senderUser = await Users.get(sender);

      if (!senderUser) {
        return m.reply("Primero debes registrarte en el bot.");
      }

      const formatNum = (num) => num.toLocaleString("en-US");

      
      if (cmd === "marry") {
        const target = m.quoted ? m.quoted.sender : (m.mentionedJid ? m.mentionedJid[0] : null);
        
        if (!target) return m.reply(`*🍟 Etiqueta a la persona que quieres proponerle matrimonio.*\nEjemplo: ${prefix}marry @usuario`);
        if (target === sender) return m.reply("No puedes casarte contigo mismo/a.");
        if (target.includes("bot")) return m.reply("No puedes casarte con un bot.");

        const targetUser = await Users.get(target);
        if (!targetUser) return m.reply("La persona que mencionas no está registrada en el bot.");

        if (senderUser.married_boolean || senderUser.married_id) {
          const senderName = await displayName(sender, m, Moody);
          const partnerName = senderUser.married_id
            ? await displayName(senderUser.married_id, null, Moody)
            : null;

          return m.reply(
            partnerName
              ? `> *${senderName}*, ya estás casado/a con ${partnerName}`
              : `> *${senderName}*, ya estás casado/a`,
          );
        }
        if (targetUser.married_boolean || targetUser.married_id)
          return m.reply("Esa persona ya está casada con alguien más.");

        
        marryProposals.set(target, sender);

        const proposeMsg = 
          `*¡PROPUESTA DE MATRIMONIO!*\n\n` +
          `*@${sender.split("@")[0]}* le ha propuesto matrimonio a *@${target.split("@")[0]}*\n\n` +
          `*@${target.split("@")[0]}*, escribe *${prefix}aceptar* para casarte o *${prefix}rechazar* para rechazar.`;

        await Moody.sendMessage(m.chat, { 
          text: proposeMsg,
          mentions: [sender, target]
        }, { quoted: m });
      }

     
      else if (cmd === "aceptar") {
        const proposer = marryProposals.get(sender);

        if (!proposer) {
          return m.reply("No tienes ninguna propuesta de matrimonio pendiente.");
        }

        const proposerUser = await Users.get(proposer);
        if (!proposerUser) {
          marryProposals.delete(sender);
          return m.reply("La persona que te propuso matrimonio ya no está registrada.");
        }

        
        await schema.ready();

        await Users.update(sender, {
          married_boolean: 1,
          married_id: proposer,
          married_date: new Date().toISOString(),
        });
        await Users.update(proposer, {
          married_boolean: 1,
          married_id: sender,
          married_date: new Date().toISOString(),
        });

        
        marryProposals.delete(sender);

        const acceptMsg = 
          `*¡NUEVO MATRIMONIO!*\n\n` +
          `*@${sender.split("@")[0]}* y *@${proposer.split("@")[0]}* ahora están casados oficialmente.\n` +
          `¡Felicidades a la feliz pareja! 🎉`;

        await Moody.sendMessage(m.chat, { 
          text: acceptMsg,
          mentions: [sender, proposer]
        }, { quoted: m });
      }

     
      else if (cmd === "rechazar") {
        const proposer = marryProposals.get(sender);

        if (!proposer) {
          return m.reply("No tienes ninguna propuesta de matrimonio pendiente.");
        }

        marryProposals.delete(sender);

        const rejectMsg = 
          `*PROPUESTA RECHAZADA*\n\n` +
          `*@${sender.split("@")[0]}* ha rechazado la propuesta de *@${proposer.split("@")[0]}*.`;

        await Moody.sendMessage(m.chat, { 
          text: rejectMsg,
          mentions: [sender, proposer]
        }, { quoted: m });
      }

      
      else if (cmd === "divorce" || cmd === "divorcio") {
        if (!senderUser.married_boolean && !senderUser.married_id) {
          return m.reply("No estás casado/a actualmente.");
        }

        const partner = senderUser.married_id;

        
        await schema.ready();

        await Users.update(sender, {
          married_boolean: 0,
          married_id: null,
          married_date: null,
        });
        if (partner) {
          await Users.update(partner, {
            married_boolean: 0,
            married_id: null,
            married_date: null,
          });
        }

        const divorceMsg = 
          `*DIVORCIO* \n\n` +
          `*@${sender.split("@")[0]}*${partner ? ` y *@${partner.split("@")[0]}*` : ""} han decidido tomar caminos separados.\n` +
          `El matrimonio ha terminado.`;

        await Moody.sendMessage(m.chat, { 
          text: divorceMsg,
          mentions: partner ? [sender, partner] : [sender]
        }, { quoted: m });
      }

    } catch (error) {
      console.error("[MARRY ERROR]", error);
      m.reply("Ocurrió un error al procesar la solicitud.");
    }
  },
};