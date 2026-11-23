const sqlite3 = require("sqlite3");
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "database.db"));

db.configure("busyTimeout", 5000);

let readyPromise = null;

function ready() {
  if (!readyPromise) {
    readyPromise = new Promise((resolve, reject) => {
      db.run(
        "CREATE TABLE IF NOT EXISTS settings (\n" +
          "  chat_id TEXT NOT NULL,\n" +
          "  key TEXT NOT NULL,\n" +
          "  value TEXT,\n" +
          "  PRIMARY KEY (chat_id, key)\n" +
          ")",
        (error) => {
          if (error) {
            readyPromise = null;
            return reject(error);
          }
          resolve(true);
        },
      );
    });
  }
  return readyPromise;
}

async function get(chatId, key) {
  await ready();
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT value FROM settings WHERE chat_id = ? AND key = ?",
      [chatId, key],
      (error, row) => {
        if (error) return reject(error);
        resolve(row ? row.value : null);
      },
    );
  });
}

async function set(chatId, key, value) {
  await ready();
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO settings (chat_id, key, value) VALUES (?, ?, ?)\n" +
        "ON CONFLICT(chat_id, key) DO UPDATE SET value = excluded.value",
      [chatId, key, value],
      (error) => {
        if (error) return reject(error);
        resolve(true);
      },
    );
  });
}

module.exports = { get, set };
