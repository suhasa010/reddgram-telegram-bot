//Don't sleep
import help from './help';
import http from "http";
import express from "express";
require('dotenv').config();
import fetch from "node-fetch";

import Sentry from "@sentry/node";
import Tracing from "@sentry/tracing";

Sentry.init({
  dsn: "https://5222779e2d594b96815ed26ff756eb3b@o915566.ingest.sentry.io/5855972",

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  release: "reddgram@2.0.1",
  tracesSampleRate: 0.5,
  debug: false,
});

//const logRoutes = require("./routes/log.routes");
//const initDB = require("./db");
//const Log = require("./models/Log");
//const app = express();

//initDB();

// console.log(logRoutes);

//app.use(logRoutes);

/*
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});

app.listen(process.env.PORT);
*/

/*
const isOwner = (req, res, next) => {
  const secret = req.query.secret;
  
  if (secret === process.env.SECRET) {
    return next();
  }
  
  return res.status(401).send('you don\'t have permission');
}

app.use('/static', isOwner, express.static(__dirname));
*/

/*setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 200000);
*/

/*const MongoClient = require('mongodb').MongoClient;
const uri = process.env.DB_URI;
const client = new MongoClient(uri, { useNewUrlparse_mode: parser: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  collection.collection("devices").insertOne({name:"suhasa"}, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    db.close();
  });
  client.close();
});
*/

import redis from "redis";
const client = redis.createClient();

client.on("error", function (error: any) {
  console.error(error);
  Sentry.captureException(error);
});

//client.get("15024063",redis.print);

/*
client.set("key", "value", redis.print);
client.get("key", redis.print);
client.set("foo", "bar");
client.get("foo", redis.print);
*/
// var console = require("ccipher").createconsole(); // logs to STDOUT
// // var console = require("console").createconsole("/home/pi/reddgram-telegram-bot/development.log"); // logs to a file

// //custom date for logging
// let options = {
//   hour: "2-digit",
//   minute: "2-digit",
//   second: "2-digit",
//   hour12: true,
//   weekday: "short",
//   year: "numeric",
//   month: "long",
//   day: "numeric",
//   timeZone: "Asia/Kolkata",
//   timeZoneName: "short"
// };
// console.format = function (level: any, date: any, message: any) {
//   return [
//     level,
//     " [",
//     new Date().toLocaleString("en-IN",),
//     "] ",
//     message
//   ].join("");
// };

//reddit browser

var parser = require("tld-extract");

import { Bot } from "grammy";
import fs from "fs";
import request from "request";
const BOT_TOKEN = process.env.BOT_TOKEN;
const TEST_BOT_TOKEN = process.env.TEST_BOT_TOKEN;

const bot = new Bot(TEST_BOT_TOKEN)
var prettytime = require("prettytime");
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from "constants";
import { features } from 'process';


let db = {};
let rLimit = 100;
var skips = 0; //keep track of no. of sticky threads skipped

function updateUser(userId: string, subreddit: string, option: string, postNum: number) {
  db[userId] = { subreddit, option, postNum };
}

function sendRedditPost(messageId: string, subreddit: string, option: string, postNum: number) {
  const options = getOptions(option, rLimit);
  var start = new Date();
  const url = `http://www.reddit.com\/r\/${subreddit}\/${options}`
  const sendRedditPost = async (url: string) => {
    try {
      const response = await fetch(url);
      const body = await response.json();
      // send error message if the bot encountered one
      if (body.hasOwnProperty("error") || body.data.children.length < 1) {
        return sendErrorMsg(messageId, subreddit);
      } else if (body.data.children.length - 1 < postNum) {
        return noMorePosts(messageId);
      }
      //console.info(postNum)
      //if (body.data.children[0].data.subreddit_type === "restricted")
      //return Restricted(messageId);

      // reddit post data, "postNum+skips" takes into consideration the number of sticky threads skipped.
      try {
        var redditPost = body.data.children[postNum + skips].data;
      } catch (err) {
        console.error(`ERROR: ${err}`)
      }

      //ignore stickied/pinned posts
      for (postNum = skips; redditPost.stickied === true; postNum++) {
        try {
          redditPost = body.data.children[postNum + 1].data;
        } catch (err) {
          console.error("ERROR: " + err);
          return noMorePosts(messageId);
        }
        skips = skips + 1;
        //console.info(postNum)
      }

      //if(redditPost.stickied === true)
      //bot.api.click()
      redditPost.title = redditPost.title.replace(/&amp;/g, "&");

      // inline buttons
      const markup = bot.api.inlineKeyboard([
        [
          //bot.api.inlineButton('🔗 Reddit', { url: `https://www.reddit.com${redditPost.permalink}` }),
          bot.api.inlineButton("💬 Comments", {
            url: `https://www.reddit.com${redditPost.permalink}`
          }),
          bot.api.inlineButton("↗️ Share", {
            url: `https://t.me/share/url?text=🔖 ${redditPost.title}\n\n↗️ Shared via @RedditBrowserBot&url=https%3A//www.reddit.com${redditPost.permalink}`
          }),
          bot.api.inlineButton("▶️ Next", { callback: "callback_query_next" })
        ]
      ]);

      // if post is an image or if it's a gif or a link
      if (
        /\.(jpe?g|png)$/.test(redditPost.url) ||
        redditPost.domain === "i.reddituploads.com" ||
        (/\.(jpe?g|png)$/.test(redditPost.url) && redditPost.domain === "i.redd.it") ||
        (/\.(jpe?g|png)$/.test(redditPost.url) && redditPost.domain === "imgur.com") ||
        (/\.(jpe?g|png)/.test(redditPost.url) && redditPost.domain === "i.imgur.com") ||
        redditPost.domain === "preview.reddit.com" ||
        redditPost.domain === "preview.redd.it"
      ) {
        //sendPlsWait(messageId);
        //bot.api.sendChatAction(messageId, "upload_photo");
        return sendImagePost(messageId, redditPost, markup);
      }
      //gif
      else if (
        redditPost.preview &&
        redditPost.preview.images[0].variants.mp4
      ) {
        bot.api.sendChatAction(messageId, "upload_video").catch( (err: { description: string | string[]; }) => {
          if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
            console.info(`user ${messageId}'s subscriptions were cleared`)
            return client.del(messageId)
          }
        });
        // sendPlsWait(messageId);
        sendGifPost(messageId, redditPost, markup);
      }
      //animation
      else if (
        (!redditPost.crosspost_parent && redditPost.domain === "v.redd.it") ||
        (/\.(gif)$/.test(redditPost.url) && redditPost.domain === "i.redd.it") ||
        (/\.(gifv|gif)$/.test(redditPost.url) && redditPost.domain === "i.imgur.com") ||
        (/\.(gif)$/.test(redditPost.url) && redditPost.domain === "preview.redd.it") ||
        redditPost.domain === "gfycat.com"
      ) {
        bot.api.sendChatAction(messageId, "upload_video").catch ((err: { description: string | string[]; }) => {
          if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
            console.info(`user ${messageId}'s subscriptions were cleared`)
            return client.del(messageId)
          }
        });
        return sendAnimPost(messageId, redditPost, markup);
      }
      //video
      else if (
        redditPost.domain === "youtu.be" ||
        redditPost.domain === "youtube.com" ||
        redditPost.domain === "v.redd.it" ||
        redditPost.domain === "i.redd.it" //||
        //redditPost.domain === "gfycat.com"
      ) {
        //bot.api.sendChatAction(messageId, "upload_video");
        return sendVideoPost(messageId, redditPost, markup);
      }
      //link
      else if (
        /http(s)?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi.test(
          redditPost.url
        ) &&
        !redditPost.selftext
      ) {
        //bot.api.sendChatAction(messageId, "typing");
        return sendLinkPost(messageId, redditPost, markup);
      }
      //text
      else {
        //bot.api.sendChatAction(messageId, "typing");
        return sendMessagePost(messageId, redditPost, markup);
      }

      // unsuccessful response
    }
    catch (err) {
      if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
        console.info(`user ${messageId}'s subscriptions were cleared`)
        return client.del(messageId)
      }
      console.log(err);
    }
  };
  try {
    sendRedditPost(url)
  }
  catch (error) {
    console.log(error);
    //Sentry.captureException(error);
  }
  //console.log(error
  //console.info("http request completed")
}

//original "request" based code 
/* function sendRedditPost(messageId, subreddit, option, postNum) {
  const options = getOptions(option, rLimit);
  var start = new Date();
  request(
    { url: `http://www.reddit.com/r/${subreddit}/${options}`, json: true },
    function(error, response, body) {
      //console.log(error)
      // check if response was successful
      if (!error && response.statusCode === 200) {
        
        // send error message if the bot encountered one
        if (body.hasOwnProperty("error") || body.data.children.length < 1) {
          return sendErrorMsg(messageId);
        } else if (body.data.children.length - 1 < postNum) {
          return noMorePosts(messageId);
        }
        //console.info(postNum)
        //if (body.data.children[0].data.subreddit_type === "restricted")
        //return Restricted(messageId);

        // reddit post data, "postNum+skips" takes into consideration the number of sticky threads skipped.
        var redditPost = body.data.children[postNum + skips].data;

        //ignore stickied/pinned posts
        for (postNum = skips; redditPost.stickied === true; postNum++) {
          try {
            redditPost = body.data.children[postNum + 1].data;
          } catch (err) {
            console.error("ERROR: "+err);
            return noMorePosts(messageId);
          }
          skips = skips + 1;
          //console.info(postNum)
        }

        //if(redditPost.stickied === true)
        //bot.api.click()
        redditPost.title = redditPost.title.replace(/&amp;/g, "&");

        // inline buttons
        const markup = bot.api.inlineKeyboard([
          [
            //bot.api.inlineButton('🔗 Reddit', { url: `https://www.reddit.com${redditPost.permalink}` }),
            bot.api.inlineButton("💬 Comments", {
              url: `https://www.reddit.com${redditPost.permalink}`
            }),
            bot.api.inlineButton("↗️ Share", {
              url: `https://t.me/share/url?text=%0D%0D${redditPost.title}\n\nShared via @RedditBrowserBot&url=https%3A//www.reddit.com${redditPost.permalink}`
            }),
            bot.api.inlineButton("⏭ Next", { callback: "callback_query_next" })
          ]
        ]);
        
        // if post is an image or if it's a gif or a link
        if (
          /\.(jpe?g|png)$/.test(redditPost.url) ||
          redditPost.domain === "i.reddituploads.com" ||
          redditPost.domain === "i.redd.it" ||
          redditPost.domain === "imgur.com" ||
          redditPost.domain === "preview.reddit.com" ||
          redditPost.domain === "preview.redd.it"
        ) {
          //sendPlsWait(messageId);
          //bot.api.sendChatAction(messageId, "upload_photo");
          return sendImagePost(messageId, redditPost, markup);
        }
        //gif
        else if (
          redditPost.preview &&
          redditPost.preview.images[0].variants.mp4
        ) {
          bot.api.sendChatAction(messageId, "upload_video");
          // sendPlsWait(messageId);
          sendGifPost(messageId, redditPost, markup);
        }
        //video
        else if (
          redditPost.domain === "youtu.be" ||
          redditPost.domain === "youtube.com" ||
          redditPost.domain === "v.redd.it" ||
          redditPost.domain === "i.redd.it" ||
          redditPost.domain === "gfycat.com"
        ) {
          //bot.api.sendChatAction(messageId, "upload_video");
          return sendVideoPost(messageId, redditPost, markup);
        }
        //link
        else if (
          /http(s)?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi.test(
            redditPost.url
          ) &&
          !redditPost.selftext
        ) {
          //bot.api.sendChatAction(messageId, "typing");
          return sendLinkPost(messageId, redditPost, markup);
        }
        //text
        else {
          //bot.api.sendChatAction(messageId, "typing");
          return sendMessagePost(messageId, redditPost, markup);
        }

        // unsuccessful response
      } else {
        console.error("ERROR: "+error);
        return sendErrorMsg(messageId);
      }
    }
  );
  //console.info("http request completed")
} */

