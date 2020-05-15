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
var logger = require('logger').createLogger('development.log'); // logs to a file

//reddit browser
const TeleBot = require('telebot');
const fs = require('fs');
const request = require('request');
const bot = new TeleBot(process.env.BOT_TOKEN);
//const parse = "Markdown"
var prettytime = require ('prettytime')

let db = {};
let rLimit = 50;

function updateUser(userId, subreddit, option, postNum) {
    db[userId] = {subreddit, option, postNum};
}

function sendRedditPost(messageId, subreddit, option, postNum) {
    const options = getOptions(option, rLimit);
    var start = new Date();
    request({ url: `http://www.reddit.com/r/${subreddit}/${options}`, json: true }, function (error, response, body) {
        
        // check if response was successful
        if (!error && response.statusCode === 200) {   
            
            // send error message if the bot encountered one
            if (body.hasOwnProperty('error') || body.data.children.length < 1) {
                return sendErrorMsg(messageId);
            } else if (body.data.children.length - 1 < postNum) {
                return noMorePosts(messageId);
            }
            
            // reddit post data
            let redditPost = body.data.children[postNum].data;
            redditPost.title = redditPost.title.replace(/&amp;/g, '&');
            // inline buttons
            const markup = bot.inlineKeyboard([
                [
                    //bot.inlineButton('🔗 Reddit', { url: `https://www.reddit.com${redditPost.permalink}` }),
                    bot.inlineButton('⏩ Next', { callback: 'callback_query_next' }),
                    bot.inlineButton('💬 Comments', { url: `https://www.reddit.com${redditPost.permalink}`})
                ]
            ]);

            // if post is an image or if it's a gif or a link
            if (/\.(jpe?g|png)$/.test(redditPost.url) || 
                redditPost.domain === 'i.reddituploads.com' || 
                redditPost.domain === 'i.redd.it' ||
                redditPost.domain === 'imgur.com' ||
                redditPost.domain === 'preview.reddit.com'
                ) {
                // sendPlsWait(messageId);
                logger.info("request: image post")
                return sendImagePost(messageId, redditPost, markup);
            }
            //gif
            else if (redditPost.preview && redditPost.preview.images[0].variants.mp4) {
                // sendPlsWait(messageId);
                logger.info("request: gif post")
                sendGifPost(messageId, redditPost, markup);
            }
            //video
            else if (redditPost.domain === 'youtu.be' ||
                     redditPost.domain === 'youtube.com' ||
                     redditPost.domain === 'v.redd.it' ||
                     redditPost.domain === '.redd.it' ||
                     redditPost.domain === 'gfycat.com') {
                logger.info("request: video/gif post")
                return sendVideoPost(messageId, redditPost, markup)       
            }
            //link
            else if ((/http(s)?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi.test(redditPost.url)) && !redditPost.selftext) {
                logger.info("request: link post")
                return sendLinkPost(messageId, redditPost, markup)
            }
            //text  
            else {
                logger.info("request: text post")
                return sendMessagePost(messageId, redditPost, markup);
            }
            
        // unsuccessful response
        } else {
            return sendErrorMsg(messageId);
        }
      });
}

// options
function getOptions(option, rlimit) {
    if (option === 'top') {
        return `top.json?t=day&limit=${rlimit}`;
    } else if (option === 'toph') {
         return `top.json?t=hour&limit=${rlimit}`;
    } else if (option === 'topw') {
         return `top.json?t=week&limit=${rlimit}`;
    } else if (option === 'topm') {
         return `top.json?t=month&limit=${rlimit}`;
    } else if (option === 'topy') {
         return `top.json?t=year&limit=${rlimit}`;
    } else if (option === 'all') {
        return `top.json?t=all&limit=${rlimit}`;
    } else if (option === 'hot') {
        return `hot.json?&limit=${rlimit}`;
    } else if (option === 'new') {
        return `new.json?&limit=${rlimit}`;
    } else {
        return `top.json?t=day&limit=${rlimit}`;
    }
}

