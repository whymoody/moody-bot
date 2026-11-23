const { default: axios } = require("axios");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const MAX_BYTES = 20 * 1024 * 1024;

async function fetchImageBuffer(url, { retries = 1, timeout = 20000 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout,
        maxContentLength: MAX_BYTES,
        maxBodyLength: MAX_BYTES,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "image/*,*/*;q=0.8",
        },
      });

      const buffer = Buffer.from(response.data);

      if (!buffer.length) throw new Error("la respuesta está vacía");

      return buffer;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError;
}

async function sendImageFromUrl(
  client,
  chat,
  url,
  { caption = "", mentions = [], quoted } = {},
) {
  try {
    const image = await fetchImageBuffer(url);
    return await client.sendMessage(
      chat,
      { image, caption, mentions },
      { quoted },
    );
  } catch (error) {
    console.error(
      "[media] No se pudo descargar la imagen, se intenta enviar por URL:",
      error.message || error,
    );
    return client.sendMessage(
      chat,
      { image: { url }, caption, mentions },
      { quoted },
    );
  }
}

module.exports = { fetchImageBuffer, sendImageFromUrl, USER_AGENT };