// options
function getOptions(option: string, rlimit: number) {
  if (option === "top") {
    return `top.json?t=day&limit=${rlimit}`;
  } else if (option === "toph") {
    return `top.json?t=hour&limit=${rlimit}`;
  } else if (option === "topw") {
    return `top.json?t=week&limit=${rlimit}`;
  } else if (option === "topm") {
    return `top.json?t=month&limit=${rlimit}`;
  } else if (option === "topy") {
    return `top.json?t=year&limit=${rlimit}`;
  } else if (option === "all") {
    return `top.json?t=all&limit=${rlimit}`;
  } else if (option === "hot") {
    return `hot.json?&limit=${rlimit}`;
  } else if (option === "new") {
    return `new.json?&limit=${rlimit}`;
  } else {
    return `hot.json?t=day&limit=${rlimit}`;
  }
}

//parse_mode: parse_mode option for bot.api.sendMessage()
const parse = "HTML";

/*function Restricted(messageId) {
  const errorMsg = `<i>ERROR: This subreddit is restricted.</i>`;
  console.error(errorMsg);
  return bot.api.sendMessage(messageId, errorMsg, { parse_mode: parse });
  
}*/

function sendErrorMsg(messageId: string, subreddit: string) {
  const errorMsg = `<i>ERROR: Couldn't find the subreddit: "${subreddit}". Use /help for instructions.</i>`;
  console.error(errorMsg);
  return bot.api.sendMessage(messageId, errorMsg, { parse_mode: parse });
}

function sendLimitMsg(messageId: any) {
  const errorMsg = `_ERROR: Sorry, we can't show more than ${rLimit} threads for one option. Please change your subreddit or option. 
Use /help for instructions._`;
  console.error(errorMsg);
  return bot.api.sendMessage(messageId, errorMsg, { parse_mode: parse });
}

function selfTextLimitExceeded(messageId: any) {
  const errorMsg = `......\n\n<i>ERROR: Sorry, The content of this thread has exceeded the limit. Please click on Comments button to view the full thread or Next button to try and load the next thread....</i>`;
  console.error(errorMsg);
  return errorMsg;
}

function noMorePosts(messageId: any) {
  const errorMsg = `<i>ERROR: No more threads. Use /help for instructions</i>`;
  console.error(errorMsg);
  return bot.api.sendMessage(messageId, errorMsg, { parse_mode: parse });
}

/*function sendPlsWait(messageId) {
    const message = `Please wait...`;
    return bot.api.sendMessage(messageId, message);
}*/

async function sendImagePost(messageId: string, redditPost: { url: any; created_utc: number; score: number; upvote_ratio: number; title: any; num_comments: any; author: any; subreddit: string; over_18: boolean; }, markup: any) {
  const parse = "HTML";
  let url = redditPost.url;
  url = url.replace(/&amp;/g, "&");
  //post time
  var timeago = prettytime(redditPost.created_utc * 1000 - Date.now(), {
    short: true,
    decimals: 0
  });
  timeago = timeago.replace(/\s/g, "");

  var { tld, domain, sub } = parser(redditPost.url);
  //.*([^\.]+)(com|net|org|info|coop|int|co\.uk|org\.uk|ac\.uk|uk|)$
  var websitename = domain.split(".");
  if (websitename[0] === "redd")
    let site = `${websitename[0]}${websitename[1]}`;
  else site = websitename[0].toString();

  if (redditPost.score >= 1000)
    let points = (redditPost.score / 1000).toFixed(1) + "k";
  else points = redditPost.score.toString();

  var upvote_ratio = (redditPost.upvote_ratio * 100).toFixed(0);

  var caption = `🔖 <a href="${url}">${redditPost.title}</a> <b>(${site})</b>\n
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;

  console.info("Request completed: image/gif thread");
  //nsfw indicator
  if (redditPost.over_18 === true) {
    console.log("no nsfw!"); try {
      return bot.api.sendMessage(
        messageId,
        "<i>ERROR: Sorry, In accordance with Telegram's Terms of Service you will not be able to browse NSFW posts anymore.\nIf you have subscribed to this sub, please unsubscribe by sending</i> <code>/unsub " + redditPost.subreddit + "</code>",
        { parse_mode: parse }
      );
    } catch (err) {
      if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
        console.info(`user ${messageId}'s subscriptions were cleared`);
        return client.del(messageId);
      }
    }
  } //caption = "🔞" + caption;
  else if (redditPost.over_18) caption = "🔞" + caption;

  var postNum = -1;
  //console.info("about to send the post to telegram")
  //~~fix for memes topy not working, sendMessage with url instead of sendPhoto which was crashing because of a 8.7mb image in "memes topy"~~ reverted back to sendPhoto for some layout refresh.
  //return bot.api.sendMessage(messageId, caption, { parse_mode: parse, markup })
  try {
    return bot.api.sendPhoto(messageId, url, { caption, parse_mode: parse, reply_markup: markup });
  } catch (err_1) {
    if (err_1.description?.includes("bot was") || err_1.description?.includes("user is deactivated") || err_1.description?.includes("chat not found")) {
      console.info(`user ${messageId}'s subscriptions were cleared`);
      return client.del(messageId);
    }
  }
  /*.catch(err => {
    userId = `id_${messageId}`;
    postNum = postNum + 1;
    subreddit = redditPost.subreddit;
    //option = db[`id_${messageId}`].option;
    console.log("subreddit =" +subreddit + "postnum = "+postNum)
  if (db[userId] === undefined) {
      //bot.api.answerCallbackQuery(msg.id);
      return bot.api.sendMessage(
        messageId,
        "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
        { parse_mode: parse }
      );
    } else if (db[userId].hasOwnProperty("subreddit")) {
      subreddit = db[userId]["subreddit"];
    } else {
      return bot.api.sendMessage(
        messageId,
        "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
        { parse_mode: parse }
      );
    }
  //postNum = 1
  console.error("Failed to Load. Loading next post...")
  userId = `id_${messageId}`;
  if (db[userId].hasOwnProperty("postNum")) {
    postNum = db[userId]["postNum"];
    postNum= postNum + 1;
  }
  db[userId]["postNum"] = postNum;
  if (db[userId]["option"]) {
    option = db[userId]["option"];
  } else {
    //default sort = hot
    option = "hot";
  }

  updateUser(messageId, subreddit, option, postNum+1);
  sendRedditPost(messageId, subreddit, option, postNum+1);
});*/
  // prev code line was return bot.api.sendPhoto(messageId, url, {caption, markup});
}

