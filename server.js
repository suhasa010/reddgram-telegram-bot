//import sqlite3 from 'sqlite3'
//import { open } from 'sqlite'
//Don't sleep
const help = require('./help.js');
const http = require("http");
const express = require("express");
require('dotenv').config();

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
 
client.on("error", function(error) {
  console.error(error);
});

//client.get("15024063",redis.print);

/*
client.set("key", "value", redis.print);
client.get("key", redis.print);
client.set("foo", "bar");
client.get("foo", redis.print);
*/
//var logger = require('logger').createLogger(); // logs to STDOUT
var logger = require("logger").createLogger("/home/pi/reddgram-telegram-bot/development.log"); // logs to a file

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
logger.format = function(level, date, message) {
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

const TeleBot = require("telebot");
const fs = require("fs");
const request = require("request");
const BOT_TOKEN = process.env.BOT_TOKEN;

var bot = new TeleBot(BOT_TOKEN);
var prettytime = require("prettytime");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");


let db = {};
let rLimit = 200;
var skips = 0; //keep track of no. of sticky threads skipped

function updateUser(userId, subreddit, option, postNum) {
  db[userId] = { subreddit, option, postNum };
}



function sendRedditPost(messageId, subreddit, option, postNum) {
  const options = getOptions(option, rLimit);
  var start = new Date();
  request(
    { url: `http://www.reddit.com/r/${subreddit}/${options}`, json: true },
    function(error, response, body) {
      console.log(error)
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
          // sendPlsWait(messageId);
          //bot.sendChatAction(messageId, "upload_photo");
          return sendImagePost(messageId, redditPost, markup);
        }
        //gif
        else if (
          redditPost.preview &&
          redditPost.preview.images[0].variants.mp4
        ) {
          //bot.sendChatAction(messageId, "upload_video");
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
        return sendErrorMsg(messageId);
      }
    }
  );
  //logger.info("http request completed")
}

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

