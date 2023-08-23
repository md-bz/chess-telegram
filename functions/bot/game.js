const {
    read,
    insert,
    update,
    playersSet,
    readPlayers,
    deleteChessGames,
    deletePlayers,
} = require("./database");
const { createClient } = require("@supabase/supabase-js");
const { Position } = require("kokopu");

let id1 = 4587;
let id2 = 5478;
let id3 = 8721;
async function createGame(
    chatId,
    white,
    black,
    whiteName,
    blackName,
    fen = ""
) {
    let activeGame = await read(chatId);
    if (activeGame !== undefined) {
        console.log("theres already a game in process ");
        return;
    }

    fen = fen
        ? fen
        : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    let gamePgn = `[event ""]
    [Site "chsss telegram bot"]
    [Date "${new Date().toLocaleDateString()}"]
    [White "${whiteName}"]
    [Black "${blackName}"]\n`;

    let error = await insert(chatId, gamePgn, fen, white, black);

    return error;
}

async function endGame(chatId) {
    let game = await read(chatId);
    if (game === undefined) {
        console.log("theres no active game");
        return;
    }
    await deleteChessGames(chatId);
    return game.pgn;
}

module.exports = { createGame, play, endGame };