function sendLinkPost(messageId: string, redditPost: { subreddit: string; id: any; url: any; created_utc: number; score: number; upvote_ratio: number; title: any; num_comments: any; author: any; over_18: boolean; }, markup: any) {
  var bestComment: any;
  if (redditPost.subreddit == "explainlikeimfive") {
    const url = `https:\/\/www.reddit.com\/r\/${redditPost.subreddit}\/comments\/${redditPost.id}.json?`
    const sendBestComment = async (url: string) => {
      try {
        const response = await fetch(url);
        const body = await response.json();
        if (body.hasOwnProperty("error") || body[1].data.children[0].length < 1) {
          return sendErrorMsg(messageId, redditPost.subreddit);
        }
        if (body[1].data.children[0].data.stickied === true)
          bestComment = body[1].data.children[1].data.body; //skip stickied comment
        else bestComment = body[1].data.children[0].data.body;

      }
      catch (error) {
        console.log(error);
      }
    }
    sendBestComment(url)
  }

  //CLEAN THIS UP
  if (redditPost.subreddit == "explainlikeimfive") {
    sleep(2500).then(() => {
      console.log(bestComment)
      const parse_mode: parse = "HTML";
      let url = redditPost.url;
      url = url.replace(/&amp;/g, "&");
      //post time
      var timeago = prettytime(redditPost.created_utc * 1000 - Date.now(), {
        short: true,
        decimals: 0
      });
      timeago = timeago.replace(/\s/g, "");

      var { tld, domain, sub } = parse_mode: parser(redditPost.url);
      //.*([^\.]+)(com|net|org|info|coop|int|co\.uk|org\.uk|ac\.uk|uk|)$
      var websitename = domain.split(".");

      if (redditPost.score >= 1000)
        var points = (redditPost.score / 1000).toFixed(1) + "k";
      else var points = redditPost.score;

      var upvote_ratio = (redditPost.upvote_ratio * 100).toFixed(0);
      if (redditPost.subreddit == "explainlikeimfive") {
        var message = `🔖 <a href="${url}">${redditPost.title}</a> <b>(${websitename[0]
          })</b>\n\n⭐️<i>Best Answer:</i> \n${bestComment}\n
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
      }
      else {
        var message = `🔖 <a href="${url}">${redditPost.title}</a> <b>(${websitename[0]
          })</b>\n
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
      }
      //<a href="${url}">[Link]</a>
      console.info("Request completed: link thread");
      //console.info("link post failing ... "+messageId+" "+message+ " "+ parse_mode: parse + " "+ reply_markup: markup)
      //nsfw indicator
      if (redditPost.over_18 === true) message = "🔞" + message;
      var postNum = -1;
      bot.api.sendMessage(messageId, message, { parse_mode: parse, reply_markup: markup }).catch((err: { description: string | string[]; }) => {
        if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
          console.info(`user ${messageId}'s subscriptions were cleared`)
          return client.del(messageId)
        }
        userId = `id_${messageId}`;
        postNum = postNum + 1;
        const subreddit = redditPost.subreddit;
        //option = db[`id_${messageId}`].option;
        console.log("subreddit =" + subreddit + "postnum = " + postNum)
        if (db[userId] === undefined) {
          //bot.api.answerCallbackQuery(msg.id);
          return bot.api.sendMessage(
            messageId,
            "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
            { parse_mode: parse }
          );
        } else if (db[userId].hasOwnProperty("subreddit")) {
          const subreddit = db[userId]["subreddit"];
        } else {
          return bot.api.sendMessage(
            messageId,
            "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
            { parse_mode: parse }
          );
        }
        //postNum = 1
        console.error("Failed to Load. Loading next post...")
        userId = `id_${messageId}`;
        if (db[userId].hasOwnProperty("postNum")) {
          postNum = db[userId]["postNum"];
          postNum = postNum + 1;
        }
        db[userId]["postNum"] = postNum;
        if (db[userId]["option"]) {
          const option = db[userId]["option"];
        } else {
          //default sort = hot
          const option = "hot";
        }

        updateUser(messageId, subreddit, option, postNum + 2);
        sendRedditPost(messageId, subreddit, option, postNum + 2);
      });
      //*/
    });
  }
  else {
    const parse = "HTML";
    let url = redditPost.url;
    url = url.replace(/&amp;/g, "&");
    //post time
    var timeago = prettytime(redditPost.created_utc * 1000 - Date.now(), {
      short: true,
      decimals: 0
    });
    timeago = timeago.replace(/\s/g, "");

    var { tld, domain, sub } = parse_mode: parser(redditPost.url);
    //.*([^\.]+)(com|net|org|info|coop|int|co\.uk|org\.uk|ac\.uk|uk|)$
    var websitename = domain.split(".");

    if (redditPost.score >= 1000)
      var points = (redditPost.score / 1000).toFixed(1) + "k";
    else var points = redditPost.score;

    var upvote_ratio = (redditPost.upvote_ratio * 100).toFixed(0);
    if (redditPost.subreddit == "explainlikeimfive") {
      var message = `🔖 <a href="${url}">${redditPost.title}</a> <b>(${websitename[0]
        })</b>\n\n⭐️<i>Best Answer:</i> \n${bestComment}\n
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
    }
    else {
      var message = `🔖 <a href="${url}">${redditPost.title}</a> <b>(${websitename[0]
        })</b>\n
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
    }
    //<a href="${url}">[Link]</a>
    console.info("Request completed: link thread");
    //console.info("link post failing ... "+messageId+" "+message+ " "+ parse_mode: parse + " "+ markup)
    //nsfw indicator
    if (redditPost.over_18 === true && messageId != "15024063")
      /* { console.log("no nsfw!"); return bot.api.sendMessage(
        messageId,
        "<i>ERROR: Sorry, In accordance with Telegram's Terms of Service you will not be able to browse NSFW posts anymore.\nIf you have subscribed to this sub, please unsubscribe by sending</i> <code>/unsub " + redditPost.subreddit + "</code>\n<i>Apologies for the inconvenience.</i>",
        { parse_mode: parse }
      );; }*/
      message = "🔞" + message;
    //else if (redditPost.over_18 === true && messageId == "15024063") message = "🔞" + message;

    var postNum = -1;
    bot.api.sendMessage(messageId, message, { parse_mode: parse, reply_markup: markup }).catch((err: { description: string | string[]; }) => {
      if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
        console.info(`user ${messageId}'s subscriptions were cleared`)
        return client.del(messageId)
      }
      userId = `id_${messageId}`;
      postNum = postNum + 1;
      const subreddit = redditPost.subreddit;
      //option = db[`id_${messageId}`].option;
      console.log("subreddit =" + subreddit + "postnum = " + postNum)
      if (db[userId] === undefined) {
        //bot.api.answerCallbackQuery(msg.id);
        return bot.api.sendMessage(
          messageId,
          "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
          { parse_mode: parse }
        );
      } else if (db[userId].hasOwnProperty("subreddit")) {
        const subreddit = db[userId]["subreddit"];
      } else {
        return bot.api.sendMessage(
          messageId,
          "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
          { parse_mode: parse }
        );
      }
      //postNum = 1
      console.error("Failed to Load. Loading next post...")
      userId = `id_${messageId}`;
      if (db[userId].hasOwnProperty("postNum")) {
        postNum = db[userId]["postNum"];
        postNum = postNum + 1;
      }
      db[userId]["postNum"] = postNum;
      if (db[userId]["option"]) {
        const option = db[userId]["option"];
      } else {
        //default sort = hot
        const option = "hot";
      }

      updateUser(messageId, subreddit, option, postNum + 2);
      sendRedditPost(messageId, subreddit, option, postNum + 2);
    });
  }
}

async function sendGifPost(messageId: string, redditPost: { preview: { images: { variants: { mp4: { resolutions: any; }; }; }[]; }; created_utc: number; score: number; upvote_ratio: number; title: any; num_comments: any; author: any; subreddit: string; over_18: boolean; }, markup: any) {
  //let url = redditPost.url;
  //url = url.replace(/&amp;/g, '&');
  const parse = "HTML";
  let gifArr = redditPost.preview.images[0].variants.mp4.resolutions;
  let gif = gifArr[gifArr.length - 1].url;
  gif = gif.replace(/&amp;/g, "&");
  //post time
  var timeago = prettytime(redditPost.created_utc * 1000 - Date.now(), {
    short: true,
    decimals: 0
  });

  if (redditPost.score >= 1000)
    var points = (redditPost.score / 1000).toFixed(1) + "k";
  else var points = redditPost.score;

  var upvote_ratio = (redditPost.upvote_ratio * 100).toFixed(0);

  timeago = timeago.replace(/\s/g, "");
  var caption = `🔖 <b>${redditPost.title}</b>\n
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
  console.info("Request completed: gif thread");
  //nsfw indicator
  if (redditPost.over_18 === true && (messageId != "15024063" || messageId != "576693302")) {
    console.log("no nsfw!"); try {
      return bot.api.sendMessage(
        messageId,
        "<i>ERROR: Sorry, in accordance with Telegram Terms of Service you will not be able to browse NSFW posts anymore.\nIf you have subscribed to this sub, please unsubscribe by sending</i> <code>/unsub " + redditPost.subreddit + "</code>\n <i>Apologies for the inconvenience.</i>",
        { parse_mode: parse }
      );
    } catch (err) {
      if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
        console.info(`user ${messageId}'s subscriptions were cleared`);
        return client.del(messageId);
      }
    }
  } //message = "🔞" + message;
  else if (redditPost.over_18 === true && (messageId == "15024063" || messageId == "576693302")) caption = "🔞" + caption;

  try {
    return bot.api.sendVideo(messageId, gif, { parse_mode: parse, caption, reply_markup: markup });
  } catch (err_1) {
    if (err_1.description?.includes("bot was") || err_1.description?.includes("user is deactivated") || err_1.description?.includes("chat not found")) {
      console.info(`user ${messageId}'s subscriptions were cleared`);
      return client.del(messageId);
    }
  }
}

async function sendAnimPost(messageId: string, redditPost: { domain: string; media: { reddit_video: { fallback_url: any; }; }; url: string; url_overridden_by_dest: any; preview: { reddit_video_preview: { fallback_url: any; }; }; created_utc: number; score: number; upvote_ratio: number; title: any; num_comments: any; author: any; subreddit: string; over_18: boolean; }, markup: any) {
  //let url = redditPost.url;
  //url = url.replace(/&amp;/g, '&');
  const parse_mode: parse = "HTML";
  //let gifArr = redditPost.preview.images[0].variants.mp4.resolutions;
  //if(redditPost.domain == "gfycat.com")
  var gif: any;
  if (redditPost.domain == "v.redd.it")
    gif = redditPost.media.reddit_video.fallback_url;
  else if ((/\.(gif)$/.test(redditPost.url) && redditPost.domain == "i.imgur.com"))
    gif = redditPost.url_overridden_by_dest;
  else if (redditPost.domain == "gfycat.com")
    gif = redditPost.preview.reddit_video_preview.fallback_url;
  else
    gif = redditPost.preview.reddit_video_preview.fallback_url || redditPost.url;

  //if(redditPost.domain == "v.redd.it")
  //let gif = redditPost.media.reddit_video.fallback_url;

  //gif = gif.replace(/&amp;/g, "&");
  //post time
  var timeago = prettytime(redditPost.created_utc * 1000 - Date.now(), {
    short: true,
    decimals: 0
  });
  console.log(gif)
  if (redditPost.score >= 1000)
    var points = (redditPost.score / 1000).toFixed(1) + "k";
  else var points = redditPost.score;

  var upvote_ratio = (redditPost.upvote_ratio * 100).toFixed(0);

  timeago = timeago.replace(/\s/g, "");
  var caption = `🔖 <b>${redditPost.title}</b>\n
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
  console.info("Request completed: animgif thread");
  //nsfw indicator
  if (redditPost.over_18 === true && (messageId != "15024063" || messageId != "576693302")) {
    console.log("no nsfw!"); try {
      return bot.api.sendMessage(
        messageId,
        "<i>ERROR: Sorry, In accordance with Telegram's Terms of Service you will not be able to browse NSFW posts anymore.\nIf you have subscribed to this sub, please unsubscribe by sending</i> <code>/unsub " + redditPost.subreddit + "</code>",
        { parse_mode: parse }
      );
    } catch (err) {
      if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
        console.info(`user ${messageId}'s subscriptions were cleared`);
        return client.del(messageId);
      }
    }
  } //caption = "🔞" + caption;
  else if (redditPost.over_18 === true && (messageId == "15024063" || messageId == "576693302")) caption = "🔞" + caption;
  var postNum = -1;
  try {
    return bot.api.sendAnimation(messageId, gif, { parse_mode: parse, caption, reply_markup: markup });
  } catch (err_1) {
    if (err_1.description?.includes("bot was") || err_1.description?.includes("user is deactivated") || err_1.description?.includes("chat not found")) {
      console.info(`user ${messageId}'s subscriptions were cleared`);
      return client.del(messageId);
    }
    userId = `id_${messageId}`;
    postNum = postNum + 1;
    const subreddit = redditPost.subreddit;
    //option = db[`id_${messageId}`].option;
    console.log("subreddit =" + subreddit + "postnum = " + postNum);
    if (db[userId] === undefined) {
      //bot.api.answerCallbackQuery(msg.id);
      return bot.api.sendMessage(
        messageId,
        "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
        { parse_mode: parse }
      );
    } else if (db[userId].hasOwnProperty("subreddit")) {
      const subreddit_1 = db[userId]["subreddit"];
    } else {
      return bot.api.sendMessage(
        messageId,
        "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
        { parse_mode: parse }
      );
    }
    //postNum = 1
    console.error("Failed to Load. Loading next post...");
    userId = `id_${messageId}`;
    if (db[userId].hasOwnProperty("postNum")) {
      postNum = db[userId]["postNum"];
      postNum = postNum + 1;
    }
    db[userId]["postNum"] = postNum;
    if (db[userId]["option"]) {
      const option = db[userId]["option"];
    } else {
      //default sort = hot
      const option_1 = "hot";
    }

    updateUser(messageId, subreddit, option, postNum + 2);
    sendRedditPost(messageId, subreddit, option, postNum + 2);
  }
}

