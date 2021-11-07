//Don't sleep
const help = require('./help.js');
const http = require("http");
const express = require("express");
require('dotenv').config();
const fetch = require("node-fetch")

const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

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
const client = new MongoClient(uri, { useNewUrlParser: true });
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

const redis = require("redis");
const client = redis.createClient();

client.on("error", function (error) {
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
var logger = require("ccipher").createLogger(); // logs to STDOUT
// var logger = require("logger").createLogger("/home/pi/reddgram-telegram-bot/development.log"); // logs to a file

//custom date for logging
let options = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  weekday: "short",
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Kolkata",
  timeZoneName: "short"
};
logger.format = function (level, date, message) {
  return [
    level,
    " [",
    new Date().toLocaleString("en-IN", options),
    "] ",
    message
  ].join("");
};

//reddit browser

var parser = require("tld-extract");

const { Bot } = require("grammy");
const fs = require("fs");
const request = require("request");
const BOT_TOKEN = process.env.BOT_TOKEN;

const bot = new Bot(BOT_TOKEN)
var prettytime = require("prettytime");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
const { features } = require('process');


let db = {};
let rLimit = 100;
var skips = 0; //keep track of no. of sticky threads skipped

function updateUser(userId, subreddit, option, postNum) {
  db[userId] = { subreddit, option, postNum };
}

function sendRedditPost(messageId, subreddit, option, postNum) {
  const options = getOptions(option, rLimit);
  var start = new Date();
  const url = `http://www.reddit.com\/r\/${subreddit}\/${options}`
  const sendRedditPost = async url => {
    try {
      const response = await fetch(url);
      const body = await response.json();
      // send error message if the bot encountered one
      if (body.hasOwnProperty("error") || body.data.children.length < 1) {
        return sendErrorMsg(messageId, subreddit);
      } else if (body.data.children.length - 1 < postNum) {
        return noMorePosts(messageId);
      }
      //logger.info(postNum)
      //if (body.data.children[0].data.subreddit_type === "restricted")
      //return Restricted(messageId);

      // reddit post data, "postNum+skips" takes into consideration the number of sticky threads skipped.
      try {
        var redditPost = body.data.children[postNum + skips].data;
      } catch (err) {
        logger.error(`ERROR: ${err}`)
      }

      //ignore stickied/pinned posts
      for (postNum = skips; redditPost.stickied === true; postNum++) {
        try {
          redditPost = body.data.children[postNum + 1].data;
        } catch (err) {
          logger.error("ERROR: " + err);
          return noMorePosts(messageId);
        }
        skips = skips + 1;
        //logger.info(postNum)
      }

      //if(redditPost.stickied === true)
      //bot.click()
      redditPost.title = redditPost.title.replace(/&amp;/g, "&");

      // inline buttons
      const markup = bot.inlineKeyboard([
        [
          //bot.inlineButton('🔗 Reddit', { url: `https://www.reddit.com${redditPost.permalink}` }),
          bot.inlineButton("💬 Comments", {
            url: `https://www.reddit.com${redditPost.permalink}`
          }),
          bot.inlineButton("↗️ Share", {
            url: `https://t.me/share/url?text=🔖 ${redditPost.title}\n\n↗️ Shared via @RedditBrowserBot&url=https%3A//www.reddit.com${redditPost.permalink}`
          }),
          bot.inlineButton("▶️ Next", { callback: "callback_query_next" })
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
        //bot.sendChatAction(messageId, "upload_photo");
        return sendImagePost(messageId, redditPost, markup);
      }
      //gif
      else if (
        redditPost.preview &&
        redditPost.preview.images[0].variants.mp4
      ) {
        bot.sendChatAction(messageId, "upload_video").catch( err => {
          if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
            logger.info(`user ${messageId}'s subscriptions were cleared`)
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
        bot.sendChatAction(messageId, "upload_video").catch (err => {
          if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
            logger.info(`user ${messageId}'s subscriptions were cleared`)
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
        //bot.sendChatAction(messageId, "upload_video");
        return sendVideoPost(messageId, redditPost, markup);
      }
      //link
      else if (
        /http(s)?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi.test(
          redditPost.url
        ) &&
        !redditPost.selftext
      ) {
        //bot.sendChatAction(messageId, "typing");
        return sendLinkPost(messageId, redditPost, markup);
      }
      //text
      else {
        //bot.sendChatAction(messageId, "typing");
        return sendMessagePost(messageId, redditPost, markup);
      }

      // unsuccessful response
    }
    catch (err) {
      if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
        logger.info(`user ${messageId}'s subscriptions were cleared`)
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
  //logger.info("http request completed")
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
        //logger.info(postNum)
        //if (body.data.children[0].data.subreddit_type === "restricted")
        //return Restricted(messageId);

        // reddit post data, "postNum+skips" takes into consideration the number of sticky threads skipped.
        var redditPost = body.data.children[postNum + skips].data;

        //ignore stickied/pinned posts
        for (postNum = skips; redditPost.stickied === true; postNum++) {
          try {
            redditPost = body.data.children[postNum + 1].data;
          } catch (err) {
            logger.error("ERROR: "+err);
            return noMorePosts(messageId);
          }
          skips = skips + 1;
          //logger.info(postNum)
        }

        //if(redditPost.stickied === true)
        //bot.click()
        redditPost.title = redditPost.title.replace(/&amp;/g, "&");

        // inline buttons
        const markup = bot.inlineKeyboard([
          [
            //bot.inlineButton('🔗 Reddit', { url: `https://www.reddit.com${redditPost.permalink}` }),
            bot.inlineButton("💬 Comments", {
              url: `https://www.reddit.com${redditPost.permalink}`
            }),
            bot.inlineButton("↗️ Share", {
              url: `https://t.me/share/url?text=%0D%0D${redditPost.title}\n\nShared via @RedditBrowserBot&url=https%3A//www.reddit.com${redditPost.permalink}`
            }),
            bot.inlineButton("⏭ Next", { callback: "callback_query_next" })
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
          //bot.sendChatAction(messageId, "upload_photo");
          return sendImagePost(messageId, redditPost, markup);
        }
        //gif
        else if (
          redditPost.preview &&
          redditPost.preview.images[0].variants.mp4
        ) {
          bot.sendChatAction(messageId, "upload_video");
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
          //bot.sendChatAction(messageId, "upload_video");
          return sendVideoPost(messageId, redditPost, markup);
        }
        //link
        else if (
          /http(s)?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi.test(
            redditPost.url
          ) &&
          !redditPost.selftext
        ) {
          //bot.sendChatAction(messageId, "typing");
          return sendLinkPost(messageId, redditPost, markup);
        }
        //text
        else {
          //bot.sendChatAction(messageId, "typing");
          return sendMessagePost(messageId, redditPost, markup);
        }

        // unsuccessful response
      } else {
        logger.error("ERROR: "+error);
        return sendErrorMsg(messageId);
      }
    }
  );
  //logger.info("http request completed")
} */

// options
function getOptions(option, rlimit) {
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

//parse_mode option for bot.sendMessage()
const parse = "HTML";

/*function Restricted(messageId) {
  const errorMsg = `<i>ERROR: This subreddit is restricted.</i>`;
  logger.error(errorMsg);
  return bot.sendMessage(messageId, errorMsg, { parse });
  
}*/

function sendErrorMsg(messageId, subreddit) {
  const errorMsg = `<i>ERROR: Couldn't find the subreddit: "${subreddit}". Use /help for instructions.</i>`;
  logger.error(errorMsg);
  return bot.sendMessage(messageId, errorMsg, { parse });
}

function sendLimitMsg(messageId) {
  const errorMsg = `_ERROR: Sorry, we can't show more than ${rLimit} threads for one option. Please change your subreddit or option. 
Use /help for instructions._`;
  logger.error(errorMsg);
  return bot.sendMessage(messageId, errorMsg, { parse });
}

function selfTextLimitExceeded(messageId) {
  const errorMsg = `......\n\n<i>ERROR: Sorry, The content of this thread has exceeded the limit. Please click on Comments button to view the full thread or Next button to try and load the next thread....</i>`;
  logger.error(errorMsg);
  return errorMsg;
}

function noMorePosts(messageId) {
  const errorMsg = `<i>ERROR: No more threads. Use /help for instructions</i>`;
  logger.error(errorMsg);
  return bot.sendMessage(messageId, errorMsg, { parse });
}

/*function sendPlsWait(messageId) {
    const message = `Please wait...`;
    return bot.sendMessage(messageId, message);
}*/

function sendImagePost(messageId, redditPost, markup) {
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
    var site = `${websitename[0]}${websitename[1]}`;
  else var site = websitename[0];

  if (redditPost.score >= 1000)
    var points = (redditPost.score / 1000).toFixed(1) + "k";
  else var points = redditPost.score;

  var upvote_ratio = (redditPost.upvote_ratio * 100).toFixed(0);

  var caption = `🔖 <a href="${url}">${redditPost.title}</a> <b>(${site})</b>\n
⬆️ <b>${points}</b> (${upvote_ratio}%)  •  💬 ${redditPost.num_comments}  •  ⏳ ${timeago} ago
✏️ u/${redditPost.author}  •  🌐 r‏/${redditPost.subreddit}`;

  logger.info("Request completed: image/gif thread");
  //nsfw indicator
  if (redditPost.over_18 === true && (messageId != "15024063" || messageId != "576693302")) {
    console.log("no nsfw!"); return bot.sendMessage(
      messageId,
      "<i>ERROR: Sorry, In accordance with Telegram's Terms of Service you will not be able to browse NSFW posts anymore.\nIf you have subscribed to this sub, please unsubscribe by sending</i> <code>/unsub " + redditPost.subreddit + "</code>",
      { parse }
    ).catch(err => {
      if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
        logger.info(`user ${messageId}'s subscriptions were cleared`)
        return client.del(messageId)
      }
    })
  } //caption = "🔞" + caption;
  else if (redditPost.over_18 === true && (messageId == "15024063" || messageId == "576693302")) caption = "🔞" + caption;

  var postNum = -1;
  //logger.info("about to send the post to telegram")
  //~~fix for memes topy not working, sendMessage with url instead of sendPhoto which was crashing because of a 8.7mb image in "memes topy"~~ reverted back to sendPhoto for some layout refresh.
  //return bot.sendMessage(messageId, caption, { parse, markup })
  return bot.sendPhoto(messageId, url, { caption, parse, markup }).catch(err => {
    if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
      logger.info(`user ${messageId}'s subscriptions were cleared`)
      return client.del(messageId)
    }
  }
  )
  /*.catch(err => {
    userId = `id_${messageId}`;
    postNum = postNum + 1;
    subreddit = redditPost.subreddit;
    //option = db[`id_${messageId}`].option;
    console.log("subreddit =" +subreddit + "postnum = "+postNum)
  if (db[userId] === undefined) {
      //bot.answerCallbackQuery(msg.id);
      return bot.sendMessage(
        messageId,
        "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
        { parse }
      );
    } else if (db[userId].hasOwnProperty("subreddit")) {
      subreddit = db[userId]["subreddit"];
    } else {
      return bot.sendMessage(
        messageId,
        "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
        { parse }
      );
    }
  //postNum = 1
  logger.error("Failed to Load. Loading next post...")
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
  // prev code line was return bot.sendPhoto(messageId, url, {caption, markup});
}

function sendLinkPost(messageId, redditPost, markup) {
  var bestComment;
  if (redditPost.subreddit == "explainlikeimfive") {
    const url = `https:\/\/www.reddit.com\/r\/${redditPost.subreddit}\/comments\/${redditPost.id}.json?`
    const sendBestComment = async url => {
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
      logger.info("Request completed: link thread");
      //console.info("link post failing ... "+messageId+" "+message+ " "+ parse + " "+ markup)
      //nsfw indicator
      if (redditPost.over_18 === true) message = "🔞" + message;
      var postNum = -1;
      bot.sendMessage(messageId, message, { parse, markup }).catch(err => {
        if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
          logger.info(`user ${messageId}'s subscriptions were cleared`)
          return client.del(messageId)
        }
        userId = `id_${messageId}`;
        postNum = postNum + 1;
        subreddit = redditPost.subreddit;
        //option = db[`id_${messageId}`].option;
        console.log("subreddit =" + subreddit + "postnum = " + postNum)
        if (db[userId] === undefined) {
          //bot.answerCallbackQuery(msg.id);
          return bot.sendMessage(
            messageId,
            "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
            { parse }
          );
        } else if (db[userId].hasOwnProperty("subreddit")) {
          subreddit = db[userId]["subreddit"];
        } else {
          return bot.sendMessage(
            messageId,
            "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
            { parse }
          );
        }
        //postNum = 1
        logger.error("Failed to Load. Loading next post...")
        userId = `id_${messageId}`;
        if (db[userId].hasOwnProperty("postNum")) {
          postNum = db[userId]["postNum"];
          postNum = postNum + 1;
        }
        db[userId]["postNum"] = postNum;
        if (db[userId]["option"]) {
          option = db[userId]["option"];
        } else {
          //default sort = hot
          option = "hot";
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

    var { tld, domain, sub } = parser(redditPost.url);
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
    logger.info("Request completed: link thread");
    //console.info("link post failing ... "+messageId+" "+message+ " "+ parse + " "+ markup)
    //nsfw indicator
    if (redditPost.over_18 === true && messageId != "15024063")
      /* { console.log("no nsfw!"); return bot.sendMessage(
        messageId,
        "<i>ERROR: Sorry, In accordance with Telegram's Terms of Service you will not be able to browse NSFW posts anymore.\nIf you have subscribed to this sub, please unsubscribe by sending</i> <code>/unsub " + redditPost.subreddit + "</code>\n<i>Apologies for the inconvenience.</i>",
        { parse }
      );; }*/
      message = "🔞" + message;
    //else if (redditPost.over_18 === true && messageId == "15024063") message = "🔞" + message;

    var postNum = -1;
    bot.sendMessage(messageId, message, { parse, markup }).catch(err => {
      if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
        logger.info(`user ${messageId}'s subscriptions were cleared`)
        return client.del(messageId)
      }
      userId = `id_${messageId}`;
      postNum = postNum + 1;
      subreddit = redditPost.subreddit;
      //option = db[`id_${messageId}`].option;
      console.log("subreddit =" + subreddit + "postnum = " + postNum)
      if (db[userId] === undefined) {
        //bot.answerCallbackQuery(msg.id);
        return bot.sendMessage(
          messageId,
          "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
          { parse }
        );
      } else if (db[userId].hasOwnProperty("subreddit")) {
        subreddit = db[userId]["subreddit"];
      } else {
        return bot.sendMessage(
          messageId,
          "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
          { parse }
        );
      }
      //postNum = 1
      logger.error("Failed to Load. Loading next post...")
      userId = `id_${messageId}`;
      if (db[userId].hasOwnProperty("postNum")) {
        postNum = db[userId]["postNum"];
        postNum = postNum + 1;
      }
      db[userId]["postNum"] = postNum;
      if (db[userId]["option"]) {
        option = db[userId]["option"];
      } else {
        //default sort = hot
        option = "hot";
      }

      updateUser(messageId, subreddit, option, postNum + 2);
      sendRedditPost(messageId, subreddit, option, postNum + 2);
    });
  }
}

function sendGifPost(messageId, redditPost, markup) {
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
  logger.info("Request completed: gif thread");
  //nsfw indicator
  if (redditPost.over_18 === true && (messageId != "15024063" || messageId != "576693302")) {
    console.log("no nsfw!"); return bot.sendMessage(
      messageId,
      "<i>ERROR: Sorry, in accordance with Telegram Terms of Service you will not be able to browse NSFW posts anymore.\nIf you have subscribed to this sub, please unsubscribe by sending</i> <code>/unsub " + redditPost.subreddit + "</code>\n <i>Apologies for the inconvenience.</i>",
      { parse }
    ).catch(err => {
      if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
        logger.info(`user ${messageId}'s subscriptions were cleared`)
        return client.del(messageId)
      }
    })
  } //message = "🔞" + message;
  else if (redditPost.over_18 === true && (messageId == "15024063" || messageId == "576693302")) caption = "🔞" + caption;

  return bot.sendVideo(messageId, gif, { parse, caption, markup }).catch(err => {
    if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
      logger.info(`user ${messageId}'s subscriptions were cleared`)
      return client.del(messageId)
    }
  })
}

function sendAnimPost(messageId, redditPost, markup) {
  //let url = redditPost.url;
  //url = url.replace(/&amp;/g, '&');
  const parse = "HTML";
  //let gifArr = redditPost.preview.images[0].variants.mp4.resolutions;
  //if(redditPost.domain == "gfycat.com")
  var gif;
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
  logger.info("Request completed: animgif thread");
  //nsfw indicator
  if (redditPost.over_18 === true && (messageId != "15024063" || messageId != "576693302")) {
    console.log("no nsfw!"); return bot.sendMessage(
      messageId,
      "<i>ERROR: Sorry, In accordance with Telegram's Terms of Service you will not be able to browse NSFW posts anymore.\nIf you have subscribed to this sub, please unsubscribe by sending</i> <code>/unsub " + redditPost.subreddit + "</code>",
      { parse }
    ).catch(err => {
      if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
        logger.info(`user ${messageId}'s subscriptions were cleared`)
        return client.del(messageId)
      }
    })
  } //caption = "🔞" + caption;
  else if (redditPost.over_18 === true && (messageId == "15024063" || messageId == "576693302")) caption = "🔞" + caption;
  var postNum = -1;
  return bot.sendAnimation(messageId, gif, { parse, caption, markup }).catch(err => {
    if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
      logger.info(`user ${messageId}'s subscriptions were cleared`)
      return client.del(messageId)
    }
    userId = `id_${messageId}`;
    postNum = postNum + 1;
    subreddit = redditPost.subreddit;
    //option = db[`id_${messageId}`].option;
    console.log("subreddit =" + subreddit + "postnum = " + postNum)
    if (db[userId] === undefined) {
      //bot.answerCallbackQuery(msg.id);
      return bot.sendMessage(
        messageId,
        "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
        { parse }
      );
    } else if (db[userId].hasOwnProperty("subreddit")) {
      subreddit = db[userId]["subreddit"];
    } else {
      return bot.sendMessage(
        messageId,
        "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
        { parse }
      );
    }
    //postNum = 1
    logger.error("Failed to Load. Loading next post...")
    userId = `id_${messageId}`;
    if (db[userId].hasOwnProperty("postNum")) {
      postNum = db[userId]["postNum"];
      postNum = postNum + 1;
    }
    db[userId]["postNum"] = postNum;
    if (db[userId]["option"]) {
      option = db[userId]["option"];
    } else {
      //default sort = hot
      option = "hot";
    }

    updateUser(messageId, subreddit, option, postNum + 2);
    sendRedditPost(messageId, subreddit, option, postNum + 2);
  });
}

function sendVideoPost(messageId, redditPost, markup) {
  let url = redditPost.url;
  url = url.replace(/&amp;/g, "&");
  const parse = "HTML";
  //let boldtitle = redditPost.title
  //post time
  var timeago = prettytime(redditPost.created_utc * 1000 - Date.now(), {
    short: true,
    decimals: 0
  });
  timeago = timeago.replace(/\s/g, "");
  var { tld, domain, sub } = parser(redditPost.url);
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
  logger.info("Request completed: video/gif thread");

  //nsfw indicator
  if (redditPost.over_18 === true && (messageId != "15024063" || messageId != "576693302")) {
    console.log("no nsfw!"); return bot.sendMessage(
      messageId,
      "<i>ERROR: Sorry, In accordance with Telegram's Terms of Service you will not be able to browse NSFW posts anymore.\nIf you have subscribed to this sub, please unsubscribe by sending</i> <code>/unsub " + redditPost.subreddit + "</code>",
      { parse }
    ).catch(err => {
      if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
        logger.info(`user ${messageId}'s subscriptions were cleared`)
        return client.del(messageId)
      }
    })
  } //message = "🔞" + message;
  else if (redditPost.over_18 === true && (messageId == "15024063" || messageId == "576693302")) message = "🔞" + message;

  var postNum = -1;
  return bot.sendMessage(messageId, message, { parse, markup }).catch(err => {
    if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
      logger.info(`user ${messageId}'s subscriptions were cleared`)
      return client.del(messageId)
    }
    userId = `id_${messageId}`;
    postNum = postNum + 1;
    subreddit = redditPost.subreddit;
    //option = db[`id_${messageId}`].option;
    console.log("subreddit =" + subreddit + "postnum = " + postNum)
    if (db[userId] === undefined) {
      //bot.answerCallbackQuery(msg.id);
      return bot.sendMessage(
        messageId,
        "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
        { parse }
      );
    } else if (db[userId].hasOwnProperty("subreddit")) {
      subreddit = db[userId]["subreddit"];
    } else {
      return bot.sendMessage(
        messageId,
        "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
        { parse }
      );
    }
    //postNum = 1
    logger.error("Failed to Load. Loading next post...")
    userId = `id_${messageId}`;
    if (db[userId].hasOwnProperty("postNum")) {
      postNum = db[userId]["postNum"];
      postNum = postNum + 1;
    }
    db[userId]["postNum"] = postNum;
    if (db[userId]["option"]) {
      option = db[userId]["option"];
    } else {
      //default sort = hot
      option = "hot";
    }

    updateUser(messageId, subreddit, option, postNum + 2);
    sendRedditPost(messageId, subreddit, option, postNum + 2);
  });
}

