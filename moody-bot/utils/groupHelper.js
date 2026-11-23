function normalizeJid(jid) {
    return String(jid || "")
        .split(":")[0]
        .toLowerCase();
}

function getJidAliases(jid) {
    const normalized = normalizeJid(jid);
    if (!normalized) return [];

    return [
        normalized,
        normalized.split("@")[0],
    ];
}

function participantMatches(participant, jids) {
    const aliases = new Set(
        [
            participant?.id,
            participant?.jid,
            participant?.phoneNumber,
        ].flatMap(getJidAliases),
    );

    return jids.some((jid) => getJidAliases(jid).some((alias) => aliases.has(alias)));
}

async function getGroupContext(sock, m) {
    const jid = m.chat || m.key?.remoteJid || "";
    const isGroup = Boolean(m.isGroup || jid.endsWith("@g.us"));
    const context = {
        jid,
        isGroup,
        metadata: null,
        participants: [],
        isBotAdmin: false,
        isAdmin: false,
        isSuperAdmin: false,
        error: null,
    };

    if (!isGroup) return context;

    try {
        context.metadata = await sock.groupMetadata(jid);
        context.participants = context.metadata?.participants || [];

        const callerJids = [
            m.sender,
            m.participant,
            m.key?.participant,
            m.senderPn,
            m.participantPn,
            m.key?.participantPn,
        ].filter(Boolean);
        const botJids = [
            sock.user?.id,
            sock.user?.lid,
            sock.user?.jid,
        ].filter(Boolean);

        const caller = context.participants.find((participant) =>
            participantMatches(participant, callerJids),
        );
        const bot = context.participants.find((participant) =>
            participantMatches(participant, botJids),
        );

        context.isAdmin = caller?.admin === "admin";
        context.isSuperAdmin = caller?.admin === "superadmin";
        context.isBotAdmin = Boolean(bot?.admin);
    } catch (error) {
        console.error("[groupHelper] No se pudo obtener el contexto del grupo:", error);
        context.error = "No pude obtener la información del grupo.";
    }

    return context;
}

function obtenerTargetJid(m, args = []) {
    const target = m.mentionedJid?.[0] || m.quoted?.sender;
    if (target) return target;

    const number = args.find((arg) => /^\+?\d{5,16}$/.test(String(arg)));
    if (!number) return null;

    return `${String(number).replace(/^\+/, "")}@s.whatsapp.net`;
}

module.exports = {
    getGroupContext,
    obtenerTargetJid,
};
