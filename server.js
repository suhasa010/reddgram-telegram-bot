//Don't sleep
const http = require("http");
const express = require("express");
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 240000);

//actual code
const { Telegraf } = require("telegraf");
const TextCommand = Telegraf.TextCommand;
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");

const keyboard = Markup.inlineKeyboard([
  Markup.callbackButton("Delete", "delete")
]);

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start(ctx => ctx.reply("Welcome!"));
bot.help(ctx => ctx.reply("Send /dice\n"));
bot.on("sticker", ctx => ctx.reply("👍"));
//bot.hears("Hi", ctx => ctx.reply("Hey there"));
//bot.hears("Fuck you"), ctx => ctx.reply("Fuck you too");
bot.command("/dice", ctx => ctx.telegram.sendDice(ctx.message.chat.id));
//bot.on('message', (ctx) => ctx.telegram.sendCopy(ctx.chat.id, ctx.message, Extra.markup(keyboard)))
//bot.action('delete', ({ deleteMessage }) => deleteMessage())
bot.launch();

/*Ignore the below code
var telegram = require("telegram-bot-api", "slimbot");
const TextCommand = telegram.TextCommand;
//const TelegramBaseController = telegram.TelegramBaseController

var api = new telegram({
  token: "1155726669:AAGKOtCKIrbdvVzgfuBIKDKrF_A-Aj-QzpE",
  updates: {
    enabled: true
  }
});

  api.on("message", function(message) {
    var chat_id = message.chat.id;
  // It'd be good to check received message type here
  // And react accordingly
  // We consider that only text messages can be received here

  sending a message
  api.sendMessage({
	chat_id: 204457595,
	text: 'right back at you'

  //api.sendDice(chat_id)
  api.sendMessage({
      chat_id: message.chat.id,
      text: message.text ? message.text : "This message doesn't contain text :("
    })
    .then(function(message) {
      console.log(message);
    })
    .catch(function(err) {
      console.log(err);
    });
});
*/
