const { BOT_CONFIG } = require("../../../utils/config.json");
const { default: axios } = require("axios");

const RESULT_LIMIT = 5;
const ALBUM_TRACK_LIMIT = 10;
const PLAYLIST_TRACK_LIMIT = 5;
const SELECTION_TTL_MS = 5 * 60 * 1000;
const MAX_PENDING_SELECTIONS = 500;

let cachedAccessToken;
let accessTokenExpiresAt = 0;

const pendingSelections = new Map();

function prunePendingSelections(now = Date.now()) {
  for (const [key, selection] of pendingSelections) {
    if (selection.expiresAt <= now) pendingSelections.delete(key);
  }
  while (pendingSelections.size > MAX_PENDING_SELECTIONS) {
    pendingSelections.delete(pendingSelections.keys().next().value);
  }
}

function getPendingSelection(key) {
  prunePendingSelections();
  return pendingSelections.get(key) || null;
}

function rememberSelection(key, tracks) {
  if (!tracks.length) return;
  prunePendingSelections();
  pendingSelections.set(key, {
    tracks,
    expiresAt: Date.now() + SELECTION_TTL_MS,
  });
}

async function getSpotifyAccessToken() {
  if (cachedAccessToken && Date.now() < accessTokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const error = new Error("Faltan las credenciales de Spotify.");
    error.code = "SPOTIFY_CREDENTIALS_MISSING";
    throw error;
  }

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({ grant_type: "client_credentials" }).toString(),
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  cachedAccessToken = response.data?.access_token;
  if (!cachedAccessToken) {
    throw new Error("Spotify no devolvió un token de acceso válido.");
  }
  accessTokenExpiresAt = Date.now() + (response.data.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

function parseSpotifyLink(text) {
  const uriMatch = text.match(
    /^spotify:(track|album|playlist):([A-Za-z0-9]{22})$/i,
  );
  if (uriMatch) {
    return { type: uriMatch[1].toLowerCase(), id: uriMatch[2] };
  }

  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (!["open.spotify.com", "www.spotify.com"].includes(url.hostname)) {
    return null;
  }

  const match = url.pathname.match(
    /\/(track|album|playlist)\/([A-Za-z0-9]{22})(?:\/|$)/,
  );
  if (!match) return null;
  return { type: match[1].toLowerCase(), id: match[2] };
}

function formatDuration(durationMs) {
  if (!Number.isFinite(durationMs)) return "-";
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getArtists(entity) {
  const artists = entity?.artists?.map((artist) => artist.name).filter(Boolean);
  return artists?.length ? artists.join(", ") : "-";
}

function getTrackLink(track) {
  return track?.external_urls?.spotify || null;
}

function isPlayableTrack(track) {
  return Boolean(track && track.type !== "episode" && getTrackLink(track));
}

function formatTrackList(tracks, fallbackAlbum) {
  return tracks
    .map((track, index) => {
      const album = track.album?.name || fallbackAlbum || "-";
      return `*${index + 1}. ${track.name || "-"}*\n   ◦ Artista: ${getArtists(track)}\n   ◦ Álbum: ${album}\n   ◦ Duración: ${formatDuration(track.duration_ms)}\n   ◦ Enlace: ${getTrackLink(track)}`;
    })
    .join("\n\n");
}

function buildFooter() {
  return `> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`;
}

async function sendCaption(m, Moody, caption, image) {
  if (image) {
    return Moody.sendMessage(
      m.chat,
      { image: { url: image }, caption },
      { quoted: m },
    );
  }
  return Moody.sendMessage(m.chat, { text: caption }, { quoted: m });
}

async function sendTrackCard(m, Moody, track) {
  const trackUrl = getTrackLink(track);
  if (!trackUrl) {
    throw new Error("Spotify no devolvió el enlace de la canción.");
  }

  const caption = `╭  ✦ Spotify ✦  ╮

 *◦ Título :* ${track.name || "-"}
 *◦ Artista :* ${getArtists(track)}
 *◦ Álbum :* ${track.album?.name || "-"}
 *◦ Duración :* ${formatDuration(track.duration_ms)}
 *◦ Enlace :* ${trackUrl}

${buildFooter()}`;

  return sendCaption(m, Moody, caption, track.album?.images?.[0]?.url);
}

module.exports = {
  tags: ["search"],
  args: ["cancion, enlace o numero"],
  cmd: ["spotify"],
  help: ["spotify"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    const text = args.join(" ").trim();
    if (!text) {
      return m.reply(
        `Escribe el nombre de una canción o pega un enlace de Spotify.\n\nEjemplo: ${prefix + cmd} Feel Special\nCanción: ${prefix + cmd} https://open.spotify.com/`,
      );
    }

    const selectionKey = `${m.chat}:${m.sender}`;
    const pending = getPendingSelection(selectionKey);

    if (pending && /^\d{1,2}$/.test(text)) {
      const index = Number(text);
      if (index < 1 || index > pending.tracks.length) {
        return m.reply(
          `Elige un número entre 1 y ${pending.tracks.length}.`,
        );
      }
      pendingSelections.delete(selectionKey);
      return sendTrackCard(m, Moody, pending.tracks[index - 1]);
    }

    if (pending) {
      pendingSelections.delete(selectionKey);
    }

    const entity = parseSpotifyLink(text);
    if (/^(https?:\/\/|spotify:)/i.test(text) && !entity) {
      return m.reply(
        "Ese enlace no parece ser de Spotify. Pega un enlace de canción, álbum o lista de reproducción.",
      );
    }

    try {
      const accessToken = await getSpotifyAccessToken();
      const headers = { Authorization: `Bearer ${accessToken}` };

      if (entity?.type === "track") {
        const response = await axios.get(
          `https://api.spotify.com/v1/tracks/${entity.id}`,
          { headers },
        );
        return await sendTrackCard(m, Moody, response.data);
      }

      if (entity?.type === "album") {
        const response = await axios.get(
          `https://api.spotify.com/v1/albums/${entity.id}`,
          { headers },
        );
        const album = response.data;
        const tracks = (album?.tracks?.items || [])
          .filter(isPlayableTrack)
          .slice(0, ALBUM_TRACK_LIMIT)
          .map((track) => ({
            ...track,
            album: { name: album.name, images: album.images },
          }));
        if (!tracks.length) {
          return m.reply("No encontré canciones en ese álbum.");
        }

        rememberSelection(selectionKey, tracks);
        const caption = `╭  ✦ Spotify ✦  ╮

 *◦ Álbum :* ${album.name || "-"}
 *◦ Artista :* ${getArtists(album)}
 *◦ Canciones :* ${album.total_tracks || tracks.length}
 *◦ Enlace :* ${album.external_urls?.spotify || "-"}

*Mostrando ${tracks.length}:*

${formatTrackList(tracks, album.name)}

*Elige una canción:* ${prefix + cmd} 1

${buildFooter()}`;
        return await sendCaption(
          m,
          Moody,
          caption,
          album.images?.[0]?.url,
        );
      }

      if (entity?.type === "playlist") {
        const response = await axios.get(
          `https://api.spotify.com/v1/playlists/${entity.id}`,
          { headers },
        );
        const playlist = response.data;
        const tracks = (playlist?.tracks?.items || [])
          .map((item) => item?.track)
          .filter(isPlayableTrack)
          .slice(0, PLAYLIST_TRACK_LIMIT);
        if (!tracks.length) {
          return m.reply(
            "No encontré canciones en esa lista de reproducción.",
          );
        }

        rememberSelection(selectionKey, tracks);
        const description = String(playlist.description || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 200);
        const caption = `╭  ✦ Spotify ✦  ╮

 *◦ Lista :* ${playlist.name || "-"}
 *◦ Creador :* ${playlist.owner?.display_name || "-"}
 *◦ Canciones :* ${playlist.tracks?.total || tracks.length}
 *◦ Enlace :* ${playlist.external_urls?.spotify || "-"}${description ? `\n *◦ Descripción :* ${description}` : ""}

*Mostrando ${tracks.length}:*

${formatTrackList(tracks)}

*Elige una canción:* ${prefix + cmd} 1

${buildFooter()}`;
        return await sendCaption(
          m,
          Moody,
          caption,
          playlist.images?.[0]?.url,
        );
      }

      const response = await axios.get("https://api.spotify.com/v1/search", {
        headers,
        params: { q: text, type: "track", limit: RESULT_LIMIT },
      });
      const tracks = (response.data?.tracks?.items || [])
        .filter(isPlayableTrack)
        .slice(0, RESULT_LIMIT);
      if (!tracks.length) {
        return m.reply("No encontré canciones con esa búsqueda.");
      }

      rememberSelection(selectionKey, tracks);
      const caption = `╭  ✦ Spotify ✦  ╮

*Resultados para:* ${text}

${formatTrackList(tracks)}

*Elige una canción:* ${prefix + cmd} 1

${buildFooter()}`;
      return await sendCaption(m, Moody, caption);
    } catch (error) {
      if (error.code === "SPOTIFY_CREDENTIALS_MISSING") {
        return m.reply(
          "Falta configurar Spotify. Añade SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET al entorno donde ejecutas el bot.",
        );
      }

      const status = axios.isAxiosError(error) ? error.response?.status : null;
      const spotifyError = axios.isAxiosError(error)
        ? error.response?.data?.error?.message ||
          error.response?.data?.error ||
          error.response?.data
        : null;
      console.error(
        "[spotify] Falló la consulta:",
        status || error.message || error,
        spotifyError || "",
      );

      if (
        status === 400 &&
        axios.isAxiosError(error) &&
        error.response?.data?.error === "invalid_client"
      ) {
        return m.reply(
          "Spotify no aceptó el Client ID o Client Secret. Revisa que sean de la misma aplicación y que el nuevo Client Secret esté configurado en el entorno donde se ejecuta el bot; después reinícialo.",
        );
      }
      if (status === 401 || status === 403) {
        cachedAccessToken = undefined;
        accessTokenExpiresAt = 0;
        return m.reply(
          "Spotify rechazó las credenciales de la aplicación. Revisa el Client ID y el Client Secret configurados.",
        );
      }
      if (status === 400) {
        return m.reply(
          "Spotify rechazó la búsqueda. Prueba con un nombre más corto, por ejemplo: .spotify nombre de la canción.",
        );
      }
      if (status === 429) {
        return m.reply(
          "Spotify está recibiendo demasiadas solicitudes. Inténtalo de nuevo en unos minutos.",
        );
      }
      if (status === 404) {
        return m.reply(
          "No encontré esa canción, álbum o lista en Spotify.",
        );
      }

      return m.reply(
        "No se pudo consultar Spotify en este momento. Inténtalo de nuevo más tarde.",
      );
    }
  },
};
