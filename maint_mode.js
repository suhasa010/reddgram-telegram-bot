const TeleBot = require("telebot");
const fs = require("fs");
const request = require("request");

const bot = new TeleBot(process.env.BOT_TOKEN);

bot.on("text", msg => {
  bot.sendMessage(msg.chat.id,"Bot taken down for maintenance! Please try again in 10 minutes. Thanks for the cooperation.")
});
       
bot.connect()