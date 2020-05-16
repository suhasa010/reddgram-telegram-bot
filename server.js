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
}, 290000);

//var logger = require('logger').createLogger(); // logs to STDOUT
var logger = require("logger").createLogger("development.log"); // logs to a file
let options = {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata', timeZoneName: 'short'}
logger.format = function(level, date, message) { return [level, ' [', new Date().toLocaleString("en-IN", options), '] ', message].join(''); }; 

//reddit browser
const Telegraf = require("telegraf")
const { Extra, Markup } = Telegraf;
const session = require("telegraf/session");

const TeleBot = require("telebot");
const fs = require("fs");
const request = require("request");

const bot = new TeleBot(process.env.BOT_TOKEN);
//const parse = "Markdown"
var prettytime = require("prettytime");

let db = {};
let rLimit = 50;

function updateUser(userId, subreddit, option, postNum) {
  db[userId] = { subreddit, option, postNum };
}

function sendRedditPost(messageId, subreddit, option, postNum) {
  const options = getOptions(option, rLimit);
  var start = new Date();
  request(
    { url: `http://www.reddit.com/r/${subreddit}/${options}`, json: true },
    function(error, response, body) {
      // check if response was successful
      if (!error && response.statusCode === 200) {
        // send error message if the bot encountered one
        if (body.hasOwnProperty("error") || body.data.children.length < 1) {
          return sendErrorMsg(messageId);
        } else if (body.data.children.length - 1 < postNum) {
          return noMorePosts(messageId);
        }

        // reddit post data
        let redditPost = body.data.children[postNum].data;
        redditPost.title = redditPost.title.replace(/&amp;/g, "&");
        // inline buttons
        const markup = bot.inlineKeyboard([
          [
            //bot.inlineButton('🔗 Reddit', { url: `https://www.reddit.com${redditPost.permalink}` }),
            bot.inlineButton("💬 Comments", {
              url: `https://www.reddit.com${redditPost.permalink}`
            }),
            bot.inlineButton("⏩ Next", { callback: "callback_query_next" })
          ]
        ]);

        // if post is an image or if it's a gif or a link
        if (
          /\.(jpe?g|png)$/.test(redditPost.url) ||
          redditPost.domain === "i.reddituploads.com" ||
          redditPost.domain === "i.redd.it" ||
          redditPost.domain === "imgur.com" ||
          redditPost.domain === "preview.reddit.com"
        ) {
          // sendPlsWait(messageId);
          logger.info("request: image post");
          return sendImagePost(messageId, redditPost, markup);
        }
        //gif
        else if (
          redditPost.preview &&
          redditPost.preview.images[0].variants.mp4
        ) {
          // sendPlsWait(messageId);
          logger.info("request: gif post");
          sendGifPost(messageId, redditPost, markup);
        }
        //video
        else if (
          redditPost.domain === "youtu.be" ||
          redditPost.domain === "youtube.com" ||
          redditPost.domain === "v.redd.it" ||
          redditPost.domain === ".redd.it" ||
          redditPost.domain === "gfycat.com"
        ) {
          logger.info("request: video/gif post");
          return sendVideoPost(messageId, redditPost, markup);
        }
        //link
        else if (/http(s)?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi.test(redditPost.url) && !redditPost.selftext) {
          logger.info("request: link post");
          return sendLinkPost(messageId, redditPost, markup);
        }
        //text
        else {
          logger.info("request: text post");
          return sendMessagePost(messageId, redditPost, markup);
        }

        // unsuccessful response
      } else {
        return sendErrorMsg(messageId);
      }
    }
  );
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

function sendErrorMsg(messageId) {
  const errorMsg = `ERROR: Couldn't find the subreddit. Use /help for instructions.`;
  logger.error(errorMsg);
  return bot.sendMessage(messageId, errorMsg);
}

function sendLimitMsg(messageId) {
  const errorMsg = `ERROR: Sorry, we can't show more than ${rLimit} posts for one option. Please change your subreddit or option. 
Use /help for instructions.`;
  logger.error(errorMsg);
  return bot.sendMessage(messageId, errorMsg);
}

function selfTextLimitExceeded(messageId) {
  const errorMsg = `ERROR: Sorry, The content of this post is too long to be displayed here. Please click on Comments button or Next button to try and load the next post....`;
  logger.error(errorMsg);
  return errorMsg;
}

function noMorePosts(messageId) {
  const errorMsg = `No more posts. Use /help for instructions`;
  logger.error(errorMsg);
  return bot.sendMessage(messageId, errorMsg);
}

/*function sendPlsWait(messageId) {
    const message = `Please wait...`;
    return bot.sendMessage(messageId, message);
}*/

function sendImagePost(messageId, redditPost, markup) {
  let url = redditPost.url;
  url = url.replace(/&amp;/g, "&");
  //post time
  var timeago = prettytime(redditPost.created_utc * 1000 - Date.now(), {
    short: true,
    decimals: 0
  });
  timeago = timeago.replace(/\s/g, "");
  const caption = `🔖 ${redditPost.title}\n\n${url}\n\n⬆️ ${redditPost.score} votes\n💬 ${redditPost.num_comments} comments\n✏️ Posted ${timeago} ago by u/${redditPost.author} in r/${redditPost.subreddit}`;
  //logger.info(messageId+" "+url+" "+caption+" "+markup)
  //fix for memes topy not working, sendMessage with url instead of sendPhoto which was crashing because of a 8.7mb image in "memes topy"
  return bot.sendMessage(messageId, caption, { markup });
  // prev code line was return bot.sendPhoto(messageId, url, {caption, markup});
}

function sendLinkPost(messageId, redditPost, markup) {
  let url = redditPost.url;
  url = url.replace(/&amp;/g, "&");
  //post time
  var timeago = prettytime(redditPost.created_utc * 1000 - Date.now(), {
    short: true,
    decimals: 0
  });
  timeago = timeago.replace(/\s/g, "");
  const message = `🔖 ${redditPost.title}\n\n${url}\n\n⬆️ ${redditPost.score} votes\n💬 ${redditPost.num_comments} comments\n✏️ Posted ${timeago} ago by u/${redditPost.author} in r/${redditPost.subreddit}`;
  return bot.sendMessage(messageId, message, { markup });
}

function sendGifPost(messageId, redditPost, markup) {
  //let url = redditPost.url;
  //url = url.replace(/&amp;/g, '&');
  let gifArr = redditPost.preview.images[0].variants.mp4.resolutions;
  let gif = gifArr[gifArr.length - 1].url;
  gif = gif.replace(/&amp;/g, "&");
  //post time
  var timeago = prettytime(redditPost.created_utc * 1000 - Date.now(), {
    short: true,
    decimals: 0
  });
  timeago = timeago.replace(/\s/g, "");
  const caption = `🔖 ${redditPost.title}\n\n⬆️ ${redditPost.score} votes\n💬 ${redditPost.num_comments} comments\n✏️ Posted ${timeago} ago by u/${redditPost.author} in r/${redditPost.subreddit}`;
  return bot.sendVideo(messageId, gif, { caption, markup });
}

function sendVideoPost(messageId, redditPost, markup) {
  let url = redditPost.url;
  url = url.replace(/&amp;/g, "&");
  //let boldtitle = redditPost.title
  //post time
  var timeago = prettytime(redditPost.created_utc * 1000 - Date.now(), {
    short: true,
    decimals: 0
  });
  timeago = timeago.replace(/\s/g, "");
  const message = `🔖 ${redditPost.title}\n\n${url}\n\n⬆️ ${redditPost.score} votes\n💬 ${redditPost.num_comments} comments\n✏️ Posted ${timeago} ago by u/${redditPost.author} in r/${redditPost.subreddit}`;
  return bot.sendMessage(messageId, message, { markup });
}

function sendMessagePost(messageId, redditPost, markup) {
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

  if (redditPost.selftext.length > 4096) {
    const message =
      `🔖 ${redditPost.title}\n\n📝` +
      selfTextLimitExceeded(messageId) +
      `\n\n⬆️ ${redditPost.score} votes\n💬 ${redditPost.num_comments} comments\n✏️ Posted ${timeago} ago by u/${redditPost.author} in r/${redditPost.subreddit}`;
    return bot.sendMessage(messageId, message, { markup });
  }
  const message = `🔖 ${redditPost.title}\n\n📝 ${redditPost.selftext}\n\n⬆️ ${redditPost.score} votes\n💬 ${redditPost.num_comments} comments\n✏️ Posted ${timeago} ago by u/${redditPost.author} in r/${redditPost.subreddit}`;
  //\n\n${url}
  return bot.sendMessage(messageId, message, { markup });
}

/*bot.start(ctx => {
    ctx.reply(
      "test"
    )
  })
*/

bot.on("text", msg => {
  const parse = "Markdown";
  //start/help menu
  if (msg.text === "/start" || msg.text === "/help" || msg.text === "/help@RedditBrowserBot" || msg.text === "/start@RedditBrowserBot") {
    const message = `*Welcome to Reddgram Bot*

Browse all of reddit's pics, gifs, videos, cats, memes, news and much more right here from Telegram!

Enter a subreddit name with an option or send /list for most popular subreddits:

1. _(default)_ *hot* - Hot posts from past day 
2. *top* - Top posts from past day
3. *topw* - Top posts from past week
4. *topm* - Top posts from past month
5. *topy* - Top posts from past year
6. *all* - Top posts of all time
7. *new* - Latest posts
8. _(newly added)_ *toph* - Top posts from past hour

Examples:
1. If you want to get top posts of *r/aww*, Enter: 
                \`aww top\`
Default option is *hot*, so *aww* will return hot posts of *r/aww* from past day

2. You can also browse *random* subreddit  or  *all*. just send \`random top\` or \`all all\`

Please report any bugs/feature requests here - https://bit.ly/2Z7gA7k`;
  logger.info(
    msg.from.first_name + "(" + msg.from.username + ")" + ": " + msg.text
  );  
  return bot.sendMessage(msg.from.id, message, { parse });
  }

  //list of popular subreddits
  else if (msg.text === "/list") {
    const message = `Here is a list of most popular subreddits on Reddit, click on any of these links to browse *hot* posts:
  (and of course you can customize the option to get any of these /options. eg. \`/aww all\` fetches all time popular posts of r/aww)
  
  💡Tip for mobile users: Touch and hold on any of the links to be able to edit and send with an option  
  
  1. /aww

  2. /cats
  
  3. /gifs
  
  4. /pics
  
  5. /videos
  
  6. /news
  
  7. /coronavirus
  
  8. /worldnews
  
  9. /todayilearned
  
  10. /random
  
  11. /memes
  
  12. /science
  
  13. /technology
  
  14. /books
  
  15. /tifu
  
  16. /android
  
  17. /adviceanimals
  
  18. /oldschoolcool
  
  19. /showerthoughts 
  
  20. /mildlyinteresting
  
  21. /interestingasfuck
  
  22. /askreddit
  
  23. /askscience
  
  24. /explainlikeimfive
  
  25. /earthporn
  
  26. /jokes
  
  27. /television
  
  28. /sports
  
  29. /movies
  
  30. /lifeprotips
  
  31. /internetisbeautiful
  
  32. /dataisbeautiful
  
  33. /music
  `;
    logger.info(
    msg.from.first_name + "(" + msg.from.username + ")" + ": " + msg.text
    );
    return bot.sendMessage(msg.from.id, message, {parse});  
  }
  //options
  else if (msg.text === "/options") {
    const message = `*Options:*

1. _(default)_ *hot* - Hot posts from past day 
2. *top* - Top posts from past day
3. *topw* - Top posts from past week
4. *topm* - Top posts from past month
5. *topy* - Top posts from past year
6. *all* - Top posts of all time
7. *new* - Latest posts
8. _(newly added)_ *toph* - Top posts from past hour
    `;
    logger.info(
      msg.from.first_name + "(" + msg.from.username + ")" + ": " + msg.text
      );
      return bot.sendMessage(msg.from.id, message, {parse});  
  } 
  //core logic
  else {
    logger.info(
      msg.from.first_name + "(" + msg.from.username + ")" + ": " + msg.text
    );
    if(msg.text.includes('/')) {
      msg.text = msg.text.slice(1,msg.text.length);  
    }
    const userId = `id_${msg.from.id}`;
    const messageId = msg.from.id;
    const [subreddit, option] = msg.text.toLowerCase().split(" ");
    const postNum = 0;
    updateUser(userId, subreddit, option, postNum);
    sendRedditPost(messageId, subreddit, option, postNum);
  }
});

bot.on("callbackQuery", msg => {
  if (msg.data === "callback_query_next") {
    const userId = `id_${msg.from.id}`;
    const messageId = msg.from.id;
    logger.info(
      msg.from.first_name + "(" + msg.from.username + ") clicked next"
    );
    let subreddit = "",
      option = "";
    let postNum = 0;

    if (db[userId].hasOwnProperty("subreddit")) {
      subreddit = db[userId]["subreddit"];
    } else {
      return bot.sendMessage(
        messageId,
        "Sorry, please send the subreddit name with option again"
      );
    }

    if (db[userId]["option"]) {
      option = db[userId]["option"];
    } else { //default sort = hot
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
    sendRedditPost(messageId, subreddit, option, postNum);
  }
});

bot.connect();
