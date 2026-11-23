const { exec } = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const { BOT_CONFIG } = require("../../../utils/config.json");
const { ConvertMiles } = require("../../../utils/index");

// El pluginLoader usa el nombre del archivo como clave; debe ser único frente a search/pinterest.js.
module.exports = {
  tags: ["download"],
  args: ["url"],
  cmd: ["pinterestdl", "pindl"],
  help: ["pinterest"],
  exec: async (m, Moody, { args }) => {
    const url = args.find((arg) => arg.includes("pinterest.") || arg.includes("pin.it"));
    if (!url) return m.reply("*∙ Ingresa un enlace válido de Pinterest.*");

    await m.reply("*Obteniendo información y descargando...*").catch(() => {});

    const jobDir = path.join(os.tmpdir(), `pin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    fs.mkdirSync(jobDir, { recursive: true });

    try {
      const finalUrl = await resolverUrlPin(url);
      const pinId = extraerPinId(finalUrl);

      let meta = {
        titulo: "Pin de Pinterest",
        descripcion: "Sin descripción",
        autor: "Desconocido",
        usuario: "N/D",
        seguidores: "N/D",
        likes: "N/D",
        comentarios: "N/D",
        guardados: "N/D",
        publicado: "N/D",
        urlPerfil: "N/D",
        imagenes: [],
      };

      try {
        const html = await obtenerHtmlPin(finalUrl);
        meta = extraerMetadataPin(html, pinId);
      } catch (metaErr) {
        console.warn("[PINTEREST] Metadata falló, sigo intentando descarga:", metaErr.message);
      }

      const caption = construirCaption(meta, finalUrl);
      const outputTemplate = path.join(jobDir, "pin_media.%(ext)s").replace(/\\/g, "/");

      let errorYt = null;
      await new Promise((resolve) => {
        exec(
          `yt-dlp "${finalUrl}" -o "${outputTemplate}" --no-playlist --retries 3`,
          { timeout: 120000, maxBuffer: 1024 * 1024 * 20 },
          (err, _stdout, stderr) => {
            if (err) errorYt = stderr || err.message;
            resolve();
          },
        );
      });

      let archivos = listarArchivos(jobDir);

      if (archivos.length === 0 && meta.imagenes.length > 0) {
        await descargarImagenes(meta.imagenes, jobDir);
        archivos = listarArchivos(jobDir);
      }

      if (archivos.length === 0) {
        const cookiesPath = rutaCookiesPinterest();
        const cookiesFlag = fs.existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : "";
        await new Promise((resolve) => {
          exec(
            `gallery-dl ${cookiesFlag} -d "${jobDir.replace(/\\/g, "/")}" -o "filename={num}.{extension}" "${finalUrl}"`,
            { timeout: 120000, maxBuffer: 1024 * 1024 * 20 },
            (err, stdout, stderr) => {
              if (stdout) console.log("gallery-dl:", stdout);
              if (err) console.error("gallery-dl ERROR:", err.message, stderr);
              resolve();
            },
          );
        });
        archivos = listarArchivos(jobDir);
      }

      if (archivos.length === 0) {
        throw new Error(errorYt || "No se pudo descargar. El pin puede ser privado o requerir cookies válidas.");
      }

      for (const filePath of archivos) {
        const fileName = path.basename(filePath);
        try {
          const sizeMB = fs.statSync(filePath).size / (1024 * 1024);
          if (sizeMB < 0.001) {
            await m.reply(`⚠️ _${fileName} está vacío (0 bytes), se ignora._`);
            continue;
          }

          const esVideo = /\.(mp4|mov|webm|mkv|m4v|avi)$/i.test(fileName);
          const buffer = fs.readFileSync(filePath);
          const debeSerDocumento = sizeMB > (esVideo ? 16 : 5);

          if (debeSerDocumento) {
            const mimetype = esVideo
              ? "video/mp4"
              : /\.png$/i.test(fileName)
                ? "image/png"
                : /\.webp$/i.test(fileName)
                  ? "image/webp"
                  : "image/jpeg";
            await Moody.sendMessage(
              m.chat,
              {
                document: buffer,
                mimetype,
                fileName,
                caption: `${caption}\n\n_${sizeMB.toFixed(1)}MB enviado como documento_`,
              },
              { quoted: m },
            );
          } else if (esVideo) {
            await Moody.sendMessage(m.chat, { video: buffer, caption }, { quoted: m });
          } else {
            await Moody.sendMessage(m.chat, { image: buffer, caption }, { quoted: m });
          }
        } catch (sendErr) {
          console.error(`[PINTEREST SEND FAIL] ${fileName}:`, sendErr.message);
          await m.reply(`❌ Falló el envío de *${fileName}*:\n_${sendErr.message}_`).catch(() => {});
        }
      }
    } catch (e) {
      console.error("[PINTEREST]", e);
      const msg = `❌ Error en Pinterest:\n\n*${e.message}*\n\n\`\`\`\n${(e.stack || "").split("\n").slice(0, 3).join("\n")}\n\`\`\``;
      await m.reply(msg).catch((err) => console.error("m.reply falló:", err.message));
    } finally {
      fs.rm(jobDir, { recursive: true, force: true }, (cleanupErr) => {
        if (cleanupErr) console.error("[PINTEREST CLEANUP]", cleanupErr.message);
      });
    }
  },
};