function sendErrorMsg(messageId) {
  const errorMsg = `<i>ERROR: Couldn't find the subreddit. Use /help for instructions.</i>`;
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
⬆️ <b>${points} points</b> (${upvote_ratio}% upvoted) • 💬 ${redditPost.num_comments} comments
✏️ Posted ${timeago} ago in r‏/${redditPost.subreddit} by u/${redditPost.author}`;

  logger.info("Request completed: image/gif thread");
  //nsfw indicator
  if (redditPost.over_18 === true) caption = "🔞" + caption;
  logger.info("about to send the post to telegram")
  //fix for memes topy not working, sendMessage with url instead of sendPhoto which was crashing because of a 8.7mb image in "memes topy"
  return bot.sendMessage(messageId, caption, { parse, markup });
  // prev code line was return bot.sendPhoto(messageId, url, {caption, markup});
}

function sendLinkPost(messageId, redditPost, markup) {
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
  var message = `🔖 <a href="${url}">${redditPost.title}</a> <b>(${
    websitename[0]
  })</b>\n
⬆️ <b>${points} points</b> (${upvote_ratio}% upvoted) • 💬 ${
    redditPost.num_comments
  } comments
✏️ Posted ${timeago} ago in r‏/${redditPost.subreddit} by u/${
    redditPost.author
  }`;
  //<a href="${url}">[Link]</a>
  logger.info("Request completed: link thread");
  //nsfw indicator
  if (redditPost.over_18 === true) message = "🔞" + message;
  return bot.sendMessage(messageId, message, { parse, markup });
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
⬆️ <b>${points} points</b> (${upvote_ratio}% upvoted) • 💬 ${redditPost.num_comments} comments
✏️ Posted ${timeago} ago in r‏/${redditPost.subreddit} by u/${redditPost.author}`;
  logger.info("Request completed: gif thread");
  //nsfw indicator
  if (redditPost.over_18 === true) caption = "🔞" + caption;
  return bot.sendVideo(messageId, gif, { parse, caption, markup });
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
⬆️ <b>${points} points</b> (${upvote_ratio}% upvoted) • 💬 ${redditPost.num_comments} comments
✏️ Posted ${timeago} ago in r‏/${redditPost.subreddit} by u/${redditPost.author}`;
  logger.info("Request completed: video/gif thread");
  //nsfw indicator
  if (redditPost.over_18 === true) message = "🔞" + message;

  return bot.sendMessage(messageId, message, { parse, markup });
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

  //
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
    return sendErrorMsg(messageId);
  }
  var upvote_ratio = (redditPost.upvote_ratio * 100).toFixed(0);
  //if selftext exceeds limit
  if (redditPost.selftext.length > 3700) {
    if (redditPost.score >= 1000)
      var points = (redditPost.score / 1000).toFixed(1) + "k";
    else var points = redditPost.score;
    const preview = redditPost.selftext.slice(0, 3500);
    var message =
      `🔖 <b>${redditPost.title}</b>\n\n📝` +
      preview +
      selfTextLimitExceeded(messageId) +
      `\n\n⬆️ <b>${points} points</b> (${upvote_ratio}% upvoted) • 💬 ${redditPost.num_comments} comments
✏️ Posted ${timeago} ago in r‏/${redditPost.subreddit} by u/${redditPost.author}`;
    logger.info("Request completed: long text thread");
    //nsfw indicator
    if (redditPost.over_18 === true) message = "🔞" + message;
    logger.info("Request completed: text thread");
    return bot.sendMessage(messageId, message, { parse, markup });
  }

  if (redditPost.score >= 1000)
    var points = (redditPost.score / 1000).toFixed(1) + "k";
  else var points = redditPost.score;

  var message = `🔖 <b>${redditPost.title}</b>\n
📝 ${redditPost.selftext}\n
⬆️ <b>${points} points</b> (${upvote_ratio}% upvoted) • 💬 ${redditPost.num_comments} comments
✏️ Posted ${timeago} ago in r‏/${redditPost.subreddit} by u/${redditPost.author}`;
  //\n\n${url}

  //nsfw indicator
  if (redditPost.over_18 === true) message = "🔞" + message;
  logger.info("Request completed: text thread");

  return bot.sendMessage(messageId, message, { parse, markup });
}

/*bot.start(ctx => {
    ctx.reply(
      "test"
    )
  })
*/

bot.on("text", msg => {
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
    msg.text = "/memes+jokes+funny+humor+programmerhumor+dadjokes+punny";

  if (msg.text === "🧐" || msg.text === "👀" || msg.text === "👁")
    msg.text =
      "/pics+gifs+videos+educationalgifs+wholesomegifs+reactiongifs+perfectloops+photoshopbattles+historyporn+spaceporn+comics";
  if (msg.text === "🚿") msg.text = "/showerthoughts";
  if (msg.text === "😍")
    msg.text = "/aww+cats+dogs+animalsbeingderps+animalsbeingjerks";
  if (msg.text === "🐈") msg.text = "/cats";
  if (msg.text === "🦮") msg.text = "/dogs";
  if (msg.text === "🎬") msg.text = "/movies+television+anime";
  if (msg.text === "🦠") msg.text = "/coronavirus";
  if (msg.text === "🤔")
    msg.text =
      "/todayilearned+youshouldknow+outoftheloop+wikipedia+howto+iwanttolearn+learnuselesstalents+diy";
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
  //middle finger emoji
  if (msg.text.includes("🖕") || msg.text === "🍑")
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
    logger.info("User(" + msg.from.username + "): " + msg.text);
    return bot.sendMessage(msg.chat.id, message, { parse });
  }

  //list of popular subreddits
  else if (msg.text === "/list" || msg.text === "/list@RedditBrowserBot") {
    skips = 0;
    const message = listSubs;
    logger.info("User: " + msg.text);
    return bot.sendMessage(msg.chat.id, message, { parse });
  }
  //emoji mode
  else if (msg.text === "/emoji" || msg.text === "/emoji@RedditBrowserBot") {
    skips = 0;
    const message = emojiMode;
    logger.info("User: " + msg.text);
    return bot.sendMessage(msg.chat.id, message, { parse });
  }

  //options
  else if (
    msg.text === "/options" ||
    msg.text === "/options@RedditBrowserBot"
  ) {
    skips = 0;
    const message = sortOptions;
    logger.info("User: " + msg.text);
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
        })
      ]
    ]);
    skips = 0;
    const message = contactDev;
    logger.info("User: " + msg.text);
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
    return bot.sendMessage(msg.chat.id, "https://telegra.ph/Tutorial-How-to-import-your-existing-subreddits-on-redditcom-to-Reddgram-bot-on-Telegram-10-04");
  }
  else if (/\/sub[scribe]*[@RedditBrowserBot]* [a-zA-Z0-9+_]*$/.test(msg.text) || /\/import[@RedditBrowserBot]* [https://old.reddit.com/r/]+[a-zA-Z0-9_+]+$/.test(msg.text)) {
    if (/\/import [https://old.reddit.com/r/]+[a-zA-Z0-9_+]+$/.test(msg.text)) {
      var subreddit = msg.text.slice(33, msg.text.length);
      console.log(subreddit)
      bot.sendMessage(msg.chat.id, "Successfully imported subreddits from Reddit 🥳\nSee those here - /subscriptions")
    }
    else {
      const parse = "Markdown";
      //if (msg.text.includes("/")) {
      msg.text = msg.text.slice(1, msg.text.length);
      console.log("after slice: " + msg.text)
      //}
      logger.info("User(" + msg.from.username + "): " + msg.text);
      var [subscribe, subreddit, option] = msg.text.toLowerCase().split(" ");
      console.log("sub = " + subreddit)
    }
    client.get(msg.chat.id, function (err, res) {
      if (res.includes(subreddit)) {
        return bot.sendMessage(msg.chat.id, `Duh! You are already subscribed to r‏/${subreddit} 😏\nCheck /subscriptions maybe?`, { parse })
      }
      else {
        client.APPEND(msg.chat.id, `${subreddit}+`, function (err, res) {
          return bot.sendMessage(msg.chat.id, `Yay! Successfully subscribed to r‏/${subreddit} 🥳\nSee it here - /subscriptions`, { parse })
        });
      }
    });

  }
  else if (msg.text.includes('/subscriptions')) {
    const parse = "Markdown";
    if (msg.text.includes("/")) {
      msg.text = msg.text.slice(1, msg.text.length);
    }
    logger.info("User(" + msg.from.username + "): " + msg.text);
    //userId = msg.from.id;
    client.get(msg.chat.id, function (err, res) {
      if (!res) {
        console.log(err)
        return bot.sendMessage(msg.chat.id, noSubs , {parse})
      }
      else if (res) {
        var subs = res.toLowerCase().split("+");
        console.log(subs);
        var subscriptions = `<b>Your subscriptions 📢</b>\n\n`;
        var i,num = -1 ;
        const parse = "html";
        subs.forEach( (subs) => {
            if (subs !== '') {
              try {
                subscriptions += `r‏/${subs}\n\n`;
              }
              catch(err) {
                console.log(err)
              }
              console.log(subscriptions);
            }
            num++;
          }
        );
        const markup = bot.inlineKeyboard([
          [
            bot.inlineButton(`Unsubscribe ${num} sub(s)`, {
              callback: "callback_query_unsuball"
            })
          ]
        ]);
        return bot.sendMessage(msg.chat.id, subscriptions, {parse, markup});
      }
    });
  }
  else if (/\/unsub[scribe]*[@RedditBrowserBot]* [a-zA-Z0-9+_]*$/.test(msg.text))  {
    const parse = "Markdown"
    if (msg.text.includes("/")) {
      msg.text = msg.text.slice(1, msg.text.length);
    }
    var subs;
    logger.info("User(" + msg.from.username + "): " + msg.text);
    var [unsubscribe, subreddit, option] = msg.text.toLowerCase().split(" ");

    client.get(msg.chat.id, function (err, res) {
      console.log(res)
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
          client.set(msg.chat.id, subs, function (err, res) {
            if(err)
              logger.error(err)
            //if(!subs.text.includes(subreddit))
            //  return bot.sendMessage(msg.chat.id, "You haven't subscribed to that subreddit yet. use /subscribe <subreddit_name> to subscribe.")
            else //if (subs)
              return bot.sendMessage(msg.chat.id, `Successfully unsubscribed from r‏/${subreddit} 👍🏼`)
            });
        }
      }
      else if(!(res.includes(subreddit)))
      {
        return bot.sendMessage(msg.chat.id, `You aren't subscribed to r‏/${subreddit} 😏\nSee your /subscriptions.`, {parse})
      }
      else if (!res) {
        console.log(err)
        return bot.sendMessage(msg.chat.id, noSubs, {parse})
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
        logger.info("User(" + msg.from.username + "): " + msg.text);
        var [subreddit, option] = msg.text.toLowerCase().split("@");
        var [mention, option1] = option.toLowerCase().split(" ");
        var option = option1;
        skips = 0;
        logger.info("User(" + msg.from.username + "): " + msg.text);

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
      logger.info("User(" + msg.from.username + "): " + msg.text);

      if (msg.text.includes("/")) {
        msg.text = msg.text.slice(1, msg.text.length);

        var userId = `id_${msg.chat.id}`;
        const messageId = msg.chat.id;
        var postNum = 0;
        const multiLimit = 5;
        if (/^[a-zA-Z0-9]+ [a-zA-Z]+ [0-9]+/.test(msg.text)) {
          var i;

          //multi mode
          const [subreddit, option, numberPosts] = msg.text.toLowerCase().split(" ");
          if (numberPosts <= multiLimit) {
            for (i = 0; i < numberPosts; i++) {
              updateUser(userId, subreddit, option, postNum);
              sendRedditPost(messageId, subreddit, option, postNum);
              postNum = postNum + 1;
            }
          }
          else {
            return bot.sendMessage(messageId, `_ERROR: Sorry, we can't show more than ${multiLimit} threads in Multi Mode._`, { parse });
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

bot.on("callbackQuery", async msg => {
  if (msg.data === "callback_query_next") {
    //console.log("test")
    const parse = "Markdown";
    userId = `id_${msg.message.chat.id}`;
    const messageId = msg.message.chat.id;
    //console.log(msg.message.chat.id)
    logger.info("User: clicked next");
    let subreddit = "",
      option = "";
    let postNum = 0;
    if (db[userId] === undefined) {
      await bot.answerCallbackQuery(msg.id);
      return bot.sendMessage(
        messageId,
        "_ERROR: Sorry, please re-submit your previous request._",
        { parse }
      );
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
      postNum++;
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

bot.on("callbackQuery", async msg => {
  /*if (/^-[0-9]+$/.test(msg.message.chat.id)) {
    var member = bot.getChatMember(msg.message.chat.id, msg.from.id);
    console.log(member)
  }*/
  console.log("from"+msg.from.id);
  if (msg.data === "callback_query_unsuball") {
    console.log(userId + " " + msg.from.id)
    //if (!(/^-[0-9]+$/.test(msg.message.chat.id)) || (member.status == 'administrator')) {
      client.set(msg.message.chat.id, '', function (err, res) {
        if (err)
          logger.error(err)
        else {
          chatId = msg.message.chat.id;
          messageId = msg.message.message_id;
          console.log(" " + msg.from.id + " " + chatId + " " + messageId)
          return bot.editMessageText({ chatId, messageId }, "Successfully unsubscribed from all subscriptions 👻\nTo subscribe again, send \`/sub subreddit_name\`", { parseMode: 'Markdown' })
        }
      });
    //}
    //else
      //await bot.answerCallbackQuery(msg.id,'You need to be an admin to unsubscribe!')
  }
  await bot.answerCallbackQuery(msg.id);
  //}
});

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
          //this is for testing subscriptions on myself
          //if (chat === "15024063")
          {
            client.get(chat, function (err, reply) {
              if (reply !== "") {
                const sub = reply;
                option = "hot";
                const userId = `id_${chat}`;
                updateUser(userId, sub, option, subPostNum);
                sendRedditPost(chat, sub, option, subPostNum)
                console.log(chat + " " + sub + " " + option + " ")
              }
            });
          }
        });
      });
    });
  console.log("postnumber " + subPostNum)
  subPostNum = subPostNum + 1;
  //console.log(chats)
}, 7200 * 1000)

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
                sendRedditPost(chat, sub, option, subPostNum)
                console.log(chat + " " + sub + " " + option + " ")
              }
            });
          }
        });
      });
    });
  console.log("postnumber " + subPostNum)
  subPostNum = subPostNum + 1;
  //console.log(chats)
}, 600 * 1000)

//reset hot Posts traversing index to 0 after 12 hours
setInterval( function() {
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
