const { read, insert, update, deleteChessGames } = require("./database");
const { createClient } = require("@supabase/supabase-js");
const { Position } = require("kokopu");

async function createGame(chatId, white, whiteName, fen = "") {
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
    [White "${whiteName}"]\n`;

    let error = await insert(chatId, gamePgn, fen, white);

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

async function setBlack(chatId, black, blackName) {
    let game = await read(chatId);
    game.pgn += `[Black "${blackName}"]\n`;
    let error = await update(chatId, game.pgn, game.fen, game.count, black);
    return error;
}

module.exports = { createGame, endGame, setBlack };