function sendErrorMsg(messageId) {
    const errorMsg = `Couldn't find the subreddit. Use /help for instructions.`;
    logger.error(errorMsg)
    return bot.sendMessage(messageId, errorMsg);
}

function sendLimitMsg(messageId) {
    const errorMsg = `Sorry, we can't show more than ${rLimit} posts for one option. Please change your subreddit or option. 
Use /help for instructions.`;
    logger.error(errorMsg)
    return bot.sendMessage(messageId, errorMsg);
}

function selfTextLimitExceeded(messageId) {
    const errorMsg = `Sorry, The content of this post is too long to be displayed here. Please click on Comments button or Next button to try and load the next post.`
    logger.error(errorMsg)
    return errorMsg
}

function noMorePosts(messageId) {
    const errorMsg = `No more posts. Use /help for instructions`;
    logger.error(errorMsg)
    return bot.sendMessage(messageId, errorMsg);
}

/*function sendPlsWait(messageId) {
    const message = `Please wait...`;
    return bot.sendMessage(messageId, message);
}*/

function sendImagePost(messageId, redditPost, markup) {
    let url = redditPost.url;
    url = url.replace(/&amp;/g, '&');
    //post time
    var timeago = prettytime((redditPost.created_utc*1000) - Date.now(), {short: true, decimals: 0},)
    timeago = timeago.replace(/\s/g, "");
    const caption = `🔖 ${redditPost.title}\n\n${url}\n\n⬆️ ${redditPost.score} votes\n💬 ${redditPost.num_comments} comments\n✏️ Posted ${timeago} ago by u/${redditPost.author} in r/${redditPost.subreddit}`;
    //logger.info(messageId+" "+url+" "+caption+" "+markup)
    //fix for meme topy not working
    return bot.sendMessage(messageId, caption, {markup});
    // prev code line was return bot.sendPhoto(messageId, url, {caption, markup});
}

function sendLinkPost(messageId, redditPost, markup) {
    let url = redditPost.url;
    url = url.replace(/&amp;/g, '&');
    //post time
    var timeago = prettytime((redditPost.created_utc*1000) - Date.now(), {short: true, decimals: 0},)
    timeago = timeago.replace(/\s/g, "");
    const message = `🔖 ${redditPost.title}\n\n${url}\n\n⬆️ ${redditPost.score} votes\n💬 ${redditPost.num_comments} comments\n✏️ Posted ${timeago} ago by u/${redditPost.author} in r/${redditPost.subreddit}`;
    return bot.sendMessage(messageId, message, {markup});
}

function sendGifPost(messageId, redditPost, markup) {
    //let url = redditPost.url;
    //url = url.replace(/&amp;/g, '&');
    let gifArr = redditPost.preview.images[0].variants.mp4.resolutions;
    let gif = gifArr[gifArr.length - 1].url;
    gif = gif.replace(/&amp;/g, '&');
    //post time 
    var timeago = prettytime((redditPost.created_utc*1000) - Date.now(), {short: true, decimals: 0},)
    timeago = timeago.replace(/\s/g, "");
    const caption = `🔖 ${redditPost.title}\n\n⬆️ ${redditPost.score} votes\n💬 ${redditPost.num_comments} comments\n✏️ Posted ${timeago} ago by u/${redditPost.author} in r/${redditPost.subreddit}`;
    return bot.sendVideo(messageId, gif, {caption, markup});
}

function sendVideoPost(messageId, redditPost, markup) {
    let url = redditPost.url;
    url = url.replace(/&amp;/g, '&');
    //let boldtitle = redditPost.title
    //post time
    var timeago = prettytime((redditPost.created_utc*1000) - Date.now(), {short: true, decimals: 0},)
    timeago = timeago.replace(/\s/g, "");
    const message = `🔖 ${redditPost.title}\n\n${url}\n\n⬆️ ${redditPost.score} votes\n💬 ${redditPost.num_comments} comments\n✏️ Posted ${timeago} ago by u/${redditPost.author} in r/${redditPost.subreddit}`
    return bot.sendMessage(messageId, message, {markup});
}