function sendMessagePost(messageId, redditPost, markup) {
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
  var bestComment;
  if (redditPost.subreddit == "explainlikeimfive") {
    const url = `https:\/\/www.reddit.com\/r\/${redditPost.subreddit}\/comments\/${redditPost.id}.json?`
    const sendBestComment = async url => {
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
    sleep(2500).then(() => {
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
        logger.error("ERROR: " + err);
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
        logger.info("Request completed: long text thread");
        //nsfw indicator
        if (redditPost.over_18 === true) message = "🔞" + message;
        logger.info("Request completed: text thread");
        var postNum = -1;
        return bot.sendMessage(messageId, message, { parse, markup }).catch(err => {
          if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
            logger.info(`user ${messageId}'s subscriptions were cleared`)
            return client.del(messageId)
          }
          userId = `id_${messageId}`;
          postNum = postNum + 1;
          subreddit = redditPost.subreddit;
          //option = db[`id_${messageId}`].option;
          console.log("subreddit =" + subreddit + "postnum = " + postNum)
          if (db[userId] === undefined) {
            //bot.answerCallbackQuery(msg.id);
            return bot.sendMessage(
              messageId,
              "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
              { parse }
            );
          } else if (db[userId].hasOwnProperty("subreddit")) {
            subreddit = db[userId]["subreddit"];
          } else {
            return bot.sendMessage(
              messageId,
              "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
              { parse }
            );
          }
          //postNum = 1
          logger.error("Failed to Load. Loading next post...")
          userId = `id_${messageId}`;
          if (db[userId].hasOwnProperty("postNum")) {
            postNum = db[userId]["postNum"];
            postNum = postNum + 1;
          }
          db[userId]["postNum"] = postNum;
          if (db[userId]["option"]) {
            option = db[userId]["option"];
          } else {
            //default sort = hot
            option = "hot";
          }

          updateUser(messageId, subreddit, option, postNum + 1);
          sendRedditPost(messageId, subreddit, option, postNum + 1);
        });
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
      logger.info("Request completed: text thread");
      var postNum = -1;
      return bot.sendMessage(messageId, message, { parse, markup }).catch(err => {
        if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
          logger.info(`user ${messageId}'s subscriptions were cleared`)
          return client.del(messageId)
        }
        userId = `id_${messageId}`;
        postNum = postNum + 1;
        subreddit = redditPost.subreddit;
        //option = db[`id_${messageId}`].option;
        console.log("subreddit =" + subreddit + "postnum = " + postNum)
        if (db[userId] === undefined) {
          //bot.answerCallbackQuery(msg.id);
          return bot.sendMessage(
            messageId,
            "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
            { parse }
          );
        } else if (db[userId].hasOwnProperty("subreddit")) {
          subreddit = db[userId]["subreddit"];
        } else {
          return bot.sendMessage(
            messageId,
            "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
            { parse }
          );
        }
        //postNum = 1
        logger.error("Failed to Load. Loading next post...")
        userId = `id_${messageId}`;
        if (db[userId].hasOwnProperty("postNum")) {
          postNum = db[userId]["postNum"];
          postNum = postNum + 1;
        }
        db[userId]["postNum"] = postNum;
        if (db[userId]["option"]) {
          option = db[userId]["option"];
        } else {
          //default sort = hot
          option = "hot";
        }

        updateUser(messageId, subreddit, option, postNum + 2);
        sendRedditPost(messageId, subreddit, option, postNum + 2);
      });
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
      logger.error("ERROR: " + err);
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
      logger.info("Request completed: long text thread");
      //nsfw indicator
      if (redditPost.over_18 === true) message = "🔞" + message;
      logger.info("Request completed: text thread");
      var postNum = -1;
      return bot.sendMessage(messageId, message, { parse, markup }).catch(err => {
        if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
          logger.info(`user ${messageId}'s subscriptions were cleared`)
          return client.del(messageId)
        }
        userId = `id_${messageId}`;
        postNum = postNum + 1;
        subreddit = redditPost.subreddit;
        //option = db[`id_${messageId}`].option;
        console.log("subreddit =" + subreddit + "postnum = " + postNum)
        if (db[userId] === undefined) {
          //bot.answerCallbackQuery(msg.id);
          return bot.sendMessage(
            messageId,
            "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
            { parse }
          );
        } else if (db[userId].hasOwnProperty("subreddit")) {
          subreddit = db[userId]["subreddit"];
        } else {
          return bot.sendMessage(
            messageId,
            "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
            { parse }
          );
        }
        //postNum = 1
        logger.error("Failed to Load. Loading next post...")
        userId = `id_${messageId}`;
        if (db[userId].hasOwnProperty("postNum")) {
          postNum = db[userId]["postNum"];
          postNum = postNum + 1;
        }
        db[userId]["postNum"] = postNum;
        if (db[userId]["option"]) {
          option = db[userId]["option"];
        } else {
          //default sort = hot
          option = "hot";
        }

        updateUser(messageId, subreddit, option, postNum + 2);
        sendRedditPost(messageId, subreddit, option, postNum + 2);
      });
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
    logger.info("Request completed: text thread");
    var postNum = -1;
    return bot.sendMessage(messageId, message, { parse, markup }).catch(err => {
      if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
        logger.info(`user ${messageId}'s subscriptions were cleared`)
        return client.del(messageId)
      }
      userId = `id_${messageId}`;
      postNum = postNum + 1;
      subreddit = redditPost.subreddit;
      //option = db[`id_${messageId}`].option;
      console.log("subreddit =" + subreddit + "postnum = " + postNum)
      if (db[userId] === undefined) {
        //bot.answerCallbackQuery(msg.id);
        return bot.sendMessage(
          messageId,
          "<i>ERROR: Sorry, an error occurred. please re-submit your previous request.</i>",
          { parse }
        );
      } else if (db[userId].hasOwnProperty("subreddit")) {
        subreddit = db[userId]["subreddit"];
      } else {
        return bot.sendMessage(
          messageId,
          "<i>ERROR: Sorry, please send the subreddit name with option again.</i>",
          { parse }
        );
      }
      //postNum = 1
      logger.error("Failed to Load. Loading next post...")
      userId = `id_${messageId}`;
      if (db[userId].hasOwnProperty("postNum")) {
        postNum = db[userId]["postNum"];
        postNum = postNum + 1;
      }
      db[userId]["postNum"] = postNum;
      if (db[userId]["option"]) {
        option = db[userId]["option"];
      } else {
        //default sort = hot
        option = "hot";
      }

      updateUser(messageId, subreddit, option, postNum + 2);
      sendRedditPost(messageId, subreddit, option, postNum + 2);
    });
  }
}

