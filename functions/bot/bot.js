// const fs = require("fs").promises;
const { Telegraf } = require("telegraf");
const { Position } = require("kokopu");

const bot = new Telegraf(process.env.BOT_TOKEN);

let activeGame = false;

bot.command("start", (ctx) => {
    console.log(ctx.from);
    bot.telegram.sendMessage(
        ctx.chat.id,
        "hello there! Welcome to my new telegram bot.",
        {}
    );
});

bot.command("newGame", async (ctx) => {
    if (activeGame) {
        cyx.reply("there is already an active game");
        return;
    }

    let gameFile = "";
    let pos = new Position();
    let players = { w: ctx.from.username, b: "" };
    let count = 1;

    async function board(ctx) {
        await ctx.reply(pos.ascii());
    }

    async function join(ctx) {
        if (activeGame) {
            ctx.reply("the game is already started");
            return;
        }

        players.black = ctx.from.username;
        activeGame = true;
        await ctx.reply("Game Started");
    }

    async function play(ctx) {
        if (!activeGame) {
            ctx.reply("NO Active Game!");
            return;
        }

        const currentUser = await ctx.from.username;

        if (currentUser !== players.w && currentUser !== players.b) {
            ctx.reply("You're not playing!");
            return;
        }

        // if(players.pos.turn() !== currentUser)
        let texts = ctx.message.text.split(" ");
        let move = texts[1];

        if (pos.play(move)) {
            if (pos.turn() == "b") {
                gameFile.push(`${count}. ${move}`);
                // await fs.appendFile(gameFile, `${count}. ${move} `);
            } else if (currentUser) {
                // await fs.appendFile(gameFile, `${move} `);
                gameFile.push(`${move} `);
                count++;
            }

            await ctx.reply(`move played ${move}`);
        } else {
            await ctx.reply("Invalid move");
        }
    }

    // await fs.writeFile(gameFile, `[Site chsss telegram bot]\n`);
    // await fs.appendFile(gameFile, `[Date ${new Date().toISOString()}]\n`);
    // await fs.appendFile(gameFile, `[White ${ctx.from.first_name}]\n`);
    // await fs.appendFile(gameFile, `[Black ${ctx.from.first_name}]\n`);

    await ctx.reply("waiting for black, join with /join");

    bot.command("endGame", async (ctx) => {
        activeGame = false;
        pos = "";
        gameFile = [];
        count = 1;
        players = {};
        // const pgn = await fs.readFile(gameFile, "utf-8");
        // await ctx.reply(gameFile);
        ctx.reply("game ended");
    });

    bot.command("board", board);
    bot.command("join", join);
    bot.command("play", play);

    // im using telegraf js for creating a telegram bot i want to stop the function called on command newGame how can i do that
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
