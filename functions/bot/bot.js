// const fs = require("fs").promises;
const { Telegraf } = require("telegraf");
const { Position } = require("kokopu");
const { read, insert, update, deleteChessGames } = require("./database");
const { createGame, endGame, setBlack } = require("./game");
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command("start", async (ctx) => {
    ctx.reply("Hi there Welcome to chess bot");
});

bot.command("new", async (ctx) => {
    const chatId = ctx.chat.id;
    let game = await read(chatId);
    if (game !== undefined) {
        await ctx.reply("there is already an active game");
        return;
    }
    let fen = ctx.message.text.slice(4);
    if (fen !== "") {
        try {
            let pos = new Position(fen);
            await createGame(chatId, ctx.from.id, ctx.from.first_name, fen);
        } catch (error) {
            ctx.reply(`invalid fen format,${error.message}`);
            return;
        }
    } else {
        await createGame(chatId, ctx.from.id, ctx.from.first_name);
    }

    await ctx.reply("waiting for player 2 join with /join");
});

bot.command("join", async (ctx) => {
    const chatId = ctx.chat.id;
    let game = await read(chatId);
    if (game.black !== null) {
        await ctx.reply("there is already an active game play with /play");
        return;
    }
    await setBlack(chatId, ctx.from.id, ctx.from.first_name);
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
        let result;
        if (pos.isCheckmate()) {
            if (turn === "w") {
                await ctx.reply("checkmate, white wins");
                result = "1-0";
            }
            if (turn === "b") {
                await ctx.reply("checkmate, black wins");
                result = "0-1";
            }
            await endGame(chatId);
            await ctx.reply(game.pgn + result);
            return;
        } else if (pos.isStalemate()) {
            await ctx.reply("stalemate");
            result = "1/2-1/2";
            await endGame(chatId);
            await ctx.reply(game.pgn + result);
            return;
        }

        let error = await update(chatId, game.pgn, pos.fen(), game.count);
        ctx.reply("move played " + move);
        return;
    }
    ctx.reply("invalid move");
});

bot.command("resign", async (ctx) => {
    let chatId = ctx.chat.id;
    let game = await read(chatId);
    if (game === undefined) {
        await ctx.reply("there is no active game start an game with /newGame");
        return;
    }
    let result;
    if (ctx.from.id === game.white) {
        await ctx.reply("white resigned, black wins.");
        result = "0-1";
    } else {
        await ctx.reply("black resigned, white wins.");
        result = "1-0";
    }

    let pgn = await endGame(chatId);
    await ctx.reply(pgn + result);
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
