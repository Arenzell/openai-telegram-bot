const { Telegraf } = require("telegraf")
require("dotenv").config()
const { generateChatResponse } = require("../../openai/main")
const bot = new Telegraf(process.env.BOT_TOKEN)

const allowedGroups = process.env.GROUP_ID.toString().split(',')

bot.start(ctx => {
    console.log("Received /start command")
    try {
        if (!allowedGroups.includes(ctx.message?.chat?.id.toString())) {
            return ctx.reply("Sorry! I am not allowed to reply outside specific groups.");
        };
        ctx.reply("Hi, this OpenAI_Bot_BD, ready to chat with you.")
        return ctx.reply("Reply to my message to start chatting.")
    } catch (e) {
        console.error("error in start action:", e)
        return ctx.reply("Error occured")
    }
})

bot.on("message", async (ctx) => {
    if (ctx.message.via_bot) {
        return ctx.reply("Sorry! I don't reply bots.");
    }
    try {
        if (!allowedGroups.includes(ctx.message?.chat?.id.toString())) {
            return ctx.reply("Sorry! I am not allowed to reply outside specific groups.");
        };

        // message must be a reply of this bot's message
        if (ctx.message?.reply_to_message?.from?.id?.toString() !== process.env.BOT_ID.toString()) return

        ctx.telegram.sendChatAction(ctx.message.chat.id, "typing")

        const response = await generateChatResponse(ctx.message.text, ctx.message?.reply_to_message?.text,
            ctx.message?.from?.username || ctx.message?.from?.id?.toString());
        return ctx.reply(response, { parse_mode: "Markdown", reply_to_message_id: ctx.message?.reply_to_message?.message_id, allow_sending_without_reply: true });
    } catch (error) {
        console.log(error)
        return ctx.reply("Error occured");
    }
})

exports.bot = bot;

// AWS event handler syntax (https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html)
exports.handler = async event => {
    try {
        await bot.handleUpdate(JSON.parse(event.body))
        return { statusCode: 200, body: "" }
    } catch (e) {
        console.error("error in handler:", e)
        return { statusCode: 400, body: "This endpoint is meant for bot and telegram communication" }
    }
}