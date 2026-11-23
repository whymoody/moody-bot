function readStatus(result) {
  const item = Array.isArray(result) ? result[0] : result;
  const value = item?.status ?? item?.about;

  if (!value) return { about: "", setAt: null };
  if (typeof value === "string") return { about: value.trim(), setAt: null };

  const setAt = value.setAt ? new Date(value.setAt) : null;
  return { about: String(value.status ?? value.about ?? "").trim(), setAt };
}

async function fetchAbout(sock, targets) {
  const list = [...new Set([].concat(targets).filter(Boolean))];
  const attempts = [];

  if (typeof sock?.fetchStatus !== "function") {
    console.log("[whatsapp] fetchStatus no disponible | targets:", list);
    return { about: "", setAt: null };
  }

  for (const target of list) {
    try {
      const result = await sock.fetchStatus(target);
      const { about, setAt } = readStatus(result);

      if (about) return { about, setAt };

      attempts.push({ target, result });
    } catch (error) {
      attempts.push({ target, error: error.message });
    }
  }

  console.log("[whatsapp] sin about |", JSON.stringify({ list, attempts }));

  return { about: "", setAt: null };
}

module.exports = { fetchAbout, readStatus };