function rutaCookiesPinterest() {
  return process.platform === "win32"
    ? "C:/moody/cookies/pinterest-cookies.txt"
    : path.join(process.env.HOME || "/root", "moody/cookies/pinterest-cookies.txt");
}

async function resolverUrlPin(url) {
  const res = await axios.get(url, {
    maxRedirects: 5,
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
    },
    validateStatus: () => true,
  });
  if (res.status >= 400) {
    throw new Error(`Pinterest respondió HTTP ${res.status}. Probable bloqueo/bot o cookies inválidas.`);
  }
  return res.request?.res?.responseUrl || url;
}

function extraerPinId(url) {
  const match = url.match(/\/pin\/(?:[^/]+--)?(\d+)/);
  return match ? match[1] : null;
}

async function obtenerHtmlPin(url) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
  };
  const cookiesPath = rutaCookiesPinterest();

  if (fs.existsSync(cookiesPath)) {
    const cookiePairs = fs.readFileSync(cookiesPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split("\t"))
      .filter((parts) => parts.length >= 7 && /pinterest\.com|pin\.it/i.test(parts[0]))
      .map((parts) => `${parts[5]}=${parts[6]}`);

    const cookies = new Map();
    for (const pair of cookiePairs) cookies.set(pair.split("=")[0], pair);
    const cookieHeader = Array.from(cookies.values()).join("; ");
    if (cookieHeader) headers.Cookie = cookieHeader.slice(0, 8000);
  }

  const res = await axios.get(url, { timeout: 20000, headers });
  return res.data;
}

function extraerMetadataPin(html, pinId) {
  const $ = cheerio.load(html);
  const scriptPws = $("#__PWS_INITIAL_PROPS__").html() || $("#__PWS_DATA__").html();

  if (scriptPws) {
    try {
      const data = JSON.parse(scriptPws);
      const pins = data?.initialReduxState?.pins;
      if (pins && typeof pins === "object") {
        const pin = (pinId && pins[pinId]) || pins[Object.keys(pins)[0]];
        if (pin) {
          const meta = extraerDePinRedux(pin);
          if (meta.imagenes.length > 0 || meta.titulo !== "Sin título") return meta;
        }
      }
    } catch (err) {
      console.warn("[PINTEREST] Error leyendo PWS:", err.message);
    }
  }

  const jsonLd = extraerDeJsonLd($);
  if (jsonLd) return jsonLd;
  throw new Error("No se pudo extraer metadata del pin (ni Redux state ni JSON-LD).");
}

function extraerDePinRedux(pin) {
  const attribution = pin.closeup_attribution || {};
  const stats = pin.aggregated_pin_data?.aggregated_stats || {};
  const num = (value) => typeof value === "number" && Number.isFinite(value) ? ConvertMiles(value) : "N/D";
  const imagenes = [];

  const carouselSlots = pin.carousel_data?.carousel_slots;
  if (Array.isArray(carouselSlots)) {
    for (const slot of carouselSlots) {
      const imageUrl = slot?.images?.orig?.url || slot?.images?.["736x"]?.url || slot?.images?.["564x"]?.url;
      if (imageUrl) imagenes.push(imageUrl);
    }
  }

  if (imagenes.length === 0 && Array.isArray(pin.story_pin_data?.pages)) {
    for (const page of pin.story_pin_data.pages) {
      for (const block of page?.blocks || []) {
        const imageUrl = block?.image?.images?.orig?.url || block?.image?.images?.["736x"]?.url || block?.image?.images?.["564x"]?.url;
        if (imageUrl) imagenes.push(imageUrl);
      }
    }
  }

  if (imagenes.length === 0) {
    const imageUrl = pin.images?.orig?.url || pin.images?.["736x"]?.url || pin.images?.["564x"]?.url;
    if (imageUrl) imagenes.push(imageUrl);
  }

  return {
    titulo: pin.closeup_unified_title || pin.grid_title || pin.title || "Sin título",
    descripcion: pin.description || pin.seo_description || "Sin descripción",
    autor: attribution.full_name || "Desconocido",
    usuario: attribution.username ? `@${attribution.username}` : "N/D",
    seguidores: num(attribution.follower_count),
    likes: num(pin.like_count ?? stats.likes ?? stats.saves),
    comentarios: num(pin.comment_count ?? stats.comments),
    guardados: num(stats.saves),
    publicado: pin.created_at ? new Date(pin.created_at).toLocaleDateString("es-ES") : "N/D",
    urlPerfil: attribution.username ? `https://www.pinterest.com/${attribution.username}/` : "N/D",
    imagenes,
  };
}

