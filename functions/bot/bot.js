// const fs = require("fs").promises;
const { Telegraf } = require("telegraf");
const { Position } = require("kokopu");
const {
    read,
    insert,
    playersSet,
    deletePlayers,
    update,
    readPlayers,
    deleteChessGames,
} = require("./database");
const { createGame, endGame } = require("./game");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command("start", async (ctx) => {
    ctx.reply("Hi there welocme to chess bot");
});

bot.command("newGame", async (ctx) => {
    const chatId = ctx.chat.id;
    let game = await read(chatId);
    if (game !== undefined) {
        await ctx.reply("there is already an active game");
        return;
    }

    await playersSet(chatId, ctx.from.id, ctx.from.first_name);
    await ctx.reply("Game started waiting for player 2 join with /join");
});

bot.command("join", async (ctx) => {
    const chatId = ctx.chat.id;
    let game = await read(chatId);

    if (game !== undefined) {
        await ctx.reply("there is already an active game play with /play");
        return;
    }

    let players = await readPlayers(chatId);
    if (players === undefined) {
        ctx.reply("there is no active game start an game with /newGame");
        return;
    }

    await createGame(
        chatId,
        players.player1_id,
        ctx.from.id,
        players.player1_name,
        ctx.from.first_name
    );
    await deletePlayers(chatId);
    await ctx.reply("game started play with /play");
});

bot.command("play", async (ctx) => {
    let chatId = ctx.chat.id;
    let game = await read(chatId);

    if (game === undefined) {
        await ctx.reply("there is no active game start an game with /newGame");
        return;
    }

    let texts = ctx.message.text.split(" ");
    let move = texts[1];
    if (move == undefined) {
        ctx.reply("invalid move play with /play move ");
        return;
    }

    let pos = new Position(game.fen);
    let turn = pos.turn();
    let currentPlayerId = turn === "w" ? game.white : game.black;
    if (currentPlayerId !== ctx.from.id) {
        await ctx.reply("its not your turn");
        return;
    }

    if (pos.play(move)) {
        if (turn === "w") {
            game.pgn = game.pgn + `${game.count}. ${move} `;
        }
        if (turn === "b") {
            game.pgn = game.pgn + `${move}\n`;
            game.count++;
        }
        let error = await update(chatId, game.pgn, pos.fen(), game.count);
        ctx.reply("move played " + move);
        return;
    }
    ctx.reply("invalid move");
});

bot.command("board", async (ctx) => {
    let chatId = ctx.chat.id;
    let game = await read(chatId);
    if (game === undefined) {
        await ctx.reply("there is no active game start an game with /newGame");
        return;
    }
    let pos = new Position(game.fen);
    await ctx.reply(pos.ascii());
});

bot.command("endGame", async (ctx) => {
    let chatId = ctx.chat.id;
    let game = await read(chatId);
    if (game === undefined) {
        await ctx.reply("there is no active game start an game with /newGame");
        return;
    }
    let pgn = await endGame(chatId);
    ctx.reply(pgn);
});

// AWS event handler syntax (https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html)
exports.handler = async (event) => {
    try {
        await bot.handleUpdate(JSON.parse(event.body));
        return { statusCode: 200, body: "" };
    } catch (e) {
        console.error("error in handler:", e);
        return {
            statusCode: 400,
            body: "This endpoint is meant for (abot and telegram communication",
        };
    }
};
