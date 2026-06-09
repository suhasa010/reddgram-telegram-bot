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
require('dotenv').config();
const bot = new TeleBot(process.env.BOT_TOKEN);

bot.on("text", msg => {
  bot.sendMessage(msg.chat.id,"⚠️  Reddit updates are currently unavailable.\n\nReddit has begun blocking the method used by this bot to retrieve subreddit data. The bot remains online, but new Reddit posts may not be delivered until a workaround or approved API access is available.\nUpdates will be posted here as the situation develops.")
  
});
       
bot.connect()
