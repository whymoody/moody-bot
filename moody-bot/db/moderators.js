const sqlite3 = require("sqlite3");
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "database.db"));
db.configure("busyTimeout", 5000);

let readyPromise = null;

function ready() {
  if (!readyPromise) {
    readyPromise = new Promise((resolve, reject) => {
      db.run(
        "CREATE TABLE IF NOT EXISTS moderators (\n" +
          "  jid TEXT PRIMARY KEY,\n" +
          "  added_by TEXT,\n" +
          "  added_at TEXT\n" +
          ")",
        (error) => {
          if (error) {
            readyPromise = null;
            return reject(error);
          }
          db.run(
            "CREATE TABLE IF NOT EXISTS moderator_aliases (\n" +
              "  jid TEXT PRIMARY KEY,\n" +
              "  moderator_jid TEXT NOT NULL\n" +
              ")",
            (error2) => {
              if (error2) {
                readyPromise = null;
                return reject(error2);
              }
              resolve(true);
            },
          );
        },
      );
    });
  }
  return readyPromise;
}

function normalize(jid) {
  return String(jid || "")
    .split("@")[0]
    .split(":")[0]
    .replace(/\D/g, "");
}

function toJid(jid) {
  const number = normalize(jid);
  return number ? `${number}@s.whatsapp.net` : null;
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) return reject(error);
      resolve(this.changes);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) return reject(error);
      resolve(rows || []);
    });
  });
}

async function add(jid, addedBy, aliases = []) {
  const target = toJid(jid);
  if (!target) throw new Error("JID inválido");
  await ready();
  await run(
    "INSERT INTO moderators (jid, added_by, added_at) VALUES (?, ?, ?)\n" +
      "ON CONFLICT(jid) DO UPDATE SET added_by = excluded.added_by, added_at = excluded.added_at",
    [target, normalize(addedBy), new Date().toISOString()],
  );
  await addAliases(target, aliases);
  return target;
}

async function addAliases(moderatorJid, jids = []) {
  const owner = toJid(moderatorJid);
  if (!owner) return;

  const aliases = (Array.isArray(jids) ? jids : [jids])
    .map(toJid)
    .filter((jid) => jid && jid !== owner);

  if (!aliases.length) return;

  await ready();
  for (const alias of [...new Set(aliases)]) {
    await run(
      "INSERT OR IGNORE INTO moderator_aliases (jid, moderator_jid) VALUES (?, ?)",
      [alias, owner],
    );
  }
}

async function remove(jid) {
  const target = toJid(jid);
  if (!target) throw new Error("JID inválido");
  await ready();

  const aliases = await all(
    "SELECT moderator_jid FROM moderator_aliases WHERE jid = ?",
    [target],
  );
  const owners = [
    ...new Set([target, ...aliases.map((row) => row.moderator_jid)]),
  ];

  let changes = 0;
  for (const owner of owners) {
    changes += await run("DELETE FROM moderators WHERE jid = ?", [owner]);
    await run("DELETE FROM moderator_aliases WHERE moderator_jid = ?", [owner]);
    await run("DELETE FROM moderator_aliases WHERE jid = ?", [owner]);
  }

  return changes > 0;
}

async function entries() {
  await ready();
  const moderators = await all("SELECT jid FROM moderators");
  const aliases = await all("SELECT jid, moderator_jid FROM moderator_aliases");

  return moderators.map(({ jid }) => ({
    jid,
    aliases: aliases
      .filter((row) => row.moderator_jid === jid)
      .map((row) => row.jid),
  }));
}

async function list() {
  await ready();
  const rows = await all("SELECT jid FROM moderators ORDER BY added_at ASC");
  return rows.map((row) => row.jid);
}

async function find(jids = []) {
  const wanted = new Set(
    (Array.isArray(jids) ? jids : [jids]).map(normalize).filter(Boolean),
  );
  if (!wanted.size) return null;

  const rows = await entries();
  const match = rows.find((row) =>
    [row.jid, ...row.aliases].some((jid) => wanted.has(normalize(jid))),
  );

  return match ? match.jid : null;
}

async function has(jids = []) {
  return Boolean(await find(jids));
}

async function isModerator(jid) {
  return has([jid]);
}

module.exports = { add, addAliases, remove, list, entries, find, has, isModerator, normalize };
