module.exports = helpMessage = `_Hey there! 👋

I am Reddgram bot 🤖

I am here to help you browse all of Reddit's pics, gifs, videos, cats, news, memes and much more right here from Telegram!_

*How to use me:*
          
    \`\/subreddit_name  [sort_option]\` (long press to copy)

    a. *subreddit_name* can be any of the subreddits in reddit. see /list for the most popular ones.
    
    b. (optional) *sort_option* can be any of the /options. 

For eg. \`\/aww top\` (long press to copy) to get top threads of r/aww - a sub dedicated to cute pets.

_Note: Default option is "hot", so /aww will return hottest threads from the past day._

✉️ In case of issues, /contact the developer`;

module.exports = featureList = `*Reddgram Features:*

*Subscriptions* - Subscribe to any subreddit by using \`\/sub subreddit_name\` and unsubscribe using \`/unsub subreddit_name\`

*Import subreddits* - Import your subreddits from reddit.com as _Subscriptions_ and get posts from them regularly. check /import.

*Multi Mode* - Fetch multiple threads at a time. eg. \`\/jokes hot 5\`

*Emoji Mode* - A new way to browse subreddits, the emoji way.

*Multireddit* - Combine multiple subreddits and browse your own multireddit. eg. \`/gifs+pics+videos\` `

module.exports = inbuiltSubs = `*Some default subs that you can browse:*

/random - _random_ threads from all subreddits

/all - _all_ hot threads from all subreddits

/popular - most _popular_ threads from all subreddits.`

module.exports = listSubs = `Here is a list of most popular subreddits on Reddit, click on any of these links to browse *hot* threads:
  (and of course you can customize the *sort_option* with any of the /options):. eg. \`/aww all\` fetches all time popular threads of r/aww)
  
  _💡Tip for mobile users: Touch and hold on any of the commands to be able to edit and send with a sort option_  
  
  1. /aww

  2. /cats
  
  3. /gifs
  
  4. /pics
  
  5. /videos
  
  6. /news
  
  7. /coronavirus
  
  8. /worldnews
  
  9. /todayilearned
  
  10. /dogs
  
  11. /memes
  
  12. /science
  
  13. /youshouldknow
  
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
  
  33. /food
  
  34. /nosleep

  35. /woahdude
`;

module.exports = emojiMode = `Welcome to a whole new way to browse Reddit: *Emoji Mode* is here.
Send any of these emojis to browse the corresponding subreddit(s) a.k.a _subs_.

😂/😀/😃/😄/😁/😆/😅/🤣 - subs that tickle your funny bone 

🧐/👀/👁 - browse pics/gifs/videos from various subs

😍 - subs that make you go aww

👌 - subs that make you go wow

😳/😱/😨/😰/🤯 - subs that blow your mind away

😋/🤤 - mmmm! tasty food

🤔 - know stuff you never knew

🐈 - meow meow

🦮 - ruff ruff

🚿 - showerthoughts

🎬 - movies+television+anime

🦠 - coronavirus

💪 - self improvement subs

🤦/🤦‍♀️ - _facepalm_

💩 - shitty subs

🥱😴 - subs that will haunt your sleep

😎 - random

🍑/🖕 - nsfw🔞 

...and many more coming soon`;

module.exports = sortOptions = `*Sort Options:*

You can customize the *sort_option* with any of the following: 

1. _(default)_ *hot* - Hot threads from past day 
2. *top* - Top threads from past day
3. *toph* - Top threads from past hour
4. *topw* - Top threads from past week
5. *topm* - Top threads from past month
6. *topy* - Top threads from past year
7. *all* - Top threads of all time
8. *new* - Latest threads

For eg. Try entering  \`/pics new\`.
    `;

module.exports = contactDev = `Contact @suhasa010 or drop a message in the _Official Reddgram Group_ if you face any issues or have a feature request.
Join the _Projects Channel_ for updates related to the bot and for more info on my other projects.`;

module.exports = multiMode = `*Multi Mode*
      
Now browse multiple threads at a time as opposed to clicking next after every single one.

Just send 

\`/aww new 5\`

(replace aww with any of the subreddits you want to browse, new with any of the options provided in the help page)

Currently this mode has some limitations;
1. Max number of threads that can be fetched at a time is 5 (might change in the future).
2. You will have to scroll from bottom to top to be able to browse the fetched threads.
`;

module.exports = subscriptions = `You can now subscribe to any of the subreddits to receive regular posts in your PM or in your groups or _you can import your existing subreddits_ from reddit.com. check /import.

All you have to do is -

\`/sub memes\`

replace _memes_ with any of your favourite subreddits.

Unsubscribe using -

\`/unsub memes\`

You can subscribe to multiple subreddits by repeating the same or by giving \`/sub jokes+memes+gifs\` and you'll receive one message every 3 hours with a post from any of your subscriptions.

You can view your subscriptions any time by sending /subscriptions.`;

module.exports = noSubs = `No subscriptions found 🧐\nTo subscribe, send \`/sub subreddit_name\``;
