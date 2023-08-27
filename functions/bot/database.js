const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ibczijcmtlqwazqsvakv.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insert(chatId, pgn, fen, white, count = 1) {
    const { data, error } = await supabase
        .from("chess_games")
        .insert([{ chatId, pgn, fen, white, count }])
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
async function update(chatId, pgn, fen, count, black = null) {
    if (black !== null) {
        const { data, error } = await supabase
            .from("chess_games")
            .update({ pgn, fen, count, black })
            .eq("chatId", chatId)
            .select();
        return error;
    }
    const { data, error } = await supabase
        .from("chess_games")
        .update({ pgn, fen, count })
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
    deleteChessGames,
};
