function digits(jid = "") {
  return String(jid).split("@")[0].split(":")[0].replace(/\D/g, "");
}

function unique(values = []) {
  return [...new Set(values.filter((jid) => typeof jid === "string" && jid))];
}

function messageJids(who, m) {
  const isSelf = digits(who) === digits(m?.sender);
  const isQuoted = digits(who) === digits(m?.quoted?.sender);
  const jids = [who];

  if (isSelf) {
    jids.push(
      m.senderPn,
      m.participantPn,
      m.key?.senderPn,
      m.key?.participant,
      m.key?.participantAlt,
      m.key?.remoteJidAlt,
    );
  }

  if (isQuoted) {
    jids.push(
      m.quoted?.senderPn,
      m.quoted?.participantPn,
      m.quoted?.key?.senderPn,
      m.quoted?.key?.participantAlt,
    );
  }

  const mentioned = Array.isArray(m?.mentionedJid) ? m.mentionedJid : [];
  jids.push(...mentioned.filter((jid) => digits(jid) === digits(who)));

  return unique(jids);
}

function participantJids(participant = {}) {
  return unique([participant.id, participant.lid, participant.jid]);
}

async function groupJids(jids, chat, sock) {
  if (!String(chat || "").endsWith("@g.us")) return [];
  if (typeof sock?.groupMetadata !== "function") return [];

  const known = new Set(jids.map(digits));

  try {
    const metadata = await sock.groupMetadata(chat);
    const found = [];

    for (const participant of metadata?.participants || []) {
      const forms = participantJids(participant);
      if (forms.some((jid) => known.has(digits(jid)))) {
        found.push(...forms);
      }
    }

    return unique(found);
  } catch (error) {
    console.warn("[identity] No se pudo leer el grupo:", error.message);
    return [];
  }
}

async function resolveJids(who, m, sock) {
  const jids = messageJids(who, m);
  const extra = await groupJids(jids, m?.chat, sock);
  return unique([...jids, ...extra]);
}

async function resolveIdentity(who, m, sock) {
  const jids = messageJids(who, m);
  const known = new Set(jids.map(digits));
  const found = [];
  let participant = null;

  const isGroup = String(m?.chat || "").endsWith("@g.us");

  if (isGroup && typeof sock?.groupMetadata === "function" && known.size) {
    try {
      const metadata = await sock.groupMetadata(m.chat);

      for (const item of metadata?.participants || []) {
        const forms = participantJids(item);
        if (!forms.some((jid) => known.has(digits(jid)))) continue;

        found.push(...forms);
        if (!participant) participant = item;
      }
    } catch (error) {
      console.warn("[identity] No se pudo leer el grupo:", error.message);
    }
  }

  return { jids: unique([...jids, ...found]), participant };
}

async function findParticipant(jids, chat, sock) {
  if (!String(chat || "").endsWith("@g.us")) return null;
  if (typeof sock?.groupMetadata !== "function") return null;

  const known = new Set(jids.map(digits));
  if (!known.size) return null;

  try {
    const metadata = await sock.groupMetadata(chat);

    for (const participant of metadata?.participants || []) {
      const forms = participantJids(participant);
      if (forms.some((jid) => known.has(digits(jid)))) return participant;
    }
  } catch (error) {
    console.warn("[identity] No se pudo leer el grupo:", error.message);
  }

  return null;
}

module.exports = {
  digits,
  messageJids,
  participantJids,
  groupJids,
  resolveJids,
  resolveIdentity,
  findParticipant,
};