function extraerDeJsonLd($) {
  for (const element of $('script[type="application/ld+json"]').toArray()) {
    let data;
    try {
      data = JSON.parse($(element).html());
    } catch {
      continue;
    }

    if (!["SocialMediaPosting", "Recipe", "Product"].includes(data["@type"])) continue;
    const stats = Array.isArray(data.interactionStatistic) ? data.interactionStatistic : [];
    const guardados = stats.find((item) => item.interactionType?.["@type"] === "InteractionCounter")?.userInteractionCount;
    const images = Array.isArray(data.image) ? data.image.filter(Boolean) : data.image ? [data.image] : [];
    const authorUrl = typeof data.author?.url === "string" ? data.author.url : null;
    let usuario = "N/D";

    if (authorUrl) {
      try {
        usuario = `@${new URL(authorUrl).pathname.replace(/\//g, "")}`;
      } catch {
        usuario = "N/D";
      }
    }

    return {
      titulo: data.headline || data.name || "Sin título",
      descripcion: data.articleBody || data.description || "Sin descripción",
      autor: data.author?.name || "Desconocido",
      usuario,
      seguidores: "N/D",
      likes: "N/D",
      comentarios: "N/D",
      guardados: guardados != null ? ConvertMiles(Number(guardados)) : "N/D",
      publicado: data.datePublished ? new Date(data.datePublished).toLocaleDateString("es-ES") : "N/D",
      urlPerfil: authorUrl || "N/D",
      imagenes: images,
    };
  }
  return null;
}

async function descargarImagenes(urls, jobDir) {
  for (let i = 0; i < urls.length; i++) {
    try {
      const res = await axios.get(urls[i], {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.pinterest.com/",
        },
      });

      const contentType = (res.headers["content-type"] || "").toLowerCase();
      const extension = contentType.includes("png") ? "png"
        : contentType.includes("webp") ? "webp"
          : contentType.includes("gif") ? "gif" : "jpg";
      const imagePath = path.join(jobDir, `pin_media_${String(i + 1).padStart(2, "0")}.${extension}`);
      fs.writeFileSync(imagePath, Buffer.from(res.data));
      console.log(`[PINTEREST] Imagen ${i + 1}/${urls.length} descargada`);
    } catch (err) {
      console.error(`[PINTEREST IMG ${i + 1} FAIL]`, err.message);
    }
  }
}

function construirCaption(meta, url) {
  const totalImgs = meta.imagenes?.length || 0;
  const lineaImgs = totalImgs > 1 ? ` *◦ Imágenes :* ${totalImgs}\n` : "";
  return `	╭  ✦ Pinterest Download ✦  ╮\n
 *◦ Título :* ${meta.titulo}
 *◦ Autor :* ${meta.autor} (${meta.usuario})
 *◦ Seguidores :* ${meta.seguidores}
 *◦ Likes :* ${meta.likes}
 *◦ Comentarios :* ${meta.comentarios}
 *◦ Guardados :* ${meta.guardados}
 *◦ Publicado :* ${meta.publicado}
${lineaImgs} *◦ Descripción :* ${meta.descripcion}\n
 *◦ Perfil :* ${meta.urlPerfil}
 *◦ Pin :* ${url}\n
> ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ${BOT_CONFIG.CREATOR_NAME} ©`;
}

function listarArchivos(dir) {
  const resultados = [];
  const extValidas = /\.(mp4|mov|webm|mkv|m4v|avi|jpg|jpeg|png|webp|gif)$/i;

  function walk(current) {
    let items;
    try {
      items = fs.readdirSync(current, { withFileTypes: true });
    } catch (err) {
      console.error(`[PINTEREST] No se pudo leer ${current}:`, err.message);
      return;
    }

    for (const item of items) {
      const fullPath = path.join(current, item.name);
      if (item.isDirectory()) walk(fullPath);
      else if (extValidas.test(item.name) && !item.name.endsWith(".part")) resultados.push(fullPath);
    }
  }

  walk(dir);
  return resultados.sort();
}
