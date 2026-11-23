const fs = require("fs");
const path = require("path");

const collectionPath = path.join(__dirname, "..", "db", "pokedex.json");
let writeQueue = Promise.resolve();

async function readCollection() {
  try {
    const contents = await fs.promises.readFile(collectionPath, "utf8");
    const collection = JSON.parse(contents);
    if (!collection || typeof collection !== "object" || Array.isArray(collection)) {
      throw new Error("El archivo de Pokédex tiene un formato inválido.");
    }
    return collection;
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function writeCollection(collection) {
  await fs.promises.mkdir(path.dirname(collectionPath), { recursive: true });
  const temporaryPath = `${collectionPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.promises.writeFile(
      temporaryPath,
      JSON.stringify(collection, null, 2),
      "utf8",
    );
    await fs.promises.rename(temporaryPath, collectionPath);
  } catch (error) {
    await fs.promises.unlink(temporaryPath).catch((cleanupError) => {
      if (cleanupError.code !== "ENOENT") {
        console.error("[pokedex] No se pudo limpiar el archivo temporal:", cleanupError);
      }
    });
    throw error;
  }
}

function runSerialized(operation) {
  const result = writeQueue.then(operation);
  writeQueue = result.catch(() => {});
  return result;
}

async function addPokemon(jid, pokemon) {
  if (!Number.isSafeInteger(pokemon.id) || pokemon.id < 1 || !pokemon.name) {
    throw new Error("Los datos del Pokémon capturado no son válidos.");
  }

  return runSerialized(async () => {
    const collection = await readCollection();
    const userCollection = collection[jid] || {};
    const key = String(pokemon.id);
    const existing = userCollection[key];
    userCollection[key] = {
      id: pokemon.id,
      name: existing?.name || pokemon.name,
      count: (Number(existing?.count) || 0) + 1,
    };
    collection[jid] = userCollection;
    await writeCollection(collection);
    return userCollection[key];
  });
}

async function getPokemonCollection(jid) {
  await writeQueue;
  const collection = await readCollection();
  const userCollection = collection[jid] || {};
  return Object.values(userCollection)
    .filter(
      (pokemon) =>
        Number.isSafeInteger(pokemon.id) &&
        pokemon.id > 0 &&
        Number.isSafeInteger(pokemon.count) &&
        pokemon.count > 0 &&
        typeof pokemon.name === "string",
    )
    .sort((first, second) => first.id - second.id);
}

module.exports = {
  addPokemon,
  getPokemonCollection,
};