async function sendVideoPost(messageId: string, redditPost: { url: any; created_utc: number; score: number; upvote_ratio: number; title: any; num_comments: any; author: any; subreddit: string; over_18: boolean; }, markup: any) {
  let url = redditPost.url;
  url = url.replace(/&amp;/g, "&");
  const parse_mode: parse = "HTML";
  //let boldtitle = redditPost.title
  //post time
  var timeago = prettytime(redditPost.created_utc * 1000 - Date.now(), {
    short: true,
    decimals: 0
  });
  timeago = timeago.replace(/\s/g, "");
  var { tld, domain, sub } = parse_mode: parser(redditPost.url);
  //.*([^\.]+)(com|net|org|info|coop|int|co\.uk|org\.uk|ac\.uk|uk|)$
  var websitename = domain.split(".");
  if (websitename[0] === "youtu" || websitename[0] === "redd")
    var site = `${websitename[0]}${websitename[1]}`;
  else var site = websitename[0];
  if (redditPost.score >= 1000)
    var points = (redditPost.score / 1000).toFixed(1) + "k";
  else var points = redditPost.score;

  var upvote_ratio = (redditPost.upvote_ratio * 100).toFixed(0);

  var message = `🔖 <a href="${url}">${redditPost.title}</a> <b>(${site})</b>\n
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
  console.info("Request completed: video/gif thread");

  //nsfw indicator
  if (redditPost.over_18 === true && (messageId != "15024063" || messageId != "576693302")) {
    console.log("no nsfw!"); try {
      return bot.api.sendMessage(
        messageId,
        "<i>ERROR: Sorry, In accordance with Telegram's Terms of Service you will not be able to browse NSFW posts anymore.\nIf you have subscribed to this sub, please unsubscribe by sending</i> <code>/unsub " + redditPost.subreddit + "</code>",
        { parse_mode: parse }
      );
    } catch (err) {
      if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
        console.info(`user ${messageId}'s subscriptions were cleared`);
        return client.del(messageId);
      }
    }
  } //message = "🔞" + message;
  else if (redditPost.over_18 === true && (messageId == "15024063" || messageId == "576693302")) message = "🔞" + message;

  var postNum = -1;
  try {
    return bot.api.sendMessage(messageId, message, { parse_mode: parse, reply_markup: markup });
  } catch (err_1) {
    if (err_1.description?.includes("bot was") || err_1.description?.includes("user is deactivated") || err_1.description?.includes("chat not found")) {
      console.info(`user ${messageId}'s subscriptions were cleared`);
      return client.del(messageId);
    }
    userId = `id_${messageId}`;
    postNum = postNum + 1;
    const subreddit = redditPost.subreddit;
    //option = db[`id_${messageId}`].option;
    console.log("subreddit =" + subreddit + "postnum = " + postNum);
    if (db[userId] === undefined) {
      //bot.api.answerCallbackQuery(msg.id);
      return bot.api.sendMessage(
        messageId,
        "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
        { parse_mode: parse }
      );
    } else if (db[userId].hasOwnProperty("subreddit")) {
      const subreddit_1 = db[userId]["subreddit"];
    } else {
      return bot.api.sendMessage(
        messageId,
        "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
        { parse_mode: parse }
      );
    }
    //postNum = 1
    console.error("Failed to Load. Loading next post...");
    userId = `id_${messageId}`;
    if (db[userId].hasOwnProperty("postNum")) {
      postNum = db[userId]["postNum"];
      postNum = postNum + 1;
    }
    db[userId]["postNum"] = postNum;
    if (db[userId]["option"]) {
      const option = db[userId]["option"];
    } else {
      //default sort = hot
      const option_1 = "hot";
    }

    updateUser(messageId, subreddit, option, postNum + 2);
    sendRedditPost(messageId, subreddit, option, postNum + 2);
  }
}

async function sendMessagePost(messageId: any, redditPost: { subreddit: string; id: any; url: any; created_utc: number; selftext: string | any[]; upvote_ratio: number; score: number; title: any; num_comments: any; author: any; over_18: boolean; }, markup: any) {
  // REMOVE THIS CODE
  // Create Log when a message post is created

  /*Log.create({
    subreddit: 'jokes', // hardcoded, change it to acutal subreddit name
    type: 'TEXT', // type of the post
    chatId: 'randomId' // hardcoded
  }).then(doc => {
    console.log('log created', doc);
  })
  */
  //CLEAN THIS UP
  //
  var bestComment: string | any[];
  if (redditPost.subreddit == "explainlikeimfive") {
    const url = `https:\/\/www.reddit.com\/r\/${redditPost.subreddit}\/comments\/${redditPost.id}.json?`
    const sendBestComment = async (url: string) => {
      try {
        const response = await fetch(url);
        const body = await response.json();
        if (body.hasOwnProperty("error") || body[1].data.children[0].length < 1) {
          return sendErrorMsg(messageId, redditPost.subreddit);
        }
        if (body[1].data.children[0].data.stickied === true)
          bestComment = body[1].data.children[1].data.body; //skip stickied comment
        else bestComment = body[1].data.children[0].data.body;
      }
      catch (error) {
        console.log(error);
      }
    }
    sendBestComment(url)
  }
  if (redditPost.subreddit == "explainlikeimfive") {
    sleep(2500).then(async () => {
      //console.log(bestComment) 
      let url = redditPost.url;
      url = url.replace(/&amp;/g, "&");
      //let boldtitle = redditPost.title
      //post time
      var timeago = prettytime(redditPost.created_utc * 1000 - Date.now(), {
        short: true,
        decimals: 0
      });
      timeago = timeago.replace(/\s/g, "");

      //FIX #19 rare cases when subreddits don't exist but still it detects as a textpost
      try {
        var validSub = redditPost.selftext.length;
      } catch (err) {
        console.error("ERROR: " + err);
        return sendErrorMsg(messageId, redditPost.subreddit);
      }
      var upvote_ratio = (redditPost.upvote_ratio * 100).toFixed(0);
      //if selftext exceeds limit
      if (redditPost.selftext.length > 3700) {
        if (redditPost.score >= 1000)
          var points = (redditPost.score / 1000).toFixed(1) + "k";
        else var points = redditPost.score;
        var preview = redditPost.selftext.slice(0, 3500);
        if (redditPost.subreddit == "explainlikeimfive") {
          preview = bestComment.slice(0, 3500);
          if(preview == "undefined") {
            sleep(3000).then(() => {
              preview = bestComment.slice(0, 3500);
            })
          }
          var message = `🔖 <b>${redditPost.title}</b>\n
📝 ${redditPost.selftext}\n\n⭐️<i>Best Answer:</i> \n` + preview + selfTextLimitExceeded(messageId) + `\n 
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
        }
        else {
          var message =
            `🔖 <b>${redditPost.title}</b>\n\n📝` +
            preview +
            selfTextLimitExceeded(messageId) +
            `\n\n⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
        }
        console.info("Request completed: long text thread");
        //nsfw indicator
        if (redditPost.over_18 === true) message = "🔞" + message;
        console.info("Request completed: text thread");
        var postNum = -1;
        try {
          return bot.api.sendMessage(messageId, message_6, { parse_mode: parse, reply_markup: markup });
        } catch (err_1) {
          if (err_1.description?.includes("bot was") || err_1.description?.includes("user is deactivated") || err_1.description?.includes("chat not found")) {
            console.info(`user ${messageId}'s subscriptions were cleared`);
            return client.del(messageId);
          }
          userId = `id_${messageId}`;
          postNum = postNum + 1;
          const subreddit = redditPost.subreddit;
          //option = db[`id_${messageId}`].option;
          console.log("subreddit =" + subreddit + "postnum = " + postNum);
          if (db[userId] === undefined) {
            //bot.api.answerCallbackQuery(msg.id);
            return bot.api.sendMessage(
              messageId,
              "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
              { parse_mode: parse }
            );
          } else if (db[userId].hasOwnProperty("subreddit")) {
            const subreddit_1 = db[userId]["subreddit"];
          } else {
            return bot.api.sendMessage(
              messageId,
              "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
              { parse_mode: parse }
            );
          }
          //postNum = 1
          console.error("Failed to Load. Loading next post...");
          userId = `id_${messageId}`;
          if (db[userId].hasOwnProperty("postNum")) {
            postNum = db[userId]["postNum"];
            postNum = postNum + 1;
          }
          db[userId]["postNum"] = postNum;
          if (db[userId]["option"]) {
            const option = db[userId]["option"];
          } else {
            //default sort = hot
            const option_1 = "hot";
          }

          updateUser(messageId, subreddit, option, postNum + 1);
          sendRedditPost(messageId, subreddit, option, postNum + 1);
        }
      }

      if (redditPost.score >= 1000)
        var points = (redditPost.score / 1000).toFixed(1) + "k";
      else var points = redditPost.score;

      if (redditPost.subreddit == "explainlikeimfive") {
        if(bestComment == "undefined") {
          sleep(3000).then(() => {
            bestComment = bestComment.slice(0, 3500);
          })
        }
        var message = `🔖 <b>${redditPost.title}</b>\n
📝 ${redditPost.selftext}\n\n⭐️<i>Best Answer:</i> \n${bestComment}\n
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
      }

      else {
        var message = `🔖 <b>${redditPost.title}</b>\n
📝 ${redditPost.selftext}\n
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
      }

      //\n\n${url}

      //nsfw indicator
      if (redditPost.over_18 === true) message = "🔞" + message;
      console.info("Request completed: text thread");
      var postNum = -1;
      try {
        return bot.api.sendMessage(messageId, message_6, { parse_mode: parse, reply_markup: markup });
      } catch (err_2) {
        if (err_2.description?.includes("bot was") || err_2.description?.includes("user is deactivated") || err_2.description?.includes("chat not found")) {
          console.info(`user ${messageId}'s subscriptions were cleared`);
          return client.del(messageId);
        }
        userId = `id_${messageId}`;
        postNum = postNum + 1;
        const subreddit_2 = redditPost.subreddit;
        //option = db[`id_${messageId}`].option;
        console.log("subreddit =" + subreddit_2 + "postnum = " + postNum);
        if (db[userId] === undefined) {
          //bot.api.answerCallbackQuery(msg.id);
          return bot.api.sendMessage(
            messageId,
            "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
            { parse_mode: parse }
          );
        } else if (db[userId].hasOwnProperty("subreddit")) {
          const subreddit_3 = db[userId]["subreddit"];
        } else {
          return bot.api.sendMessage(
            messageId,
            "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
            { parse_mode: parse }
          );
        }
        //postNum = 1
        console.error("Failed to Load. Loading next post...");
        userId = `id_${messageId}`;
        if (db[userId].hasOwnProperty("postNum")) {
          postNum = db[userId]["postNum"];
          postNum = postNum + 1;
        }
        db[userId]["postNum"] = postNum;
        if (db[userId]["option"]) {
          const option_2 = db[userId]["option"];
        } else {
          //default sort = hot
          const option_3 = "hot";
        }

        updateUser(messageId, subreddit_2, option, postNum + 2);
        sendRedditPost(messageId, subreddit_2, option, postNum + 2);
      }
    });
  }
  else {
    //console.log(bestComment) 
    let url = redditPost.url;
    url = url.replace(/&amp;/g, "&");
    //let boldtitle = redditPost.title
    //post time
    var timeago = prettytime(redditPost.created_utc * 1000 - Date.now(), {
      short: true,
      decimals: 0
    });
    timeago = timeago.replace(/\s/g, "");

    //FIX #19 rare cases when subreddits don't exist but still it detects as a textpost
    try {
      var validSub = redditPost.selftext.length;
    } catch (err) {
      console.error("ERROR: " + err);
      return sendErrorMsg(messageId, redditPost.subreddit);
    }
    var upvote_ratio = (redditPost.upvote_ratio * 100).toFixed(0);
    //if selftext exceeds limit
    if (redditPost.selftext.length > 3700) {
      if (redditPost.score >= 1000)
        var points = (redditPost.score / 1000).toFixed(1) + "k";
      else var points = redditPost.score;
      const preview = redditPost.selftext.slice(0, 3500);
      if (redditPost.subreddit == "explainlikeimfive") {
        const preview = bestComment.slice(0, 3500);
        var message = `🔖 <b>${redditPost.title}</b>\n
📝 ${redditPost.selftext}\n\n⭐️<i>Best Answer:</i> \n` + preview + selfTextLimitExceeded(messageId) + `\n 
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
      }
      else {
        var message =
          `🔖 <b>${redditPost.title}</b>\n\n📝` +
          preview +
          selfTextLimitExceeded(messageId) +
          `\n\n⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
      }
      console.info("Request completed: long text thread");
      //nsfw indicator
      if (redditPost.over_18 === true) message = "🔞" + message;
      console.info("Request completed: text thread");
      var postNum = -1;
      try {
        return bot.api.sendMessage(messageId, message_10, { parse_mode: parse, reply_markup: markup });
      } catch (err_4) {
        if (err_4.description?.includes("bot was") || err_4.description?.includes("user is deactivated") || err_4.description?.includes("chat not found")) {
          console.info(`user ${messageId}'s subscriptions were cleared`);
          return client.del(messageId);
        }
        userId = `id_${messageId}`;
        postNum_3 = postNum_3 + 1;
        const subreddit_4 = redditPost.subreddit;
        //option = db[`id_${messageId}`].option;
        console.log("subreddit =" + subreddit_4 + "postnum = " + postNum_3);
        if (db[userId] === undefined) {
          //bot.api.answerCallbackQuery(msg.id);
          return bot.api.sendMessage(
            messageId,
            "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
            { parse_mode: parse }
          );
        } else if (db[userId].hasOwnProperty("subreddit")) {
          const subreddit_5 = db[userId]["subreddit"];
        } else {
          return bot.api.sendMessage(
            messageId,
            "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
            { parse_mode: parse }
          );
        }
        //postNum = 1
        console.error("Failed to Load. Loading next post...");
        userId = `id_${messageId}`;
        if (db[userId].hasOwnProperty("postNum")) {
          postNum_3 = db[userId]["postNum"];
          postNum_3 = postNum_3 + 1;
        }
        db[userId]["postNum"] = postNum_3;
        if (db[userId]["option"]) {
          const option_4 = db[userId]["option"];
        } else {
          //default sort = hot
          const option_5 = "hot";
        }

        updateUser(messageId, subreddit_4, option, postNum_3 + 2);
        sendRedditPost(messageId, subreddit_4, option, postNum_3 + 2);
      }
    }

    if (redditPost.score >= 1000)
      var points = (redditPost.score / 1000).toFixed(1) + "k";
    else var points = redditPost.score;

    if (redditPost.subreddit == "explainlikeimfive") {
      var message = `🔖 <b>${redditPost.title}</b>\n
📝 ${redditPost.selftext}\n\n⭐️<i>Best Answer:</i> \n${bestComment}\n
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
    }

    else {
      var message = `🔖 <b>${redditPost.title}</b>\n
📝 ${redditPost.selftext}\n
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;
    }

    //\n\n${url}

    //nsfw indicator
    if (redditPost.over_18 === true) message = "🔞" + message;
    console.info("Request completed: text thread");
    var postNum = -1;
    try {
      return bot.api.sendMessage(messageId, message_10, { parse_mode: parse, reply_markup: markup });
    } catch (err_5) {
      if (err_5.description?.includes("bot was") || err_5.description?.includes("user is deactivated") || err_5.description?.includes("chat not found")) {
        console.info(`user ${messageId}'s subscriptions were cleared`);
        return client.del(messageId);
      }
      userId = `id_${messageId}`;
      postNum_3 = postNum_3 + 1;
      const subreddit_6 = redditPost.subreddit;
      //option = db[`id_${messageId}`].option;
      console.log("subreddit =" + subreddit_6 + "postnum = " + postNum_3);
      if (db[userId] === undefined) {
        //bot.api.answerCallbackQuery(msg.id);
        return bot.api.sendMessage(
          messageId,
          "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
          { parse_mode: parse }
        );
      } else if (db[userId].hasOwnProperty("subreddit")) {
        const subreddit_7 = db[userId]["subreddit"];
      } else {
        return bot.api.sendMessage(
          messageId,
          "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
          { parse_mode: parse }
        );
      }
      //postNum = 1
      console.error("Failed to Load. Loading next post...");
      userId = `id_${messageId}`;
      if (db[userId].hasOwnProperty("postNum")) {
        postNum_3 = db[userId]["postNum"];
        postNum_3 = postNum_3 + 1;
      }
      db[userId]["postNum"] = postNum_3;
      if (db[userId]["option"]) {
        const option_6 = db[userId]["option"];
      } else {
        //default sort = hot
        const option_7 = "hot";
      }

      updateUser(messageId, subreddit_6, option, postNum_3 + 2);
      sendRedditPost(messageId, subreddit_6, option, postNum_3 + 2);
    }
  }
}

