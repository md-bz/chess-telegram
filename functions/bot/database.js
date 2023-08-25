const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ibczijcmtlqwazqsvakv.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insert(chatId, pgn, fen, white, black, count = 1) {
    const { data, error } = await supabase
        .from("chess_games")
        .insert([{ chatId, pgn, fen, white, black, count }])
        .select();
    return error;
}

async function read(chatId) {
    let { data: chess_games, error } = await supabase
        .from("chess_games")
        .select("pgn, fen, white, black, count")
        .eq("chatId", chatId);
    return chess_games[0];
}

async function readPlayers(chatId) {
    let { data: players, error } = await supabase
        .from("players")
        .select("player1_name,player1_id, player2_name,player2_id")
        .eq("chatId", chatId);
    return players[0];
}

async function playersSet(chatId, playerId, playerName) {
    let players = await readPlayers(chatId);

    if (players === undefined) {
        const { data, error } = await supabase
            .from("players")
            .insert([
                { chatId, player1_id: playerId, player1_name: playerName },
            ])
            .select();
        return error;
    }
}

async function deletePlayers(chatId) {
    const { error } = await supabase
        .from("players")
        .delete()
        .eq("chatId", chatId);
    return error;
}

async function update(chatId, pgn, fen, count) {
    const { data, error } = await supabase
        .from("chess_games")
        .update({ pgn: pgn, fen: fen, count })
        .eq("chatId", chatId)
        .select();
    return error;
}

async function deleteChessGames(chatId) {
    const { error } = await supabase
        .from("chess_games")
        .delete()
        .eq("chatId", chatId);
    return error;
}

module.exports = {
    read,
    insert,
    update,
    readPlayers,
    playersSet,
    deletePlayers,
    deleteChessGames,
};
