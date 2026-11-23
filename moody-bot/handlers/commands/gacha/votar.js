
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "waifus.json");
const VOTES_PATH = path.join(__dirname, "data", "votes.json");

const VOTE_COOLDOWN = 60 * 60 * 1000;
const VOTE_VALUE = 10;

module.exports = {
    tags: ["gacha"],
    cmd: ["votar"],
    help: ["votar"],

    exec: async (m, Moody, { args = [] } = {}) => {
        try {
            const nombre = args.join(" ").trim();

            if (!nombre) {
                return m.reply(
                    "Escribe el nombre del personaje.\n\nEjemplo: .votar Esdeath"
                );
            }

            if (!fs.existsSync(DB_PATH)) {
                return m.reply("No existe la base de datos de waifus.");
            }

            const waifus = JSON.parse(
                fs.readFileSync(DB_PATH, "utf8")
            );

            const waifu = waifus.find(w =>
                w.name.toLowerCase() === nombre.toLowerCase()
            );

            if (!waifu) {
                return m.reply(`No encontré a ${nombre}.`);
            }

            if (!fs.existsSync(VOTES_PATH)) {
                fs.writeFileSync(VOTES_PATH, "{}");
            }

            const votes = JSON.parse(
                fs.readFileSync(VOTES_PATH, "utf8")
            );

            const user = m.sender;
            const now = Date.now();

            const voteKey = `${user}_${waifu.id}`;
            const lastVote = votes[voteKey];

            if (lastVote && now - lastVote < VOTE_COOLDOWN) {
                const remaining = VOTE_COOLDOWN - (now - lastVote);

                const totalSeconds = Math.ceil(remaining / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;

                return m.reply(
                    `Ya votaste por ${waifu.name}.\n\n` +
                    `Podrás volver a votar en ${minutes} min y ${seconds} seg.\n\n` 
                    
                );
            }

            const oldValue = Number(waifu.value) || 0;
            waifu.value = oldValue + VOTE_VALUE;

            votes[voteKey] = now;

            fs.writeFileSync(
                DB_PATH,
                JSON.stringify(waifus, null, 2)
            );

            fs.writeFileSync(
                VOTES_PATH,
                JSON.stringify(votes, null, 2)
            );

            await m.reply(
                `Haz votado por ${waifu.name}!\n\n` +
                
                `Valor anterior: ${oldValue}\n` +
                `Aumento: +${VOTE_VALUE}\n` +
                `Nuevo valor: ${waifu.value}\n\n` +
                `Podrás volver a votar por ${waifu.name} en 1 hora.\n`
            
            );
            
        } catch (error) {
            console.error("Error en votar:", error);
            await m.reply("Ocurrió un error al registrar el voto.");
        }
    }
};