/*bot.api.start(ctx => {
    ctx.reply(
      "test"
    )
  })
*/

bot.on("message", (ctx) => {
  const parse_mode: parse = "Markdown";
  //emoji mode
  if (
    ctx.message.text === "😂" ||
    ctx.message.text === "😀" ||
    ctx.message.text === "😃" ||
    ctx.message.text === "😄" ||
    ctx.message.text === "😁" ||
    ctx.message.text === "😆" ||
    ctx.message.text === "😅" ||
    ctx.message.text === "🤣"
  )
    ctx.message.text = "/memes+jokes+funny+humor+programmerhumor+dadjokes+punny+cursedcomments";

  if (ctx.message.text === "🧐" || ctx.message.text === "👀" || ctx.message.text === "👁")
    ctx.message.text =
      "/pics+gifs+videos+educationalgifs+wholesomegifs+reactiongifs+perfectloops+photoshopbattles+historyporn+spaceporn+earthporn+comics";
  if (ctx.message.text === "🚿") ctx.message.text = "/showerthoughts";
  if (ctx.message.text === "😍")
    ctx.message.text = "/aww+cats+dogs+animalsbeingderps+animalsbeingjerks";
  if (ctx.message.text === "🐈") ctx.message.text = "/cats";
  if (ctx.message.text === "🦮") ctx.message.text = "/dogs";
  if (ctx.message.text === "🎬") ctx.message.text = "/movies+television+anime";
  if (ctx.message.text === "🦠") ctx.message.text = "/coronavirus";
  if (ctx.message.text === "🤔")
    ctx.message.text =
      "/todayilearned+explainlikeimfive+youshouldknow+outoftheloop+wikipedia+howto+iwanttolearn+learnuselesstalents+diy";
  if (
    ctx.message.text === "😳" ||
    ctx.message.text === "😱" ||
    ctx.message.text === "😨" ||
    ctx.message.text === "😰" ||
    ctx.message.text === "🤯"
  )
    ctx.message.text =
      "/interestingasfuck+mildlyinteresting+woahdude+damnthatsinteresting+beamazed+thatsinsane+unexpected";
  if (ctx.message.text.includes("👌"))
    ctx.message.text =
      "/internetisbeautiful+dataisbeautiful+art+animation+artporn+pixelart+oddlysatisfying+cityporn+designporn";
  if (ctx.message.text === "😋" || ctx.message.text === "🤤")
    ctx.message.text = "/food+foodporn+seriouseats+recipes+veganrecipes+pizza";
  if (ctx.message.text === "🥱" || ctx.message.text === "😴") ctx.message.text = "/nosleep";
  if (ctx.message.text === "😎") ctx.message.text = "/random";
  if (
    ctx.message.text.includes("🤦‍") ||
    ctx.message.text.includes("🤦") ||
    ctx.message.text.includes("🤦")
  )
    ctx.message.text = "/indianpeoplefacebook+facepalm";
  if (ctx.message.text.includes("💪"))
    ctx.message.text =
      "/productivity+happy+getmotivated+selfimprovement+quotesporn+fitness";
  //~~middle finger emoji~~ TOS violation - hence removed

  if ((ctx.msg.chat.id == "15024063" || ctx.msg.chat.id == "576693302") && (ctx.message.text.includes("🖕") || ctx.message.text === "🍑"))
    ctx.message.text =
      "/nsfw+gonewild+nsfw_gifs+celebnsfw+nsfw_gif+sexygirls+toocuteforporn+justhotwomen+sexybutnotporn";

  if (ctx.message.text === "💩")
    ctx.message.text =
      "/shittylifeprotips+shittyfoodporn+shittyreactiongifs+crappydesign+shittymoviedetails+shitpost";
  //start/help menu
  if (
    ctx.message.text === "/start" ||
    ctx.message.text === "/help" ||
    ctx.message.text === "/help@RedditBrowserBot" ||
    ctx.message.text === "/start@RedditBrowserBot"
  ) {
    skips = 0;
    const message = helpMessage;
    console.info("User(" + ctx.from.id + ") : " + ctx.message.text);
    const markup = new InlineKeyboard()
      .text("💫 Features", "callback_query_helpfeatures"
    );
    // bot.api.inlineButton("💫 Features", { callback: "callback_query_helpfeatures" }),

    //       bot.api.inlineButton("📢 Subscriptions", { callback: "callback_query_helpsubs" }),

    //       bot.api.inlineButton("*️⃣ Default Subs", { callback: "callback_query_inbuiltsubs" })

    //       bot.api.inlineButton("💣 Popular Subs", { callback: "callback_query_listsubs" }),

    //       bot.api.inlineButton("😎 Emoji Mode", { callback: "callback_query_emojimode" }),

    //       bot.api.inlineButton("Ⓜ️ Multi Mode", { callback: "callback_query_multimode" })


    //       bot.api.inlineButton("⬇️ Import Subreddits", { callback: "callback_query_importsubs" }),

    //       bot.api.inlineButton("🤔 FAQs", { callback: "callback_query_faq" })

    // );
    return bot.api.sendMessage(ctx.msg.chat.id, message, { parse_mode: parse, reply_markup: markup });
  }
  /* OLD start/help menu
  if (
    ctx.message.text === "/start" ||
    ctx.message.text === "/help" ||
    ctx.message.text === "/help@RedditBrowserBot" ||
    ctx.message.text === "/start@RedditBrowserBot"
  ) {
    skips = 0;
    const message = helpMessage;
    console.info("User(" + msg.from.username + "): " + ctx.message.text);
    return bot.api.sendMessage(ctx.msg.chat.id, message, { parse_mode: parse });
  }*/

  //list of popular subreddits
  else if (ctx.message.text === "/list" || ctx.message.text === "/list@RedditBrowserBot") {
    skips = 0;
    const message = listSubs;
    console.info("User(" + ctx.from.id + ") : " + ctx.message.text);
    return bot.api.sendMessage(ctx.msg.chat.id, message, { parse_mode: parse });
  }
  //emoji mode
  else if (ctx.message.text === "/emoji" || ctx.message.text === "/emoji@RedditBrowserBot") {
    skips = 0;
    const message = emojiMode;
    console.info("User(" + ctx.from.id + ") : " + ctx.message.text);
    return bot.api.sendMessage(ctx.msg.chat.id, message, { parse_mode: parse });
  }
  //options
  else if (
    ctx.message.text === "/options" ||
    ctx.message.text === "/options@RedditBrowserBot"
  ) {
    skips = 0;
    const message = sortOptions;
    console.info("User(" + ctx.from.id + ") : " + ctx.message.text);
    return bot.api.sendMessage(ctx.msg.chat.id, message, { parse_mode: parse });
  }
  else if (
    ctx.message.text === "/contact" ||
    ctx.message.text === "/contact@RedditBrowserBot"
  ) {
    const markup = bot.api.inlineKeyboard([
      [
        bot.api.inlineButton("Join the Official Reddgram group", {
          url: "https://t.me/reddgramissues"
        })
      ],
      [
        bot.api.inlineButton("Projects Channel", {
          url: "https://t.me/ssjprojects"
        }),

        bot.api.inlineButton("Donate", {
          url: "https://paypal.me/suhasa010"
        })
      ]
    ]);
    skips = 0;
    const message = contactDev;
    console.info("User(" + ctx.from.id + ") : " + ctx.message.text);
    return bot.api.sendMessage(ctx.msg.chat.id, message, { parse_mode: parse, reply_markup: markup });
  }
  else if (
    ctx.message.text === "/multi" ||
    ctx.message.text === "/multi@RedditBrowserBot"
  ) {
    skips = 0;
    const message = multiMode;
    console.info("User: " + ctx.message.text);
    return bot.api.sendMessage(ctx.msg.chat.id, message, { parse_mode: parse });
  }
  else if (
    ctx.message.text === "/helpsubs" ||
    ctx.message.text === "/helpsubs@RedditBrowserBot"
  ) {
    skips = 0;
    const message = subscriptions;
    console.info("User: " + ctx.message.text);
    return bot.api.sendMessage(ctx.msg.chat.id, message, { parse_mode: parse });
  }
  else if (
    ctx.message.text === "/import" ||
    ctx.message.text === "/import@RedditBrowserBot"
  ) {
    console.info("User(" + ctx.from.id + ") : " + ctx.message.text);
    return bot.api.sendMessage(ctx.msg.chat.id, importSubs, { parse_mode: parse });
  }
  else if (/\/sub[scribe]*[@RedditBrowserBot]* [a-zA-Z0-9+_]*$/.test(ctx.message.text) || /\/import[ ]+[https://old.reddit.com/r/]+[a-zA-Z0-9_\-+\/]*$/.test(ctx.message.text)) {
    if (/\/import[ ]+[https://old.reddit.com/r/]+[a-zA-Z0-9_\-+\/]*$/.test(ctx.message.text)) {
      var subreddit = ctx.message.text.slice(33, ctx.message.text.length);
      console.info("User(" + ctx.from.id + ") : " + ctx.message.text);
      //console.log(subreddit)
      bot.api.sendMessage(ctx.msg.chat.id, "Successfully imported subreddits from Reddit 🥳\nIn a few seconds you should be able to see those here - /subscriptions")
    }
    else {
      const parse_mode: parse = "Markdown";
      //if (ctx.message.text.includes("/")) {
      console.info("User(" + ctx.from.id + ") : " + ctx.message.text);
      ctx.message.text = ctx.message.text.slice(1, ctx.message.text.length);
      //console.log("after slice: " + ctx.message.text)
      //}
      var [subscribe, subreddit, option] = ctx.message.text.toLowerCase().split(" ");
      //console.log("sub = " + subreddit)
    }
    const options = getOptions(option, rLimit);
    request(
      { url: `http://www.reddit.com/r/${subreddit}/${options}`, json: true },
      function (error: any, response: { statusCode: number; }, body: { hasOwnProperty: (arg0: string) => any; data: { children: string | any[]; }; }) {
        if (!error && response.statusCode === 200) {
          if (body.hasOwnProperty("error") || body.data.children.length < 1) {
            console.error("INVALID SUB: User(" + ctx.from.id + ") : " + ctx.message.text);
            return sendErrorMsg(ctx.msg.chat.id, subreddit);
          }
          else {
            client.get(ctx.msg.chat.id, function (err: any, res: string | string[]) {
              res += '+'
              if (res.includes(subreddit)) {
                console.info("ALREADY SUBBED: User(" + ctx.from.id + ") : " + ctx.message.text);
                return bot.api.sendMessage(ctx.msg.chat.id, `_Duh! You are already subscribed to r‏/${subreddit} 😏\nCheck_ /subscriptions _maybe?_`, { parse_mode: parse })
              }
              else {
                console.info("SUCCESSFULLY SUBBED: User(" + ctx.from.id + ") : " + ctx.message.text);
                client.APPEND(ctx.msg.chat.id, `${subreddit}+`, function (err: any, res: any) {
                  return bot.api.sendMessage(ctx.msg.chat.id, `_Yay! Successfully subscribed to r‏/${subreddit} 🥳\nSee it here -_ /subscriptions`, { parse_mode: parse })
                });
              }
            }
            );
          }
          //else if (body.data.children.length - 1 < postNum) {
          //return noMorePosts(messageId);
          //}
        }
        else {
          return sendErrorMsg(ctx.msg.chat.id, subreddit);
        }
      });
  }
  else if (ctx.message.text.includes('/subscriptions')) {
    const parse_mode: parse = "Markdown";
    console.info("User(" + ctx.from.id + ") : " + ctx.message.text);
    if (ctx.message.text.includes("/")) {
      ctx.message.text = ctx.message.text.slice(1, ctx.message.text.length);
    }
    //userId = ctx.from.id;
    client.get(ctx.msg.chat.id, function (err: any, res: string) {
      if (!res) {
        console.error("NO SUBS: User(" + ctx.from.id + ") : " + ctx.message.text);
        return bot.api.sendMessage(ctx.msg.chat.id, noSubs, { parse_mode: parse })
      }
      else if (res) {
        var subs = res.toLowerCase().split("+");
        //console.log(subs);
        var subscriptions = `<b>Your subscriptions 📢</b>\n\n`;
        var i: any, num = -1;
        const parse_mode: parse = "html";
        subs.forEach((subs: string) => {
          if (subs !== '') {
            try {
              subscriptions += `r‏/${subs}\n\n`;
            }
            catch (err) {
              console.error("ERROR: " + err)
            }
            //console.info("Subscriptions for User("+ctx.from.id+") : " + subscriptions);
          }
          num++;
        }
        );
        const markup = bot.api.inlineKeyboard([
          [
            bot.api.inlineButton(`🗑 Unsubscribe ${num} sub(s)`, {
              callback: "callback_query_unsuball"
            })
          ],
          [
            bot.api.inlineButton("🔀 Browse all", {
              callback: "callback_query_browsesubs"
            })
          ]
        ]);
        return bot.api.sendMessage(ctx.msg.chat.id, subscriptions, { parse_mode: parse, reply_markup: markup });
      }
    });
  }
  /* else if (ctx.message.text.includes('/subpaginated')) {
     var bookPages = 100;
 
     function getPagination(current, maxpage) {
       var keys = [];
       if (current > 1) keys.push({ text: `«1`, callback_data: '1' });
       if (current > 2) keys.push({ text: `‹${current - 1}`, callback_data: (current - 1).toString() });
       keys.push({ text: `-${current}-`, callback_data: current.toString() });
       if (current < maxpage - 1) keys.push({ text: `${current + 1}›`, callback_data: (current + 1).toString() })
       if (current < maxpage) keys.push({ text: `${maxpage}»`, callback_data: maxpage.toString() });
 
       return {
         reply_markup: JSON.stringify({
           inline_keyboard: [keys]
         })
       };
     }
 
     bot.api.onText(/\/book/, function (msg) {
       bot.api.sendMessage(ctx.msg.chat.id, 'Page: 25', getPagination(25, bookPages));
     });
 
     bot.api.on('callback_query', function (message) {
       var msg = message.message;
       var editOptions = Object.assign({}, getPagination(parse_mode: parseInt(message.data), bookPages), { chat_id: ctx.msg.chat.id, message_id: msg.message_id });
       bot.api.editMessageText('Page: ' + message.data, editOptions);
     });
     const parse_mode: parse = "Markdown";
     console.info("User(" + ctx.from.id + ") : " + ctx.message.text);
     if (ctx.message.text.includes("/")) {
       ctx.message.text = ctx.message.text.slice(1, ctx.message.text.length);
     }
     //userId = ctx.from.id;
     client.get(ctx.msg.chat.id, function (err, res) {
       if (!res) {
         console.error("NO SUBS: User(" + ctx.from.id + ") : " + ctx.message.text);
         return bot.api.sendMessage(ctx.msg.chat.id, noSubs, { parse_mode: parse })
       }
       else if (res) {
         var subs = res.toLowerCase().split("+");
         //console.log(subs);
         var subscriptions = `<b>Your subscriptions 📢</b>\n\n`;
         var i, num = -1;
         const parse_mode: parse = "html";
         subs.forEach((subs) => {
           if (subs !== '') {
             try {
               subscriptions += `r‏/${subs}\n\n`;
             }
             catch (err) {
               console.error("ERROR: " + err)
             }
             //console.info("Subscriptions for User("+ctx.from.id+") : " + subscriptions);
           }
           num++;
         }
         );
         var singleSubs = subscriptions.split("\n\n")
         console.log(singleSubs)
         const markup = bot.api.inlineKeyboard([
           [
             bot.api.inlineButton(`Unsubscribe ${num} sub(s)`, {
               callback: "callback_query_unsuball"
             })
           ],
           [
             bot.api.inlineButton("Browse all", {
               callback: "callback_query_browsesubs"
             })
           ]
         ]);
         return bot.api.sendMessage(ctx.msg.chat.id, subscriptions, { parse_mode: parse, markup });
       }
     });
   }
   */

  else if (/\/unsub[scribe]*[@RedditBrowserBot]* [/a-zA-Z0-9+_]*$/.test(ctx.message.text)) {
    const parse_mode: parse = "Markdown";
    console.info("User(" + ctx.from.id + ") : " + ctx.message.text);
    if (ctx.message.text.includes("/")) {
      ctx.message.text = ctx.message.text.slice(1, ctx.message.text.length);
    }
    var subs: any[];
    var [unsubscribe, subreddit, option] = ctx.message.text.toLowerCase().split(" ");

    client.get(ctx.msg.chat.id, function (err: any, res: string) {
      if (res) {
        subs = res.toLowerCase().split("+");
        //console.log(subs);
        var i: number;
        //subs.forEach(subs => 
        {
          //if (subs === subreddit) 
          {
            for (var i = 0; i < subs.length - 1; i++) {
              if (subs[i] == subreddit) {
                subs.splice(i, 1);
                //console.log(subs)
              }
            }
            //console.log("\nafter removing " + subreddit + ", subs are" + subs)
          }
          subs = subs.join("+")
          //console.log("after removing jokes = " + subs)
          if (!(res.includes(subreddit))) {
            console.error("NOT SUBBED: User(" + ctx.from.id + ") : " + ctx.message.text);
            return bot.api.sendMessage(ctx.msg.chat.id, `_ERROR: You aren't subscribed to r‏/${subreddit} 😏\nSee your_ /subscriptions.`, { parse_mode: parse })
          }
          else {
            client.set(ctx.msg.chat.id, subs, function (err: any, res: any) {
              if (err)
                console.error(err)
              else
                return bot.api.sendMessage(ctx.msg.chat.id, `_Successfully unsubscribed from r‏/${subreddit} 👍🏼_`, { parse_mode: parse })
            });
          }
        }
      }
      else if (!res) {
        console.error("ERROR: " + noSubs)
        return bot.api.sendMessage(ctx.msg.chat.id, noSubs, { parse_mode: parse })
      }
    });
  }
  //else if() {

  //}

  //core logic
  else {
    //for groups
    if (ctx.message.text.includes("@RedditBrowserBot")) {
      if (ctx.message.text.includes("/")) {
        ctx.message.text = ctx.message.text.slice(1, ctx.message.text.length);
        console.info("User(" + ctx.from.id + ") : " + ctx.message.text);
        var [subreddit, option] = ctx.message.text.toLowerCase().split("@");
        var [mention, option1] = option.toLowerCase().split(" ");
        var option = option1;
        skips = 0;
        console.info("User(" + ctx.from.id + ") : " + ctx.message.text);

        const userId = `id_${ctx.msg.chat.id}`;
        const messageId = ctx.msg.chat.id;
        //const [subreddit, option] = ctx.message.text.toLowerCase().split(" ");
        const postNum = 0;
        updateUser(userId, subreddit, option, postNum);
        sendRedditPost(messageId, subreddit, option, postNum);
      }
    }
    else {
      //for PMs
      skips = 0;
      //console.info("User("+ctx.from.id+") : " + ctx.message.text);

      if (ctx.message.text.includes("/")) {
        ctx.message.text = ctx.message.text.slice(1, ctx.message.text.length);

        var userId = `id_${ctx.msg.chat.id}`;
        const messageId = ctx.msg.chat.id;
        console.log(ctx.msg.chat.id)
        var postNum = 0;
        var multiLimit = 5;
        // if(ctx.from.id == "15024063")
        //   multiLimit = 100;
        if (/^[a-zA-Z0-9]+ [a-zA-Z]+ [0-9]+/.test(ctx.message.text)) {
          var i: number;

          //multi mode
          const [subreddit, option, numberPosts] = ctx.message.text.toLowerCase().split(" ");
          if (numberPosts <= multiLimit) {
            for (i = 0; i < numberPosts; i++) {
              updateUser(userId, subreddit, option, postNum);
              sendRedditPost(messageId, subreddit, option, postNum);
              const rands = Array(1, 2, 3, 4, 5);
              const rand = rands[Math.floor(Math.random() * rands.length)];
              postNum = postNum + rand;
              console.log(postNum)
            }
          }
          else {
            console.error("ERROR: User(" + ctx.from.id + ") : " + ctx.message.text);
            return bot.api.sendMessage(messageId, `_ERROR: Sorry, I can't show more than ${multiLimit} threads in Multi Mode._`, { parse_mode: parse });
          }
          //var numUserId = userId.replace(/[^0-9]/g,'');
        }
        else {
          //normal browsing
          const [subreddit, option] = ctx.message.text.toLowerCase().split(" ");
          //console.log(userId+subreddit+option+postNum);
          updateUser(userId, subreddit, option, postNum);
          sendRedditPost(messageId, subreddit, option, postNum);
        }
        //console.log("main logic");
        //console.log("message info="+msg)
        //bot.api.sendMessage(messageId,"Multi Mode ON! [Go to Top](https://t.me/c/1155726669/"+msg.message_id+")", {parse_mode: parse})
        //updateUser(userId, subreddit, option, postNum);
        //sendRedditPost(messageId, subreddit, option, postNum);
      }
    }
  }
});

var userId: string;

bot.on("callback_query", async (ctx) => {
  if (msg.data === "callback_query_next") {
    //console.log("test")
    console.log(msg.message.chat)
    if(msg.message.chat.type === "group" || msg.message.chat.type === "supergroup") {
      try{
        //console.log(ctx.from.id)
        // console.log(!(bot.api.getChatMember(msg.message.chat.id,ctx.from.id) in ["creator","administrator"]))
        if (!(bot.api.getChatMember(msg.message.chat.id,ctx.from.id) in ["creator","administrator"])) {
          return bot.api.answerCallbackQuery(msg.id, { text: "ERROR: You need to be an admin to do this.", show_alert: true });
        }
      }
      catch(e) {
        console.log(e)
      }
    }
    const parse_mode: parse = "Markdown";
    userId = `id_${msg.message.chat.id}`;
    const messageId = msg.message.chat.id;
    //console.log(msg.message.chat.id)
    console.info("User(" + ctx.from.id + ") clicked next");
    let subreddit = "",
      option = "";
    let postNum = 0;
    if (db[userId] === undefined) {
      return bot.api.answerCallbackQuery(msg.id, { text: "ERROR: Sorry, please re-submit your previous request.", show_alert: true });
      //return;
      /*return bot.api.sendMessage(
        messageId,
        "_ERROR: Sorry, please re-submit your previous request._",
        { parse_mode: parse }
      );*/
    } else if (db[userId].hasOwnProperty("subreddit")) {
      subreddit = db[userId]["subreddit"];
    } else {
      return bot.api.sendMessage(
        messageId,
        "_ERROR: Sorry, please send the subreddit name with option again_"
      );
    }

    if (db[userId]["option"]) {
      option = db[userId]["option"];
    } else {
      //default sort = hot
      option = "hot";
    }

    if (db[userId].hasOwnProperty("postNum")) {
      postNum = db[userId]["postNum"];
      postNum = postNum + 1;
    }

    db[userId]["postNum"] = postNum;

    if (postNum > rLimit - 1) {
      return sendLimitMsg(messageId);
    }
    //console.info("after clicking next:"+postNum)
    sendRedditPost(messageId, subreddit, option, postNum);
    await bot.api.answerCallbackQuery(msg.id);
  }
});

bot.on("callback_query", async (ctx) => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.api.getChatMember(msg.message.chat.id, ctx.from.id);
    console.log(member)
  }*/
  //console.log("from"+ctx.from.id);
  if (msg.data === "callback_query_unsuball") {
    console.log(userId + " " + ctx.from.id)
    //if (!(/^-[0-9]+$/.test(msg.message.chat.id)) || (member.status == 'administrator')) {
    client.set(msg.message.chat.id, '', function (err: any, res: any) {
      if (err)
        console.error(err)
      else {
        const chatId = msg.message.chat.id;
        const messageId = msg.message.message_id;
        console.info("User(" + ctx.from.id + ") unsubscribed from all subs");
        return bot.api.editMessageText({ chatId, messageId }, "_Successfully unsubscribed from all subscriptions 👻\nTo subscribe again, send_ \`/sub subreddit_name\`", { parse_mode: parseMode: 'Markdown' })
      }
    });
    //}
    //else
    //await bot.api.answerCallbackQuery(msg.id,'You need to be an admin to unsubscribe!')
  }
  await bot.api.answerCallbackQuery(msg.id);
  //}
});

