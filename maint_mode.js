//Don't sleep
/*const http = require("http");
const express = require("express");

const Log = require("./models/Log");
const app = express();

app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);
*/
const TeleBot = require("telebot");
const fs = require("fs");
const request = require("request");

const bot = new TeleBot(process.env.BOT_TOKEN);

bot.on("text", msg => {
  bot.sendMessage(msg.chat.id,"Bot taken down due to major service issues in my host glitch.com. Any updates about the same will be posted on @reddgramIssues. Thanks for the cooperation.")
});
       
bot.connect()