/*bot.start(ctx => {
    ctx.reply(
      "test"
    )
  })
*/

bot.on("message", msg => {
  const parse = "Markdown";
  //emoji mode
  if (
    msg.text === "😂" ||
    msg.text === "😀" ||
    msg.text === "😃" ||
    msg.text === "😄" ||
    msg.text === "😁" ||
    msg.text === "😆" ||
    msg.text === "😅" ||
    msg.text === "🤣"
  )
    msg.text = "/memes+jokes+funny+humor+programmerhumor+dadjokes+punny+cursedcomments";

  if (msg.text === "🧐" || msg.text === "👀" || msg.text === "👁")
    msg.text =
      "/pics+gifs+videos+educationalgifs+wholesomegifs+reactiongifs+perfectloops+photoshopbattles+historyporn+spaceporn+earthporn+comics";
  if (msg.text === "🚿") msg.text = "/showerthoughts";
  if (msg.text === "😍")
    msg.text = "/aww+cats+dogs+animalsbeingderps+animalsbeingjerks";
  if (msg.text === "🐈") msg.text = "/cats";
  if (msg.text === "🦮") msg.text = "/dogs";
  if (msg.text === "🎬") msg.text = "/movies+television+anime";
  if (msg.text === "🦠") msg.text = "/coronavirus";
  if (msg.text === "🤔")
    msg.text =
      "/todayilearned+explainlikeimfive+youshouldknow+outoftheloop+wikipedia+howto+iwanttolearn+learnuselesstalents+diy";
  if (
    msg.text === "😳" ||
    msg.text === "😱" ||
    msg.text === "😨" ||
    msg.text === "😰" ||
    msg.text === "🤯"
  )
    msg.text =
      "/interestingasfuck+mildlyinteresting+woahdude+damnthatsinteresting+beamazed+thatsinsane+unexpected";
  if (msg.text.includes("👌"))
    msg.text =
      "/internetisbeautiful+dataisbeautiful+art+animation+artporn+pixelart+oddlysatisfying+cityporn+designporn";
  if (msg.text === "😋" || msg.text === "🤤")
    msg.text = "/food+foodporn+seriouseats+recipes+veganrecipes+pizza";
  if (msg.text === "🥱" || msg.text === "😴") msg.text = "/nosleep";
  if (msg.text === "😎") msg.text = "/random";
  if (
    msg.text.includes("🤦‍") ||
    msg.text.includes("🤦") ||
    msg.text.includes("🤦")
  )
    msg.text = "/indianpeoplefacebook+facepalm";
  if (msg.text.includes("💪"))
    msg.text =
      "/productivity+happy+getmotivated+selfimprovement+quotesporn+fitness";
  //~~middle finger emoji~~ TOS violation - hence removed

  if ((msg.chat.id == "15024063" || msg.chat.id == "576693302") && (msg.text.includes("🖕") || msg.text === "🍑"))
    msg.text =
      "/nsfw+gonewild+nsfw_gifs+celebnsfw+nsfw_gif+sexygirls+toocuteforporn+justhotwomen+sexybutnotporn";

  if (msg.text === "💩")
    msg.text =
      "/shittylifeprotips+shittyfoodporn+shittyreactiongifs+crappydesign+shittymoviedetails+shitpost";
  //start/help menu
  if (
    msg.text === "/start" ||
    msg.text === "/help" ||
    msg.text === "/help@RedditBrowserBot" ||
    msg.text === "/start@RedditBrowserBot"
  ) {
    skips = 0;
    const message = helpMessage;
    logger.info("User(" + msg.from.id + ") : " + msg.text);
    const markup = bot.inlineKeyboard(
      [
        [
          bot.inlineButton("💫 Features", { callback: "callback_query_helpfeatures" }),

          bot.inlineButton("📢 Subscriptions", { callback: "callback_query_helpsubs" }),

          bot.inlineButton("*️⃣ Default Subs", { callback: "callback_query_inbuiltsubs" })
        ],
        [
          bot.inlineButton("💣 Popular Subs", { callback: "callback_query_listsubs" }),

          bot.inlineButton("😎 Emoji Mode", { callback: "callback_query_emojimode" }),

          bot.inlineButton("Ⓜ️ Multi Mode", { callback: "callback_query_multimode" })

        ],
        [
          bot.inlineButton("⬇️ Import Subreddits", { callback: "callback_query_importsubs" }),

          bot.inlineButton("🤔 FAQs", { callback: "callback_query_faq" })
        ]
      ]
    );
    return bot.sendMessage(msg.chat.id, message, { parse, markup });
  }
  /* OLD start/help menu
  if (
    msg.text === "/start" ||
    msg.text === "/help" ||
    msg.text === "/help@RedditBrowserBot" ||
    msg.text === "/start@RedditBrowserBot"
  ) {
    skips = 0;
    const message = helpMessage;
    logger.info("User(" + msg.from.username + "): " + msg.text);
    return bot.sendMessage(msg.chat.id, message, { parse });
  }*/

  //list of popular subreddits
  else if (msg.text === "/list" || msg.text === "/list@RedditBrowserBot") {
    skips = 0;
    const message = listSubs;
    logger.info("User(" + msg.from.id + ") : " + msg.text);
    return bot.sendMessage(msg.chat.id, message, { parse });
  }
  //emoji mode
  else if (msg.text === "/emoji" || msg.text === "/emoji@RedditBrowserBot") {
    skips = 0;
    const message = emojiMode;
    logger.info("User(" + msg.from.id + ") : " + msg.text);
    return bot.sendMessage(msg.chat.id, message, { parse });
  }
  //options
  else if (
    msg.text === "/options" ||
    msg.text === "/options@RedditBrowserBot"
  ) {
    skips = 0;
    const message = sortOptions;
    logger.info("User(" + msg.from.id + ") : " + msg.text);
    return bot.sendMessage(msg.chat.id, message, { parse });
  }
  else if (
    msg.text === "/contact" ||
    msg.text === "/contact@RedditBrowserBot"
  ) {
    const markup = bot.inlineKeyboard([
      [
        bot.inlineButton("Join the Official Reddgram group", {
          url: "https://t.me/reddgramissues"
        })
      ],
      [
        bot.inlineButton("Projects Channel", {
          url: "https://t.me/ssjprojects"
        }),

        bot.inlineButton("Donate", {
          url: "https://paypal.me/suhasa010"
        })
      ]
    ]);
    skips = 0;
    const message = contactDev;
    logger.info("User(" + msg.from.id + ") : " + msg.text);
    return bot.sendMessage(msg.chat.id, message, { parse, markup });
  }
  else if (
    msg.text === "/multi" ||
    msg.text === "/multi@RedditBrowserBot"
  ) {
    skips = 0;
    const message = multiMode;
    logger.info("User: " + msg.text);
    return bot.sendMessage(msg.chat.id, message, { parse });
  }
  else if (
    msg.text === "/helpsubs" ||
    msg.text === "/helpsubs@RedditBrowserBot"
  ) {
    skips = 0;
    const message = subscriptions;
    logger.info("User: " + msg.text);
    return bot.sendMessage(msg.chat.id, message, { parse });
  }
  else if (
    msg.text === "/import" ||
    msg.text === "/import@RedditBrowserBot"
  ) {
    logger.info("User(" + msg.from.id + ") : " + msg.text);
    return bot.sendMessage(msg.chat.id, importSubs, { parse });
  }
  else if (/\/sub[scribe]*[@RedditBrowserBot]* [a-zA-Z0-9+_]*$/.test(msg.text) || /\/import[ ]+[https://old.reddit.com/r/]+[a-zA-Z0-9_\-+\/]*$/.test(msg.text)) {
    if (/\/import[ ]+[https://old.reddit.com/r/]+[a-zA-Z0-9_\-+\/]*$/.test(msg.text)) {
      var subreddit = msg.text.slice(33, msg.text.length);
      logger.info("User(" + msg.from.id + ") : " + msg.text);
      //console.log(subreddit)
      bot.sendMessage(msg.chat.id, "Successfully imported subreddits from Reddit 🥳\nIn a few seconds you should be able to see those here - /subscriptions")
    }
    else {
      const parse = "Markdown";
      //if (msg.text.includes("/")) {
      logger.info("User(" + msg.from.id + ") : " + msg.text);
      msg.text = msg.text.slice(1, msg.text.length);
      //console.log("after slice: " + msg.text)
      //}
      var [subscribe, subreddit, option] = msg.text.toLowerCase().split(" ");
      //console.log("sub = " + subreddit)
    }
    const options = getOptions(option, rLimit);
    request(
      { url: `http://www.reddit.com/r/${subreddit}/${options}`, json: true },
      function (error, response, body) {
        if (!error && response.statusCode === 200) {
          if (body.hasOwnProperty("error") || body.data.children.length < 1) {
            logger.error("INVALID SUB: User(" + msg.from.id + ") : " + msg.text);
            return sendErrorMsg(msg.chat.id, subreddit);
          }
          else {
            client.get(msg.chat.id, function (err, res) {
              res += '+'
              if (res.includes(subreddit)) {
                logger.info("ALREADY SUBBED: User(" + msg.from.id + ") : " + msg.text);
                return bot.sendMessage(msg.chat.id, `_Duh! You are already subscribed to r‏/${subreddit} 😏\nCheck_ /subscriptions _maybe?_`, { parse })
              }
              else {
                logger.info("SUCCESSFULLY SUBBED: User(" + msg.from.id + ") : " + msg.text);
                client.APPEND(msg.chat.id, `${subreddit}+`, function (err, res) {
                  return bot.sendMessage(msg.chat.id, `_Yay! Successfully subscribed to r‏/${subreddit} 🥳\nSee it here -_ /subscriptions`, { parse })
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
          return sendErrorMsg(msg.chat.id, subreddit);
        }
      });
  }
  else if (msg.text.includes('/subscriptions')) {
    const parse = "Markdown";
    logger.info("User(" + msg.from.id + ") : " + msg.text);
    if (msg.text.includes("/")) {
      msg.text = msg.text.slice(1, msg.text.length);
    }
    //userId = msg.from.id;
    client.get(msg.chat.id, function (err, res) {
      if (!res) {
        logger.error("NO SUBS: User(" + msg.from.id + ") : " + msg.text);
        return bot.sendMessage(msg.chat.id, noSubs, { parse })
      }
      else if (res) {
        var subs = res.toLowerCase().split("+");
        //console.log(subs);
        var subscriptions = `<b>Your subscriptions 📢</b>\n\n`;
        var i, num = -1;
        const parse = "html";
        subs.forEach((subs) => {
          if (subs !== '') {
            try {
              subscriptions += `r‏/${subs}\n\n`;
            }
            catch (err) {
              logger.error("ERROR: " + err)
            }
            //logger.info("Subscriptions for User("+msg.from.id+") : " + subscriptions);
          }
          num++;
        }
        );
        const markup = bot.inlineKeyboard([
          [
            bot.inlineButton(`🗑 Unsubscribe ${num} sub(s)`, {
              callback: "callback_query_unsuball"
            })
          ],
          [
            bot.inlineButton("🔀 Browse all", {
              callback: "callback_query_browsesubs"
            })
          ]
        ]);
        return bot.sendMessage(msg.chat.id, subscriptions, { parse, markup });
      }
    });
  }
  /* else if (msg.text.includes('/subpaginated')) {
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
 
     bot.onText(/\/book/, function (msg) {
       bot.sendMessage(msg.chat.id, 'Page: 25', getPagination(25, bookPages));
     });
 
     bot.on('callback_query', function (message) {
       var msg = message.message;
       var editOptions = Object.assign({}, getPagination(parseInt(message.data), bookPages), { chat_id: msg.chat.id, message_id: msg.message_id });
       bot.editMessageText('Page: ' + message.data, editOptions);
     });
     const parse = "Markdown";
     logger.info("User(" + msg.from.id + ") : " + msg.text);
     if (msg.text.includes("/")) {
       msg.text = msg.text.slice(1, msg.text.length);
     }
     //userId = msg.from.id;
     client.get(msg.chat.id, function (err, res) {
       if (!res) {
         logger.error("NO SUBS: User(" + msg.from.id + ") : " + msg.text);
         return bot.sendMessage(msg.chat.id, noSubs, { parse })
       }
       else if (res) {
         var subs = res.toLowerCase().split("+");
         //console.log(subs);
         var subscriptions = `<b>Your subscriptions 📢</b>\n\n`;
         var i, num = -1;
         const parse = "html";
         subs.forEach((subs) => {
           if (subs !== '') {
             try {
               subscriptions += `r‏/${subs}\n\n`;
             }
             catch (err) {
               logger.error("ERROR: " + err)
             }
             //logger.info("Subscriptions for User("+msg.from.id+") : " + subscriptions);
           }
           num++;
         }
         );
         var singleSubs = subscriptions.split("\n\n")
         console.log(singleSubs)
         const markup = bot.inlineKeyboard([
           [
             bot.inlineButton(`Unsubscribe ${num} sub(s)`, {
               callback: "callback_query_unsuball"
             })
           ],
           [
             bot.inlineButton("Browse all", {
               callback: "callback_query_browsesubs"
             })
           ]
         ]);
         return bot.sendMessage(msg.chat.id, subscriptions, { parse, markup });
       }
     });
   }
   */

  else if (/\/unsub[scribe]*[@RedditBrowserBot]* [/a-zA-Z0-9+_]*$/.test(msg.text)) {
    const parse = "Markdown";
    logger.info("User(" + msg.from.id + ") : " + msg.text);
    if (msg.text.includes("/")) {
      msg.text = msg.text.slice(1, msg.text.length);
    }
    var subs;
    var [unsubscribe, subreddit, option] = msg.text.toLowerCase().split(" ");

    client.get(msg.chat.id, function (err, res) {
      if (res) {
        subs = res.toLowerCase().split("+");
        //console.log(subs);
        var i;
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
            logger.error("NOT SUBBED: User(" + msg.from.id + ") : " + msg.text);
            return bot.sendMessage(msg.chat.id, `_ERROR: You aren't subscribed to r‏/${subreddit} 😏\nSee your_ /subscriptions.`, { parse })
          }
          else {
            client.set(msg.chat.id, subs, function (err, res) {
              if (err)
                logger.error(err)
              else
                return bot.sendMessage(msg.chat.id, `_Successfully unsubscribed from r‏/${subreddit} 👍🏼_`, { parse })
            });
          }
        }
      }
      else if (!res) {
        logger.error("ERROR: " + noSubs)
        return bot.sendMessage(msg.chat.id, noSubs, { parse })
      }
    });
  }
  //else if() {

  //}

  //core logic
  else {
    //for groups
    if (msg.text.includes("@RedditBrowserBot")) {
      if (msg.text.includes("/")) {
        msg.text = msg.text.slice(1, msg.text.length);
        logger.info("User(" + msg.from.id + ") : " + msg.text);
        var [subreddit, option] = msg.text.toLowerCase().split("@");
        var [mention, option1] = option.toLowerCase().split(" ");
        var option = option1;
        skips = 0;
        logger.info("User(" + msg.from.id + ") : " + msg.text);

        const userId = `id_${msg.chat.id}`;
        const messageId = msg.chat.id;
        //const [subreddit, option] = msg.text.toLowerCase().split(" ");
        const postNum = 0;
        updateUser(userId, subreddit, option, postNum);
        sendRedditPost(messageId, subreddit, option, postNum);
      }
    }
    else {
      //for PMs
      skips = 0;
      //logger.info("User("+msg.from.id+") : " + msg.text);

      if (msg.text.includes("/")) {
        msg.text = msg.text.slice(1, msg.text.length);

        var userId = `id_${msg.chat.id}`;
        const messageId = msg.chat.id;
        console.log(msg.chat.id)
        var postNum = 0;
        var multiLimit = 5;
        // if(msg.from.id == "15024063")
        //   multiLimit = 100;
        if (/^[a-zA-Z0-9]+ [a-zA-Z]+ [0-9]+/.test(msg.text)) {
          var i;

          //multi mode
          const [subreddit, option, numberPosts] = msg.text.toLowerCase().split(" ");
          if (numberPosts <= multiLimit) {
            for (i = 0; i < numberPosts; i++) {
              updateUser(userId, subreddit, option, postNum);
              sendRedditPost(messageId, subreddit, option, postNum);
              rands = Array(1, 2, 3, 4, 5);
              rand = rands[Math.floor(Math.random() * rands.length)];
              postNum = postNum + rand;
              console.log(postNum)
            }
          }
          else {
            logger.error("ERROR: User(" + msg.from.id + ") : " + msg.text);
            return bot.sendMessage(messageId, `_ERROR: Sorry, I can't show more than ${multiLimit} threads in Multi Mode._`, { parse });
          }
          //var numUserId = userId.replace(/[^0-9]/g,'');
        }
        else {
          //normal browsing
          const [subreddit, option] = msg.text.toLowerCase().split(" ");
          //console.log(userId+subreddit+option+postNum);
          updateUser(userId, subreddit, option, postNum);
          sendRedditPost(messageId, subreddit, option, postNum);
        }
        //console.log("main logic");
        //console.log("message info="+msg)
        //bot.sendMessage(messageId,"Multi Mode ON! [Go to Top](https://t.me/c/1155726669/"+msg.message_id+")", {parse})
        //updateUser(userId, subreddit, option, postNum);
        //sendRedditPost(messageId, subreddit, option, postNum);
      }
    }
  }
});

var userId;

bot.on("callback_query", async msg => {
  if (msg.data === "callback_query_next") {
    //console.log("test")
    console.log(msg.message.chat)
    if(msg.message.chat.type === "group" || msg.message.chat.type === "supergroup") {
      try{
        //console.log(msg.from.id)
        // console.log(!(bot.getChatMember(msg.message.chat.id,msg.from.id) in ["creator","administrator"]))
        if (!(bot.getChatMember(msg.message.chat.id,msg.from.id) in ["creator","administrator"])) {
          return bot.answerCallbackQuery(msg.id, { text: "ERROR: You need to be an admin to do this.", show_alert: true });
        }
      }
      catch(e) {
        console.log(e)
      }
    }
    const parse = "Markdown";
    userId = `id_${msg.message.chat.id}`;
    const messageId = msg.message.chat.id;
    //console.log(msg.message.chat.id)
    logger.info("User(" + msg.from.id + ") clicked next");
    let subreddit = "",
      option = "";
    let postNum = 0;
    if (db[userId] === undefined) {
      return bot.answerCallbackQuery(msg.id, { text: "ERROR: Sorry, please re-submit your previous request.", show_alert: true });
      //return;
      /*return bot.sendMessage(
        messageId,
        "_ERROR: Sorry, please re-submit your previous request._",
        { parse }
      );*/
    } else if (db[userId].hasOwnProperty("subreddit")) {
      subreddit = db[userId]["subreddit"];
    } else {
      return bot.sendMessage(
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
    //logger.info("after clicking next:"+postNum)
    sendRedditPost(messageId, subreddit, option, postNum);
    await bot.answerCallbackQuery(msg.id);
  }
});

bot.on("callback_query", async msg => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.getChatMember(msg.message.chat.id, msg.from.id);
    console.log(member)
  }*/
  //console.log("from"+msg.from.id);
  if (msg.data === "callback_query_unsuball") {
    console.log(userId + " " + msg.from.id)
    //if (!(/^-[0-9]+$/.test(msg.message.chat.id)) || (member.status == 'administrator')) {
    client.set(msg.message.chat.id, '', function (err, res) {
      if (err)
        logger.error(err)
      else {
        chatId = msg.message.chat.id;
        messageId = msg.message.message_id;
        logger.info("User(" + msg.from.id + ") unsubscribed from all subs");
        return bot.editMessageText({ chatId, messageId }, "_Successfully unsubscribed from all subscriptions 👻\nTo subscribe again, send_ \`/sub subreddit_name\`", { parseMode: 'Markdown' })
      }
    });
    //}
    //else
    //await bot.answerCallbackQuery(msg.id,'You need to be an admin to unsubscribe!')
  }
  await bot.answerCallbackQuery(msg.id);
  //}
});

bot.on("callback_query", async msg => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.getChatMember(msg.message.chat.id, msg.from.id);
    console.log(member)
  }*/
  if (msg.data === "callback_query_browsesubs") {
    //console.log("from" + msg.from.id);
    client.get(msg.from.id, function (err, reply) {
      if (reply !== "") {
        const sub = reply;
        //console.log("subreddits: "+sub)
        option = "hot";
        const userId = `id_${msg.from.id}`;
        updateUser(userId, sub, option, subPostNum);
        logger.info("User(" + msg.from.id + ") browsing all subs");
        sendRedditPost(msg.from.id, sub, option, subPostNum)
        //console.log(chat + " " + sub + " " + option + " ")
      }
    });
    //console.log("postnumber " + subPostNum)
    rands = Array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    rand = rands[Math.floor(Math.random() * rands.length)];
    subPostNum = subPostNum + 1;
    await bot.answerCallbackQuery(msg.id);
    //}
  }
});

bot.on("callback_query", async msg => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.getChatMember(msg.message.chat.id, msg.from.id);
    console.log(member)
  }*/
  //console.log("from" + msg.from.id);
  if (msg.data === "callback_query_helpfeatures") {
    chatId = msg.message.chat.id;
    messageId = msg.message.message_id;
    const message = featureList;
    const markup = bot.inlineKeyboard([
      [
        bot.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    logger.info("User(" + msg.from.id + ") saw Features");
    return bot.editMessageText({ chatId, messageId }, message, { parseMode: 'Markdown', markup })
  }
  await bot.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async msg => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.getChatMember(msg.message.chat.id, msg.from.id);
    console.log(member)
  }*/
  //console.log("from" + msg.from.id);
  if (msg.data === "callback_query_inbuiltsubs") {
    chatId = msg.message.chat.id;
    messageId = msg.message.message_id;
    const message = inbuiltSubs;
    const markup = bot.inlineKeyboard([
      [
        bot.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    logger.info("User(" + msg.from.id + ") saw Default Subs");
    return bot.editMessageText({ chatId, messageId }, message, { parseMode: 'Markdown', markup })
  }
  await bot.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async msg => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.getChatMember(msg.message.chat.id, msg.from.id);
    console.log(member)
  }*/
  //console.log("from" + msg.from.id);
  if (msg.data === "callback_query_listsubs") {
    chatId = msg.message.chat.id;
    messageId = msg.message.message_id;
    const message = listSubs;
    const markup = bot.inlineKeyboard([
      [
        bot.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    logger.info("User(" + msg.from.id + ") saw Popular Subs");
    return bot.editMessageText({ chatId, messageId }, message, { parseMode: 'Markdown', markup })
  }
  await bot.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async msg => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.getChatMember(msg.message.chat.id, msg.from.id);
    console.log(member)
  }*/
  //console.log("from" + msg.from.id);
  if (msg.data === "callback_query_emojimode") {
    chatId = msg.message.chat.id;
    messageId = msg.message.message_id;
    const message = emojiMode;
    const markup = bot.inlineKeyboard([
      [
        bot.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    logger.info("User(" + msg.from.id + ") saw Emoji Mode");
    return bot.editMessageText({ chatId, messageId }, message, { parseMode: 'Markdown', markup })
  }
  await bot.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async msg => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.getChatMember(msg.message.chat.id, msg.from.id);
    console.log(member)
  }*/
  //console.log("from" + msg.from.id);
  if (msg.data === "callback_query_multimode") {
    chatId = msg.message.chat.id;
    messageId = msg.message.message_id;
    const message = multiMode;
    const markup = bot.inlineKeyboard([
      [
        bot.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    logger.info("User(" + msg.from.id + ") saw Multi Mode");
    return bot.editMessageText({ chatId, messageId }, message, { parseMode: 'Markdown', markup })
  }
  await bot.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async msg => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.getChatMember(msg.message.chat.id, msg.from.id);
    console.log(member)
  }*/
  //console.log("from" + msg.from.id);
  if (msg.data === "callback_query_sortoptions") {
    chatId = msg.message.chat.id;
    messageId = msg.message.message_id;
    const message = sortOptions;
    const markup = bot.inlineKeyboard([
      [
        bot.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    logger.info("User(" + msg.from.id + ") saw Sort Options ");
    return bot.editMessageText({ chatId, messageId }, message, { parseMode: 'Markdown', markup })
  }
  await bot.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async msg => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.getChatMember(msg.message.chat.id, msg.from.id);
    console.log(member)
  }*/
  //console.log("from" + msg.from.id);
  if (msg.data === "callback_query_helpsubs") {
    chatId = msg.message.chat.id;
    messageId = msg.message.message_id;
    const message = subscriptions;
    const markup = bot.inlineKeyboard([
      [
        bot.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    logger.info("User(" + msg.from.id + ") saw Subscriptions help");
    return bot.editMessageText({ chatId, messageId }, message, { parseMode: 'Markdown', markup })
  }
  await bot.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async msg => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.getChatMember(msg.message.chat.id, msg.from.id);
    console.log(member)
  }*/
  //console.log("from" + msg.from.id);
  if (msg.data === "callback_query_importsubs") {
    chatId = msg.message.chat.id;
    messageId = msg.message.message_id;
    const message = importSubs;
    const markup = bot.inlineKeyboard([
      [
        bot.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    logger.info("User(" + msg.from.id + ") saw Import Subreddits");
    return bot.editMessageText({ chatId, messageId }, message, { parseMode: 'Markdown', markup })
  }
  await bot.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async msg => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.getChatMember(msg.message.chat.id, msg.from.id);
    console.log(member)
  }*/
  //console.log("from" + msg.from.id);
  if (msg.data === "callback_query_faq") {
    chatId = msg.message.chat.id;
    messageId = msg.message.message_id;
    const message = faq;
    const markup = bot.inlineKeyboard([
      [
        bot.inlineButton("◀️ Back", { callback: "callback_query_back" })
      ]
    ]);
    logger.info("User(" + msg.from.id + ") saw FAQs");
    return bot.editMessageText({ chatId, messageId }, message, { parseMode: 'HTML', markup, webPreview: false })
  }
  await bot.answerCallbackQuery(msg.id);
});

bot.on("callback_query", async msg => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.getChatMember(msg.message.chat.id, msg.from.id);
    console.log(member)
  }*/
  //console.log("from" + msg.from.id);
  if (msg.data === "callback_query_back") {
    chatId = msg.message.chat.id;
    messageId = msg.message.message_id;
    const message = helpMessage;
    const markup = bot.inlineKeyboard([
      [
        bot.inlineButton("💫 Features", { callback: "callback_query_helpfeatures" }),

        bot.inlineButton("📢 Subscriptions", { callback: "callback_query_helpsubs" }),

        bot.inlineButton("*️⃣ Default Subs", { callback: "callback_query_inbuiltsubs" })
      ],
      [
        bot.inlineButton("💣 Popular Subs", { callback: "callback_query_listsubs" }),

        bot.inlineButton("😎 Emoji Mode", { callback: "callback_query_emojimode" }),

        bot.inlineButton("Ⓜ️ Multi Mode", { callback: "callback_query_multimode" })

      ],
      [
        bot.inlineButton("⬇️ Import Subreddits", { callback: "callback_query_importsubs" }),

        bot.inlineButton("🤔 FAQs", { callback: "callback_query_faq" })
      ]
    ]);
    return bot.editMessageText({ chatId, messageId }, message, { parseMode: 'Markdown', markup })
  }
  await bot.answerCallbackQuery(msg.id);
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


//for posting subscriptions
var subPostNum = 0;
setInterval(function () {
  //var chat;
  client
    .multi()
    .keys("*")
    .exec(function (err, replies) {
      replies.forEach(function (reply, index) {
        var chats = reply.toString().split(",")
        chats.forEach(function (chat) {
          //this is NOT for testing subscriptions on myself
          if (chat !== "15024063") {
            client.get(chat, function (err, reply) {
              if (reply !== "") {
                const sub = reply;
                option = "hot";
                const userId = `id_${chat}`;
                updateUser(userId, sub, option, subPostNum);
                sleep(200).then(() => {
                  try {
                    sendRedditPost(chat, sub, option, subPostNum);
                  }
                  catch (err) {
                    logger.error(err);
                  }
                });
                logger.info("Posted to " + chat + "from " + sub + " subreddit ")
              }
            });
          }
        });
      });
    });
  //console.log("postnumber " + subPostNum)
  rands = Array(1, 2, 3, 4, 5, 6, 7, 8);
  rand = rands[Math.floor(Math.random() * rands.length)];
  subPostNum = subPostNum + rand;
  //console.log(chats)
}, 10800 * 1000)

//for Suhasa
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
          if (chat === "15024063") {
            client.get(chat, function (err, reply) {
              if (reply !== "") {
                const sub = reply;
                option = "hot";
                const userId = `id_${chat}`;
                updateUser(userId, sub, option, subPostNum);
                sleep(200).then(() => {
                  try {
                    sendRedditPost(chat, sub, option, subPostNum);
                  }
                  catch (err) {
                    if (err.description?.includes("bot was") || err.description?.includes("user is deactivated") || err.description?.includes("chat not found")) {
                      logger.info(`user ${messageId}'s subscriptions were cleared`)
                      client.del(msg.chat.id)
                    }
                    logger.error(err)
                  }
                })
                logger.info("Posted to " + chat + "from " + sub + " subreddit ")
              }
            });
          }
        });
      });
    });
  //console.log("postnumber " + subPostNum)
  rands = Array(1, 2, 3);
  rand = rands[Math.floor(Math.random() * rands.length)];
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
                logger.info("Posted to "+ chat + "from " + sub + " subreddit ")
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

bot.on("inlineQuery", msg => {
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
        //logger.info(postNum)
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
          //logger.info(postNum)
        }

        //if(redditPost.stickied === true)
        //bot.click()
        redditPost.title = redditPost.title.replace(/&amp;/g, "&");
        const answers = redditPost.title
        //return redditPost.title
        console.log("results:  "+redditPost.title)
        return bot.answerInlineQuery(msg.id,answers);
        }
    }
  );
  
});*/

bot.start();
