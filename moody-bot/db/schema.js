const sqlite3 = require("sqlite3");
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "database.db"));
db.configure("busyTimeout", 5000);

let readyPromise = null;

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

async function ensureColumn(table, column, definition) {
  const rows = await all(`PRAGMA table_info(${table})`);
  if (rows.some((row) => row.name === column)) return false;

  await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  return true;
}

function ready() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await ensureColumn("users", "married_date", "TEXT");
      await ensureColumn("users", "gender", "TEXT");
      await ensureColumn("users", "birthday", "TEXT");
      await ensureColumn("users", "bio", "TEXT");
      return true;
    })().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  return readyPromise;
}

module.exports = { ready, ensureColumn };
