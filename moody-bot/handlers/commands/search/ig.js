const { InstagramScraper } = require('@aduptive/instagram-scraper');
const { InstagraNode } = require('instagranode');
const { execFile } = require('child_process');

const RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 1000;
let rateLimitUntil = 0;
let lookupInProgress = false;

function isRateLimited(error) {
  const details = typeof error === 'string'
    ? error
    : `${error?.code || ''} ${error?.statusCode || ''} ${error?.message || ''} ${error?.stderr || ''}`;

  return /429|RATE_LIMITED|rate.?limit|too many requests|blocked/i.test(details);
}

function getProfileFromInstagraNode(profile) {
  return {
    username: profile.username,
    full_name: profile.fullName || 'No disponible',
    posts_count: profile.mediaCount,
    followers: profile.followerCount,
    following: profile.followingCount,
    is_verified: profile.isVerified || false,
    is_private: profile.isPrivate,
    profile_pic_url: profile.profilePicUrlHd || profile.profilePicUrl || null,
    biography: profile.biography || ''
  };
}

function getProfileFromYtDlp(data, username) {
  return {
    username: data.uploader_id || username,
    full_name: data.uploader || 'No disponible',
    posts_count: data.playlist_count ?? 'Desconocido',
    followers: data.channel_follower_count ?? 'Desconocido',
    following: 'Desconocido',
    is_verified: false,
    is_private: false,
    profile_pic_url: data.thumbnails?.at(-1)?.url || null,
    biography: 'Bio no disponible en este método.'
  };
}

function formatCount(value) {
  if (value === null || value === undefined || value === '') return 'Desconocido';
  return typeof value === 'number' ? value.toLocaleString() : String(value);
}

function sendRateLimitMessage(sock, jid, m) {
  rateLimitUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
  return sock.sendMessage(jid, {
    text: 'Instagram está limitando las consultas. Se detuvieron los métodos restantes para evitar más solicitudes. Espera unos minutos antes de volver a intentar.'
  }, { quoted: m });
}

function runYtDlp(url) {
  return new Promise((resolve, reject) => {
    execFile('yt-dlp', ['--dump-json', '--playlist-items', '0', url], { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        const failure = new Error(stderr?.trim() || error.message);
        failure.code = error.code;
        failure.statusCode = error.statusCode;
        return reject(failure);
      }
      resolve(stdout);
    });
  });
}

module.exports = {
  cmd: ['', 'instagram'],
  desc: 'Muestra información de un perfil de Instagram usando 3 métodos.',
  category: 'tools',
  exec: async (m, sock, { args, prefix, cmd }) => {
    const jid = m.chat || m.key.remoteJid;
    const input = args[0];

    if (!input) {
      return sock.sendMessage(jid, {
        text: `*Uso:* ${prefix}${cmd} <usuario>\n\n*Ejemplo:*\n${prefix}${cmd} why_moody`
      }, { quoted: m });
    }

    const username = input
      .trim()
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
      .split(/[/?#]/)[0]
      .replace(/^@/, '');

    if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) {
      return sock.sendMessage(jid, {
        text: '❌ El usuario no es válido. Envía un nombre de usuario de Instagram o el enlace de su perfil.'
      }, { quoted: m });
    }

    if (Date.now() < rateLimitUntil) {
      return sock.sendMessage(jid, {
        text: 'La búsqueda está pausada temporalmente porque Instagram limitó las consultas. Espera unos minutos antes de volver a intentar.'
      }, { quoted: m });
    }

    if (lookupInProgress) {
      return sock.sendMessage(jid, {
        text: 'Ya hay una búsqueda de Instagram en curso. Intenta de nuevo en un momento.'
      }, { quoted: m });
    }

    lookupInProgress = true;
    try {
      await sock.sendMessage(jid, { text: '⏳ *Consultando perfil...*' }, { quoted: m });

      let profile = null;
      let method = '';

      try {
        const scraper = new InstagramScraper({ maxRetries: 3 });
        const result = await scraper.getProfile(username);

        if (result.success && result.profile) {
          profile = result.profile;
          method = 'InstagramScraper';
        } else {
          const reason = result.code || result.error || 'No se obtuvo el perfil';
          console.error('[IG PROFILE] Falló el Método 1 (InstagramScraper):', reason);
          if (isRateLimited(`${result.code || ''} ${result.statusCode || ''} ${result.error || ''}`)) {
            return await sendRateLimitMessage(sock, jid, m);
          }
        }
      } catch (error) {
        console.error('[IG PROFILE] Falló el Método 1 (InstagramScraper):', error.message);
        if (isRateLimited(error)) return await sendRateLimitMessage(sock, jid, m);
      }

      if (!profile) {
        try {
          const scraper = new InstagraNode({ browser: 'chrome-win' });
          profile = getProfileFromInstagraNode(await scraper.searchProfile(username));
          method = 'InstagraNode';
        } catch (error) {
          console.error('[IG PROFILE] Falló el Método 2 (InstagraNode):', error.message);
          if (isRateLimited(error)) return await sendRateLimitMessage(sock, jid, m);
        }
      }

      if (!profile) {
        try {
          const url = `https://www.instagram.com/${username}/`;
          const json = await runYtDlp(url);
          profile = getProfileFromYtDlp(JSON.parse(json), username);
          method = 'yt-dlp';
        } catch (error) {
          console.error('[IG PROFILE] Falló el Método 3 (yt-dlp):', error.message);
          if (isRateLimited(error)) return await sendRateLimitMessage(sock, jid, m);
        }
      }

      if (!profile) {
        return await sock.sendMessage(jid, {
          text: '*No se pudo obtener el perfil.* Los tres métodos fallaron. Puede ser un problema temporal, un perfil no disponible o una limitación de Instagram; revisa los registros para ver el motivo.'
        }, { quoted: m });
      }

      let profileInfo = `*PERFIL DE INSTAGRAM* (vía ${method})\n\n`;
      profileInfo += `*› Usuario:* @${profile.username || username}\n`;
      profileInfo += `*› Nombre:* ${profile.full_name || 'No disponible'}\n`;
      profileInfo += `*› Publicaciones:* ${formatCount(profile.posts_count)}\n`;
      profileInfo += `*› Seguidores:* ${formatCount(profile.followers)}\n`;
      profileInfo += `*› Siguiendo:* ${formatCount(profile.following)}\n`;
      profileInfo += `*› Verificado:* ${profile.is_verified ? '✅' : '❌'}\n`;
      profileInfo += `*› Privado:* ${profile.is_private ? '🔒' : '🔓'}\n`;
      if (profile.biography) profileInfo += `\n*Bio:*\n${profile.biography}\n`;

      if (profile.profile_pic_url) {
        try {
          return await sock.sendMessage(jid, {
            image: { url: profile.profile_pic_url },
            caption: profileInfo
          }, { quoted: m });
        } catch (error) {
          console.error('[IG PROFILE] No se pudo enviar la foto de perfil; se enviará solo texto:', error.message);
        }
      }

      return await sock.sendMessage(jid, { text: profileInfo }, { quoted: m });
    } finally {
      lookupInProgress = false;
    }
  }
};
