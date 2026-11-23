const { default: axios } = require("axios");
const Jimp = require("jimp");

const POKEMON_COUNT = 1025;
const QUIZ_DURATION_MS = 60_000;
const CAPTURE_DURATION_MS = 60_000;
const activeQuizzes = new Map();
const pendingCaptures = new Map();
const TYPE_NAMES = {
  bug: "bicho",
  dark: "siniestro",
  dragon: "dragón",
  electric: "eléctrico",
  fairy: "hada",
  fighting: "lucha",
  fire: "fuego",
  flying: "volador",
  ghost: "fantasma",
  grass: "planta",
  ground: "tierra",
  ice: "hielo",
  normal: "normal",
  poison: "veneno",
  psychic: "psíquico",
  rock: "roca",
  steel: "acero",
  water: "agua",
};
const HABITAT_NAMES = {
  cave: "cueva",
  forest: "bosque",
  grassland: "pradera",
  mountain: "montaña",
  rare: "raro",
  rough_terrain: "terreno rocoso",
  sea: "mar",
  urban: "urbano",
  waters_edge: "orilla del agua",
};
const COLOR_NAMES = {
  black: "negro",
  blue: "azul",
  brown: "marrón",
  gray: "gris",
  green: "verde",
  pink: "rosa",
  purple: "morado",
  red: "rojo",
  white: "blanco",
  yellow: "amarillo",
};

function translateResourceName(value, translations) {
  if (!value) return "desconocido";
  return translations[value] || value.replace(/-/g, " ");
}

function getCaptureKey(chat, sender) {
  return `${chat}:${sender}`;
}

function normalizeGuess(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function getPokemonQuiz() {
  const id = Math.floor(Math.random() * POKEMON_COUNT) + 1;
  const { data: pokemon } = await axios.get(
    `https://pokeapi.co/api/v2/pokemon/${id}`,
    { timeout: 15000 },
  );
  const { data: species } = await axios.get(
    `https://pokeapi.co/api/v2/pokemon-species/${id}`,
    { timeout: 15000 },
  );
  const localizedNames = (species.names || [])
    .filter((entry) => ["es", "es-ES", "es-MX"].includes(entry.language?.name))
    .map((entry) => entry.name);
  const names = [...new Set([...localizedNames, pokemon.name])];
  const genus =
    species.genera?.find((entry) => entry.language?.name === "es")?.genus ||
    species.genera?.find((entry) => entry.language?.name === "en")?.genus ||
    "desconocida";
  const hints = [
    `Categoría: ${genus}`,
    `Tipo: ${pokemon.types
      .map((entry) => translateResourceName(entry.type.name, TYPE_NAMES))
      .join(" / ")}`,
    `Color: ${translateResourceName(species.color?.name, COLOR_NAMES)}`,
    `Hábitat: ${translateResourceName(species.habitat?.name, HABITAT_NAMES)}`,
    `Generación: ${species.generation?.name?.replace("generation-", "").toUpperCase() || "desconocida"}`,
    `Altura: ${(pokemon.height / 10).toFixed(1)} m`,
    `Peso: ${(pokemon.weight / 10).toFixed(1)} kg`,
  ];
  const artwork =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default;

  if (!artwork) {
    throw new Error(`Pokémon ${id} no tiene una imagen disponible.`);
  }

  const { data: imageBuffer } = await axios.get(artwork, {
    responseType: "arraybuffer",
    timeout: 15000,
  });
  const artworkImage = await Jimp.read(imageBuffer);
  artworkImage.contain(400, 400);
  artworkImage.scan(
    0,
    0,
    artworkImage.bitmap.width,
    artworkImage.bitmap.height,
    function (x, y, index) {
      if (this.bitmap.data[index + 3] > 0) {
        this.bitmap.data[index] = 4;
        this.bitmap.data[index + 1] = 10;
        this.bitmap.data[index + 2] = 20;
      }
    },
  );

  const canvas = new Jimp(520, 480, 0x25364aff);
  canvas.composite(artworkImage, 60, 40);

  return {
    id,
    names,
    hints,
    image: await canvas.getBufferAsync(Jimp.MIME_PNG),
  };
}

function getActiveQuiz(chat) {
  const quiz = activeQuizzes.get(chat);
  if (quiz && quiz.expiresAt <= Date.now()) return null;
  return quiz || null;
}

function setActiveQuiz(chat, quiz) {
  const previousQuiz = activeQuizzes.get(chat);
  if (previousQuiz) clearTimeout(previousQuiz.timeout);
  activeQuizzes.set(chat, quiz);
}

function removeActiveQuiz(chat) {
  const quiz = activeQuizzes.get(chat);
  if (quiz) clearTimeout(quiz.timeout);
  activeQuizzes.delete(chat);
  return quiz || null;
}

function setPendingCapture(
  chat,
  sender,
  pokemon,
  expiresAt = Date.now() + CAPTURE_DURATION_MS,
) {
  const key = getCaptureKey(chat, sender);
  const existing = pendingCaptures.get(key);
  if (existing?.timeout) clearTimeout(existing.timeout);
  if (expiresAt <= Date.now()) {
    pendingCaptures.delete(key);
    return;
  }

  const capture = {
    ...pokemon,
    expiresAt,
    timeout: null,
  };
  capture.timeout = setTimeout(() => {
    if (pendingCaptures.get(key) === capture) pendingCaptures.delete(key);
  }, expiresAt - Date.now());
  capture.timeout.unref?.();
  pendingCaptures.set(key, capture);
}

function getPendingCapture(chat, sender) {
  const key = getCaptureKey(chat, sender);
  const capture = pendingCaptures.get(key);
  if (capture && capture.expiresAt <= Date.now()) {
    clearTimeout(capture.timeout);
    pendingCaptures.delete(key);
    return null;
  }
  return capture || null;
}

function removePendingCapture(chat, sender) {
  const key = getCaptureKey(chat, sender);
  const capture = pendingCaptures.get(key);
  if (capture) clearTimeout(capture.timeout);
  pendingCaptures.delete(key);
  return capture || null;
}

module.exports = {
  QUIZ_DURATION_MS,
  CAPTURE_DURATION_MS,
  getPokemonQuiz,
  normalizeGuess,
  getActiveQuiz,
  setActiveQuiz,
  removeActiveQuiz,
  setPendingCapture,
  getPendingCapture,
  removePendingCapture,
};
