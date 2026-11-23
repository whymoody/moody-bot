const axios = require("axios");

async function fetchLyrics(query) {
  const response = await axios.get("https://lrclib.net/api/search", {
    params: { q: query },
    headers: {
      "User-Agent": "MoodyBot/1.0 (https://github.com/whymoody)",
    },
    timeout: 15000,
  });
  return response.data;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findLyricsTrack(results, query) {
  const queryText = normalizeText(query);
  const queryWords = queryText.split(" ").filter(Boolean);

  return results
    .filter((result) => result.plainLyrics || result.syncedLyrics)
    .map((result) => {
      const title = normalizeText(result.trackName);
      const matchingWords = queryWords.filter((word) => title.includes(word));
      const score =
        title === queryText
          ? 100
          : title.startsWith(`${queryText} `)
            ? 80
            : title.includes(queryText)
              ? 70
              : queryWords.length
                ? (matchingWords.length / queryWords.length) * 50
                : 0;
      return { result, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.result;
}

async function fetchAlbumCover(track, query) {
  const artist = normalizeText(track.artistName);
  const artistWords = new Set(artist.split(" "));
  const requestedTitle =
    normalizeText(query)
      .split(" ")
      .filter((word) => !artistWords.has(word))
      .join(" ") || normalizeText(track.trackName);
  const term = [query, track.artistName].filter(Boolean).join(" ");
  if (!term) return null;

  const search = await axios.get("https://itunes.apple.com/search", {
    params: {
      term,
      entity: "song",
      limit: 25,
    },
    timeout: 15000,
  });

  const candidates = (search.data?.results || [])
    .map((result) => {
      const resultTitle = normalizeText(result.trackName);
      const resultArtist = normalizeText(result.artistName);
      const titleMatches =
        resultTitle === requestedTitle ||
        resultTitle.startsWith(`${requestedTitle} `) ||
        requestedTitle.startsWith(`${resultTitle} `);
      const artistMatches =
        resultArtist === artist ||
        resultArtist.includes(artist) ||
        artist.includes(resultArtist);

      return {
        artworkUrl: result.artworkUrl100,
        score: (titleMatches ? 2 : 0) + (artistMatches ? 1 : 0),
      };
    })
    .filter((result) => result.artworkUrl && result.score >= (artist ? 3 : 2))
    .sort((a, b) => b.score - a.score);

  if (!candidates.length) return null;

  const artworkUrl = candidates[0].artworkUrl.replace(
    /\/\d+x\d+bb\./,
    "/600x600bb.",
  );
  const image = await axios.get(artworkUrl, {
    responseType: "arraybuffer",
    timeout: 15000,
  });
  const contentType = image.headers["content-type"] || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`La portada devolvió un tipo no válido: ${contentType}`);
  }

  return Buffer.from(image.data);
}

module.exports = {
  tags: ["search"],
  cmd: ["lyrics", "letra"],
  help: ["lyrics cancion"],
  args: ["nombre de la cancion"],
  exec: async (m, client, { prefix, cmd, args = [] }) => {
    const query = args.join(" ");
    if (!query) {
      return m.reply(`° Ejemplo : ${prefix + cmd} Creep`);
    }

    try {
      await m.reply("🔍 Buscando la letra, espera un momento...");

      const results = await fetchLyrics(query);

      if (!results || results.length === 0) {
        return m.reply(`❌ No encontré la letra de *${query}*. Intenta ser más específico (Artista - Canción).`);
      }

      const track = findLyricsTrack(results, query);
      
      if (!track) {
        return m.reply(`❌ La canción fue encontrada, pero no tiene letra disponible.`);
      }

      const lyrics = track.plainLyrics || track.syncedLyrics || "Letra no disponible.";
      let cover;
      try {
        cover = await fetchAlbumCover(track, query);
        if (!cover) {
          console.warn(
            `[LYRICS IMAGE] No se encontró portada para "${track.trackName || query}".`,
          );
        }
      } catch (error) {
        console.warn("[LYRICS IMAGE] No se pudo obtener la portada:", error.message);
      }

      const headerText = `╭  ✦ *Lyrics Search* ✦  ╮\n\n` +
                         `◦ *Titulo :* ${track.trackName || query}\n` +
                         `◦ *Artista :* ${track.artistName || "Desconocido"}\n` +
                         `◦ *Álbum :* ${track.albumName || "N/A"}\n` +
                         `◦ *Duración :* ${track.duration ? Math.floor(track.duration / 60) + ":" + (track.duration % 60).toString().padStart(2, '0') : "N/A"}`;

      // 🚀 Manejo de letras largas (WhatsApp tiene límite de caracteres)
      if (lyrics.length < 800) {
          const text = `${headerText}\n\n${lyrics}`;
          await client.sendMessage(
            m.chat,
            cover ? { image: cover, caption: text } : { text },
            { quoted: m },
          );
      } else {
          await client.sendMessage(
            m.chat,
            cover
              ? { image: cover, caption: headerText }
              : { text: headerText },
            { quoted: m },
          );

          const chunks = lyrics.match(/[\s\S]{1,4000}/g) || [];
          for (const chunk of chunks) {
              await client.sendMessage(m.chat, { text: chunk }, { quoted: m });
          }
      }

    } catch (error) {
      console.error("[LYRICS ERROR]", error.message);
      await m.reply(`❌ Hubo un error al buscar la letra. Revisa si el nombre está bien escrito o intenta más tarde.`);
    }
  },
};