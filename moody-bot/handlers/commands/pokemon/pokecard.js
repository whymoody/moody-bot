const { default: axios } = require("axios");

const API_URL = "https://api.pokemontcg.io/v2/cards";
const PAGE_SIZE = 30;
const MAX_SEARCH_ATTEMPTS = 3;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function searchCards(query, headers, page = 1) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_SEARCH_ATTEMPTS; attempt += 1) {
    try {
      return await axios.get(API_URL, {
        headers,
        params: {
          q: `name:"${escapeSearchPhrase(query)}"`,
          page,
          pageSize: PAGE_SIZE,
          select: "id,name,hp,number,rarity,set,images",
        },
        timeout: 30000,
      });
    } catch (error) {
      lastError = error;
      const status = axios.isAxiosError(error) ? error.response?.status : null;
      const retryable = !status || status >= 500;
      if (!retryable || attempt === MAX_SEARCH_ATTEMPTS) throw error;
      await wait(attempt * 1000);
    }
  }

  throw lastError;
}

function escapeSearchPhrase(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

module.exports = {
  tags: ["pokemon"],
  args: ["nombre del Pokémon"],
  cmd: ["pokecard", "pokemoncard"],
  help: ["pokecard"],
  exec: async (m, Moody, { prefix, cmd, args }) => {
    const query = args.join(" ").trim();
    if (!query) {
      return m.reply(
        `*Ejemplo:* ${prefix + cmd} Charizard\nEl bot buscará una carta existente y elegirá una versión al azar.`,
      );
    }

    try {
      const headers = process.env.POKEMON_TCG_API_KEY
        ? { "X-Api-Key": process.env.POKEMON_TCG_API_KEY }
        : {};
      const firstPage = await searchCards(query, headers);
      const totalCount = Number(firstPage.data?.totalCount) || 0;
      let cards = firstPage.data?.data || [];

      if (totalCount > cards.length) {
        const randomIndex = Math.floor(Math.random() * totalCount);
        const randomPage = Math.floor(randomIndex / PAGE_SIZE) + 1;
        if (randomPage > 1) {
          const pageResponse = await searchCards(query, headers, randomPage);
          cards = pageResponse.data?.data || [];
        }
        const cardOnPage = cards[randomIndex % PAGE_SIZE];
        cards = cardOnPage ? [cardOnPage] : [];
      } else {
        cards = cards.filter((card) => card.images?.large || card.images?.small);
        const randomIndex = Math.floor(Math.random() * cards.length);
        cards = cards[randomIndex] ? [cards[randomIndex]] : [];
      }

      const cardsWithImages = cards.filter(
        (card) => card.images?.large || card.images?.small,
      );
      if (!cardsWithImages.length) {
        return m.reply(
          "*No encontré cartas con ese nombre. Prueba con el nombre en inglés, por ejemplo: .pokecard Charizard.*",
        );
      }

      const card = cardsWithImages[0];
      const imageUrl = card.images.large || card.images.small;
      const { data: image } = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
      });

      const details = [
        card.set?.name,
        card.number ? `N.º ${card.number}` : null,
        card.rarity,
        card.hp ? `${card.hp} HP` : null,
      ].filter(Boolean);

      return Moody.sendMessage(
        m.chat,
        {
          image,
          caption: `${card.name}${details.length ? `\n${details.join(" · ")}` : ""}`,
        },
        { quoted: m },
      );
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : null;
      console.error(
        "[pokecard] No se pudo buscar la carta:",
        status || error.message || error,
        error.response?.data?.detail || error.response?.data?.message || "",
      );

      if (status === 401 || status === 403) {
        return m.reply(
          "*La API rechazó la solicitud. Revisa la clave POKEMON_TCG_API_KEY configurada para el bot.*",
        );
      }
      if (status === 429) {
        return m.reply(
          "*Se alcanzó el límite de consultas de la API de cartas. Inténtalo más tarde o configura POKEMON_TCG_API_KEY.*",
        );
      }
      if (status >= 500) {
        return m.reply(
          "*El catálogo de cartas está temporalmente fuera de servicio. El bot ya intentó consultar varias veces; inténtalo de nuevo más tarde.*",
        );
      }
      return m.reply(
        "*No pude consultar el catálogo de cartas ahora. Inténtalo de nuevo más tarde.*",
      );
    }
  },
};