function sendMessagePost(messageId, redditPost, markup) {
    let url = redditPost.url;
    url = url.replace(/&amp;/g, '&');
    //let boldtitle = redditPost.title 
    //post time
    var timeago = prettytime((redditPost.created_utc*1000) - Date.now(), {short: true, decimals: 0},)
    timeago = timeago.replace(/\s/g, "");
    
    //FIX #19 rare cases when subreddits don't exist but still it detects as a textpost
    try{
        var validSub = redditPost.selftext.length;
    }
    catch(err)
    {
        return sendErrorMsg(messageId)
    }

    if (redditPost.selftext.length > 4096)
        return bot.sendMessage(messageId,selfTextLimitExceeded(messageId), {markup})
    const message = `🔖 ${redditPost.title}\n\n📝 ${redditPost.selftext}\n\n⬆️ ${redditPost.score} votes\n💬 ${redditPost.num_comments} comments\n✏️ Posted ${timeago} ago by u/${redditPost.author} in r/${redditPost.subreddit}`
    //\n\n${url}    
    return bot.sendMessage(messageId, message, {markup}); 
}    
  

bot.on('text', msg => {
    const parse = "Markdown";
    if (msg.text === '/start' || msg.text === '/help') {
        const message = `*Welcome to Reddgram Bot*

Browse all of reddit's pics, gifs, videos, cats, memes, news and much more right here from Telegram!

Enter a subreddit name with an option:

1. *top* - Top posts from past day
2. *topw* - Top posts from past week
3. *topm* - Top posts from past month
4. *topy* - Top posts from past year
5. *all* - Top posts of all time
6. *hot* - Hot posts right now 
7. *new* - Latest posts
8. *toph* - Top posts from past hour ---_newly added_

Examples:
1. If you want to get top posts of *r/cats*, Enter: 
                \`cats top\`
Default option is *top*, so *cats* will return top posts of *r/cats* from past day

2. You can also browse *random* subreddit or *all*. just send \`random top\` or \`all all\`

Please report any bugs/feature requests here - https://bit.ly/2Z7gA7k`
        return bot.sendMessage(msg.from.id, message, {parse});
    } else {
        logger.info(msg.from.first_name+"("+msg.from.username+")"+": "+msg.text)
        const userId = `id_${msg.from.id}`;
        const messageId = msg.from.id;

        const [subreddit, option] = msg.text.toLowerCase().split(' ');
        const postNum = 0;
        updateUser(userId, subreddit, option, postNum);
        sendRedditPost(messageId, subreddit, option, postNum);
    }  
});

bot.on('callbackQuery', msg => {
    if (msg.data === 'callback_query_next') {
        const userId = `id_${msg.from.id}`;
        const messageId = msg.from.id;
        logger.info(msg.from.first_name+"("+msg.from.username+") clicked next")
        let subreddit = '', 
              option = '';
        let postNum = 0;
        
        if (db[userId].hasOwnProperty('subreddit')) {
            subreddit = db[userId]['subreddit'];
        } else {
            return bot.sendMessage(messageId, 'Sorry, please send the subreddit name with option again');
        }
        
        if (db[userId]['option']) {
            option = db[userId]['option'];
        } else {
            option = 'top';
        }
        
        if (db[userId].hasOwnProperty('postNum')) {
            postNum = db[userId]['postNum'];
            postNum++;
        }
        
        db[userId]['postNum'] = postNum;
        
        if (postNum > rLimit - 1) {
            return sendLimitMsg(messageId);
        }
        sendRedditPost(messageId, subreddit, option, postNum);
    }
});

bot.connect();