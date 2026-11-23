const fs = require("fs");
const path = require("path");

const { BASE_URL, BOT_CONFIG } = require("../../../utils/config.json");
const { Users } = require("../../../db");
const { ConvertMiles } = require("../../../utils/index");
const { getCountryInfo } = require("../../../utils/country");
const { fetchAbout } = require("../../../utils/whatsapp");

const WAIFUS_DATABASE = path.join(
    __dirname,
    "../gacha/data/waifus.json"
);

function toSmallCaps(text) {
    const map = {
        a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ғ", g: "ɢ", h: "ʜ",
        i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ",
        q: "q", r: "ʀ", s: "ꜱ", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x",
        y: "ʏ", z: "ᴢ",
    };

    return String(text).toLowerCase().replace(/[a-z]/g, (letter) => map[letter]);
}

function normalize(jid = "") {
    return String(jid)
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
}

function loadWaifus() {
    if (!fs.existsSync(WAIFUS_DATABASE)) {
        return [];
    }

    const data = JSON.parse(
        fs.readFileSync(WAIFUS_DATABASE, "utf8")
    );

    return Array.isArray(data) ? data : [];
}

function formatNumber(value) {
    return ConvertMiles(Number(value) || 0);
}

async function resolveBio(user, phoneJid, who, sock) {
    const stored = String(user?.bio || "").trim();
    if (stored) return stored;

    const targets = [
        String(phoneJid || "").includes("@") ? phoneJid : null,
        who,
    ];
    const { about } = await fetchAbout(sock, targets);

    return about || "Sin biografía";
}

async function resolvePhoneJid(who, m, sock) {
    const isSelf = normalize(who) === normalize(m.sender);
    const candidates = isSelf
        ? [m.key?.senderPn, m.senderPn, m.key?.participantPn, m.participantPn, who]
        : [
            m.quoted?.senderPn,
            m.quoted?.key?.senderPn,
            m.quoted?.participantPn,
            m.quoted?.key?.participantPn,
            who,
        ];

    for (const candidate of candidates) {
        if (!candidate) continue;
        const jid = String(candidate).split(":")[0];
        if (jid.endsWith("@s.whatsapp.net") || jid.endsWith("@c.us")) return jid;
        if (/^\d{8,15}$/.test(jid)) return `${jid}@s.whatsapp.net`;
    }

    const lid = candidates.find((candidate) => String(candidate).endsWith("@lid"));
    const getPNForLID = sock?.signalRepository?.lidMapping?.getPNForLID;
    if (lid && getPNForLID) {
        try {
            const phoneJid = await getPNForLID.call(sock.signalRepository.lidMapping, lid);
            if (phoneJid) {
                const jid = String(phoneJid).split(":")[0];
                return jid.includes("@") ? jid : `${jid}@s.whatsapp.net`;
            }
        } catch (error) {
            console.warn("[perfil] No se pudo resolver el número desde el LID:", error.message);
        }
    }

    return who;
}

module.exports = {
    cmd: ["ava", "avatar", "perfil", "profile"],
    help: ["perfil"],
    tags: ["perfil"],

    exec: async (m, Moody, { prefix, cmd, args }) => {
        try {
            const who = m.quoted
                ? m.quoted.sender
                : m.mentionedJid?.[0] || m.sender;

            const user = await Users.get(who);

            if (!user) {
                return m.reply(
                    "Este usuario no está registrado en mi base de datos."
                );
            }

            const phoneJid = await resolvePhoneJid(who, m, Moody);
            
            
            let countryText = "Privado / Oculto";
            
            
            if (phoneJid.endsWith("@s.whatsapp.net") || phoneJid.endsWith("@c.us")) {
                const country = await getCountryInfo(phoneJid);
                countryText = `${country.number || "-"} ( ${country.name || "Desconocido"} ${country.emoji || ""} )`;
            }

            const name = await Moody.getName(who);
            const displayName = String(name || "").trim();
            const hasDisplayName =
                displayName && !["no disponible", "desconocido"].includes(displayName.toLowerCase());
            
            const profileMentionJid = phoneJid.includes("@") ? phoneJid : who;
            const profileDisplayName = hasDisplayName
                ? displayName
                : `@${normalize(phoneJid) || normalize(who) || "usuario"}`;

            const perfil = await Moody.profilePictureUrl(
                who,
                "image"
            ).catch(
                () => "https://telegra.ph/file/288dfd6336e8854cf144b.jpg"
            );

            const bio = await resolveBio(user, phoneJid, who, Moody);

            const balance = Number(user.balance) || 0;
            const bank = Number(user.bank) || 0;
            const total = balance + bank;

            const ownerIds = new Set(
                [who, phoneJid].map(normalize).filter(Boolean)
            );

            const waifus = loadWaifus();
            const seenWaifus = new Set();
            const userWaifus = waifus.filter((waifu) => {
                if (!waifu.owner || !ownerIds.has(normalize(waifu.owner))) {
                    return false;
                }

                const key = String(waifu.id ?? waifu.name ?? "");
                if (seenWaifus.has(key)) return false;

                seenWaifus.add(key);
                return true;
            });

            const waifuCount = userWaifus.length;
            const waifuValue = userWaifus.reduce(
                (total, waifu) => total + (Number(waifu.value) || 0),
                0
            );

            const warnings = Number(user.warning) || 0;
            const totalValor = waifuValue;

            let marriedText = "Soltero/a";
            let mentions = [profileMentionJid];
            
            if (user.married_id || user.married_boolean) {
                const partnerJid = user.married_id;
                const marriedDate = user.married_date
                    ? new Date(user.married_date).toLocaleDateString("es-ES")
                    : null;
                const dateText = marriedDate ? ` [ *${marriedDate}* ]` : "";

                if (partnerJid) {
                    marriedText = `@${normalize(partnerJid)}${dateText}`;
                    mentions.push(partnerJid);
                } else {
                    marriedText = `Casado/a${dateText}`;
                }
            }

            const messageProfile =
                `ゲ◜៹ ${toSmallCaps("Perfil")}\n\n` +
                `*${toSmallCaps("Nombre")} :* ${toSmallCaps(profileDisplayName)}\n` +
                `*${toSmallCaps("Bio")} :* ${toSmallCaps(bio)}\n` +
                `*${toSmallCaps("Numero")} :* ${toSmallCaps(countryText)}\n` +
                `*${toSmallCaps("Cumpleaños")} :* ${toSmallCaps(user.birthday || "No definido")}\n` +
                `*${toSmallCaps("Género")} :* ${toSmallCaps(user.gender || "No definido")}\n` +
                `*${toSmallCaps("Harem")} :* ${formatNumber(waifuCount)}\n` +
                `*${toSmallCaps("Valor total")} :* ${BOT_CONFIG.MONEY_SYMBOL}${formatNumber(totalValor)}\n` +
                `*${toSmallCaps("Casado/a")} :* ${marriedText}\n` +
                `*${toSmallCaps("Warning")} :* ${warnings}\n` +
                `*${toSmallCaps("Saldo")} :* ${BOT_CONFIG.MONEY_SYMBOL}${formatNumber(total)} ${toSmallCaps(BOT_CONFIG.MONEY_NAME)}\n\n` +
                `> *${toSmallCaps("Powered By")} ${BOT_CONFIG.BOT_NAME}*`;

            return await Moody.sendMessage(
                m.chat,
                {
                    image: { url: perfil },
                    caption: messageProfile,
                    mentions: mentions
                },
                { quoted: m }
            );

        } catch (error) {
            console.error("[perfil] Error:", error);
            return m.reply("Ocurrió un error al consultar el perfil.");
        }
    }
};