bot.on("callback_query", async (ctx) => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.api.getChatMember(msg.message.chat.id, ctx.from.id);
    console.log(member)
  }*/
  if (msg.data === "callback_query_browsesubs") {
    //console.log("from" + ctx.from.id);
    client.get(ctx.from.id, function (err: any, reply: string) {
      if (reply !== "") {
        const sub = reply;
        //console.log("subreddits: "+sub)
        const option = "hot";
        const userId = `id_${ctx.from.id}`;
        updateUser(userId, sub, option, subPostNum);
        console.info("User(" + ctx.from.id + ") browsing all subs");
        sendRedditPost(ctx.from.id, sub, option, subPostNum)
        //console.log(chat + " " + sub + " " + option + " ")
      }
    });
    //console.log("postnumber " + subPostNum)
    const rands = Array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    const rand = rands[Math.floor(Math.random() * rands.length)];
    subPostNum = subPostNum + 1;
    await bot.api.answerCallbackQuery(msg.id);
    //}
  }
});

bot.on("callback_query", async (ctx) => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.api.getChatMember(msg.message.chat.id, ctx.from.id);
    console.log(member)
  }*/
  //console.log("from" + ctx.from.id);
  if (msg.data === "callback_query_helpfeatures") {
    const chatId = msg.message.chat.id;
    const messageId = msg.message.message_id;
    const message = featureList;
    const markup = bot.api.inlineKeyboard([
      [
        bot.api.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    console.info("User(" + ctx.from.id + ") saw Features");
    return bot.api.editMessageText({ chatId, messageId }, message, { parse_mode: parseMode: 'Markdown', reply_markup: markup })
  }
  await bot.api.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async (ctx) => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.api.getChatMember(msg.message.chat.id, ctx.from.id);
    console.log(member)
  }*/
  //console.log("from" + ctx.from.id);
  if (msg.data === "callback_query_inbuiltsubs") {
    const chatId = msg.message.chat.id;
    const messageId = msg.message.message_id;
    const message = inbuiltSubs;
    const markup = bot.api.inlineKeyboard([
      [
        bot.api.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    console.info("User(" + ctx.from.id + ") saw Default Subs");
    return bot.api.editMessageText({ chatId, messageId }, message, { parse_mode: parseMode: 'Markdown', reply_markup: markup })
  }
  await bot.api.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async (ctx) => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.api.getChatMember(msg.message.chat.id, ctx.from.id);
    console.log(member)
  }*/
  //console.log("from" + ctx.from.id);
  if (msg.data === "callback_query_listsubs") {
    const chatId = msg.message.chat.id;
    const messageId = msg.message.message_id;
    const message = listSubs;
    const markup = bot.api.inlineKeyboard([
      [
        bot.api.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    console.info("User(" + ctx.from.id + ") saw Popular Subs");
    return bot.api.editMessageText({ chatId, messageId }, message, { parse_mode: parseMode: 'Markdown', reply_markup: markup })
  }
  await bot.api.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async (ctx) => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.api.getChatMember(msg.message.chat.id, ctx.from.id);
    console.log(member)
  }*/
  //console.log("from" + ctx.from.id);
  if (msg.data === "callback_query_emojimode") {
    const chatId = msg.message.chat.id;
    const messageId = msg.message.message_id;
    const message = emojiMode;
    const markup = bot.api.inlineKeyboard([
      [
        bot.api.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    console.info("User(" + ctx.from.id + ") saw Emoji Mode");
    return bot.api.editMessageText({ chatId, messageId }, message, { parse_mode: parseMode: 'Markdown', reply_markup: markup })
  }
  await bot.api.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async (ctx) => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.api.getChatMember(msg.message.chat.id, ctx.from.id);
    console.log(member)
  }*/
  //console.log("from" + ctx.from.id);
  if (msg.data === "callback_query_multimode") {
    const chatId = msg.message.chat.id;
    const messageId = msg.message.message_id;
    const message = multiMode;
    const markup = bot.api.inlineKeyboard([
      [
        bot.api.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    console.info("User(" + ctx.from.id + ") saw Multi Mode");
    return bot.api.editMessageText({ chatId, messageId }, message, { parse_mode: parseMode: 'Markdown', reply_markup: markup })
  }
  await bot.api.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async (ctx) => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.api.getChatMember(msg.message.chat.id, ctx.from.id);
    console.log(member)
  }*/
  //console.log("from" + ctx.from.id);
  if (msg.data === "callback_query_sortoptions") {
    const chatId = msg.message.chat.id;
    const messageId = msg.message.message_id;
    const message = sortOptions;
    const markup = bot.api.inlineKeyboard([
      [
        bot.api.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    console.info("User(" + ctx.from.id + ") saw Sort Options ");
    return bot.api.editMessageText({ chatId, messageId }, message, { parse_mode: parseMode: 'Markdown', reply_markup: markup })
  }
  await bot.api.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async (ctx) => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.api.getChatMember(msg.message.chat.id, ctx.from.id);
    console.log(member)
  }*/
  //console.log("from" + ctx.from.id);
  if (msg.data === "callback_query_helpsubs") {
    const chatId = msg.message.chat.id;
    const messageId = msg.message.message_id;
    const message = subscriptions;
    const markup = bot.api.inlineKeyboard([
      [
        bot.api.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    console.info("User(" + ctx.from.id + ") saw Subscriptions help");
    return bot.api.editMessageText({ chatId, messageId }, message, { parse_mode: parseMode: 'Markdown', reply_markup: markup })
  }
  await bot.api.answerCallbackQuery(msg.id);
});

bot.api.on("callback_query", async (ctx) => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.api.getChatMember(msg.message.chat.id, ctx.from.id);
    console.log(member)
  }*/
  //console.log("from" + ctx.from.id);
  if (msg.data === "callback_query_importsubs") {
    const chatId = msg.message.chat.id;
    const messageId = msg.message.message_id;
    const message = importSubs;
    const markup = bot.api.inlineKeyboard([
      [
        bot.api.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    console.info("User(" + ctx.from.id + ") saw Import Subreddits");
    return bot.api.editMessageText({ chatId, messageId }, message, { parse_mode: parseMode: 'Markdown', reply_markup: markup })
  }
  await bot.api.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async (ctx) => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.api.getChatMember(msg.message.chat.id, ctx.from.id);
    console.log(member)
  }*/
  //console.log("from" + ctx.from.id);
  if (msg.data === "callback_query_faq") {
    const chatId = msg.message.chat.id;
    const messageId = msg.message.message_id;
    const message = faq;
    const markup = bot.api.inlineKeyboard([
      [
        bot.api.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    console.info("User(" + ctx.from.id + ") saw FAQs");
    return bot.api.editMessageText({ chatId, messageId }, message, { parse_mode: parseMode: 'HTML', reply_markup: markup, webPreview: false })
  }
  await bot.api.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async (ctx) => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.api.getChatMember(msg.message.chat.id, ctx.from.id);
    console.log(member)
  }*/
  //console.log("from" + ctx.from.id);
  if (ctx.msg.data === "callback_query_back") {
    const chatId = ctx.msg.chat.id;
    const messageId = ctx.msg.message_id;
    const message = helpMessage;
    const markup = bot.api.inlineKeyboard([
      [
        bot.api.inlineButton("💫 Features", { callback: "callback_query_helpfeatures" }),

        bot.api.inlineButton("📢 Subscriptions", { callback: "callback_query_helpsubs" }),

        bot.api.inlineButton("*️⃣ Default Subs", { callback: "callback_query_inbuiltsubs" })
      ],
      [
        bot.api.inlineButton("💣 Popular Subs", { callback: "callback_query_listsubs" }),

        bot.api.inlineButton("😎 Emoji Mode", { callback: "callback_query_emojimode" }),

        bot.api.inlineButton("Ⓜ️ Multi Mode", { callback: "callback_query_multimode" })

      ],
      [
        bot.api.inlineButton("⬇️ Import Subreddits", { callback: "callback_query_importsubs" }),

        bot.api.inlineButton("🤔 FAQs", { callback: "callback_query_faq" })
      ]
    ]);
    return bot.api.editMessageText(chatId, messageId, message, { parse_mode: 'Markdown', reply_markup: markup })
  }
  await bot.api.answerCallbackQuery(msg.id);
});

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


//for posting subscriptions
var subPostNum = 0;
setInterval(function () {
  //var chat;
  client
    .multi()
    .keys("*")
    .exec(function (err: any, replies: any[]) {
      replies.forEach(function (reply: { toString: () => string; }, index: any) {
        var chats = reply.toString().split(",")
        chats.forEach(function (chat: string) {
          //this is NOT for testing subscriptions on myself
          if (chat !== "15024063") {
            client.get(chat, function (err: any, reply: string) {
              if (reply !== "") {
                const sub = reply;
                const option = "hot";
                const userId = `id_${chat}`;
                updateUser(userId, sub, option, subPostNum);
                sleep(200).then(() => {
                  try {
                    sendRedditPost(chat, sub, option, subPostNum);
                  }
                  catch (err) {
                    console.error(err);
                  }
                });
                console.info("Posted to " + chat + "from " + sub + " subreddit ")
              }
            });
          }
        });
      });
    });
  //console.log("postnumber " + subPostNum)
  const rands = Array(1, 2, 3, 4, 5, 6, 7, 8);
  const rand = rands[Math.floor(Math.random() * rands.length)];
  subPostNum = subPostNum + rand;
  //console.log(chats)
}, 10800 * 1000)

//for Suhasa
setInterval(function () {
  //var chat;
  client
    .multi()
    .keys("*")
    .exec(function (err: any, replies: any[]) {
      replies.forEach(function (reply: { toString: () => string; }, index: any) {
        var chats = reply.toString().split(",")
        chats.forEach(function (chat: string) {
          //this is for testing subscriptions on myself
          if (chat === "15024063") {
            client.get(chat, function (err: any, reply: string) {
              if (reply !== "") {
                const sub = reply;
                const option = "hot";
                const userId = `id_${chat}`;
                updateUser(userId, sub, option, subPostNum);
                sleep(200).then(() => {
                  try {
                    sendRedditPost(chat, sub, option, subPostNum);
                  }
                  catch (err) {
                    if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
                      console.info(`user ${chat}'s subscriptions were cleared`)
                      client.del(chat)
                    }
                    console.error(err)
                  }
                })
                console.info("Posted to " + chat + "from " + sub + " subreddit ")
              }
            });
          }
        });
      });
    });
  //console.log("postnumber " + subPostNum)
  const rands = Array(1, 2, 3);
  const rand = rands[Math.floor(Math.random() * rands.length)];
  subPostNum = subPostNum + rand
  //console.log(chats)
}, 3600 * 1000)

/*//for Suhasa's private channel
setInterval(function () {
  //var chat;
  client
    .multi()
    .keys("*")
    .exec(function (err, replies) {
      replies.forEach(function (reply, index) {
        var chats = reply.toString().split(",")
        chats.forEach(function (chat) {
          //this is for testing subscriptions on myself
          if (chat == "-1001200692277") {
            client.get(15024063, function (err, reply) {
              if (reply !== "") {
                const sub = reply;
                option = "hot";
                const userId = `id_15024063`;
                updateUser(userId, sub, option, subPostNum);
                sleep(200).then(() => { sendRedditPost(chat, sub, option, subPostNum);  });
                console.info("Posted to "+ chat + "from " + sub + " subreddit ")
              }
            });
          }
        });
      });
    });
  //console.log("postnumber " + subPostNum)
  rands = Array(1,2,3);
  rand = rands[Math.floor(Math.random() * rands.length)];
  subPostNum = subPostNum + rand
  //console.log(chats)
}, 20 * 1000)*/

//reset hot Posts traversing index to 0 after 12 hours
setInterval(function () {
  subPostNum = 0;
}, 43200 * 100)

/*function fetchThreads(query, messageId, postNum) {
 
}

bot.api.on("inlineQuery", (ctx) => {
  console.log("inside inline query")
  var option = "hot"
  var subreddit = "jokes"
  var postNum = 0
   console.log("inside fetchThreads")
  //[subreddit, option] = msg.split(" ");
  const options = getOptions(option, rLimit);
  var start = new Date();
  request(
    { url: `http://www.reddit.com/r/${subreddit}/${options}`, json: true },
    function(error, response, body) {
      // check if response was successful
      if (!error && response.statusCode === 200) {
        // send error message if the bot encountered one
        if (body.hasOwnProperty("error") || body.data.children.length < 1) {
          return sendErrorMsg(msg.id);
        } else if (body.data.children.length - 1 < postNum) {
          return noMorePosts(msg.id);
        }
        //console.info(postNum)
        //if (body.data.children[0].data.subreddit_type === "restricted")
        //return Restricted(messageId);

        // reddit post data, "postNum+skips" takes into consideration the number of sticky threads skipped.
        var redditPost = body.data.children[postNum].data;

        //ignore stickied/pinned posts
        /*for (postNum = skips; redditPost.stickied === true; postNum++) {
          try {
            redditPost = body.data.children[postNum + 1].data;
          } catch (err) {
            return noMorePosts(messageId);
          }
          skips = skips + 1;
          //console.info(postNum)
        }

        //if(redditPost.stickied === true)
        //bot.api.click()
        redditPost.title = redditPost.title.replace(/&amp;/g, "&");
        const answers = redditPost.title
        //return redditPost.title
        console.log("results:  "+redditPost.title)
        return bot.api.answerInlineQuery(msg.id,answers);
        }
    }
  );
  
});*/

bot.start();
