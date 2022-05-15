module.exports = helpMessage = `_Hey there! 👋

I am Reddgram bot 🤖

I am here to help you browse all of Reddit's pics, gifs, videos, cats, news, memes and much more right here from Telegram!_

*How to use me?*
          
    \`\/subreddit_name  [sort_option]\`

    1️⃣ *subreddit_name* can be any of the subreddits in reddit. Click on _Popular Subs_ button for the most popular ones.
    
    2️⃣ (optional) *sort_option* can be any of the /options. 

For eg. \`\/aww top\` (long press to copy) to get top threads of r/aww - a sub dedicated to cute pets.

_Note: Default option is "hot", so /aww will return hottest threads from the past day._

✏️ In case of issues, /contact the developer`;

module.exports = featureList = `*Reddgram Features*

1️⃣ *Subscriptions* - Subscribe to any subreddit by using \`\/sub subreddit_name\` and unsubscribe using \`/unsub subreddit_name\`

2️⃣ *Import subreddits* - Import your subreddits from reddit.com as _Subscriptions_ and get posts from them regularly. check /import.

3️⃣ *Best Answer* - For r‏/explainlikeimfive subreddit, see the best answer for a Question.

4️⃣ *Multi Mode* - Fetch multiple threads at a time. eg. \`\/jokes hot 5\`

5️⃣ *Emoji Mode* - A new way to browse subreddits, the emoji way.

6️⃣ *Multireddit* - Combine multiple subreddits and browse your own multireddit. eg. \`/gifs+pics+videos\` `

module.exports = inbuiltSubs = `*Some default subs that you can browse:*

1️⃣ /random - _random_ threads from all subreddits

2️⃣ /all - _all_ hot threads from all subreddits

3️⃣ /popular - most _popular_ threads from all subreddits.`

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

module.exports = emojiMode = `_Welcome to a whole new way to browse Reddit:_ *Emoji Mode*.

_Send any one of these emojis to browse the corresponding subreddit(s) a.k.a_ _subs_.

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

😎 - random`;

module.exports = sortOptions = `*Sort Options*

_You can customize the_ *sort_option* _with any of the following_: 

1️⃣ _(default)_ *hot* - Hot threads from past day 
2️⃣ *top* - Top threads from past day
3️⃣ *toph* - Top threads from past hour
4️⃣ *topw* - Top threads from past week
5️⃣ *topm* - Top threads from past month
6️⃣ *topy* - Top threads from past year
7️⃣ *all* - Top threads of all time
8️⃣ *new* - Latest threads

For eg. Try entering  \`/pics topm\`.
    `;

module.exports = contactDev = `Contact @suhasa010 or drop a message in the _Official Reddgram Group_ if you face any issues or have a feature request.

Join the _Projects Channel_ for updates related to the bot and for more info on my other projects.

If you like the project and want to support it then you can buy me a coffee at paypal.me/suhasa010.`;

module.exports = multiMode = `🆕*Multi Mode*
      
_Now browse multiple threads at a time as opposed to clicking next after every single one._

Just send 

\`/aww new 5\`

(replace aww with any of the subreddits you want to browse, new with any of the options provided in the help page)

Currently this mode has some limitations;
1. Max number of threads that can be fetched at a time is 5 (might change in the future).
2. You will have to scroll from bottom to top to be able to browse the fetched threads.
`;

module.exports = subscriptions = `🆕*Subscriptions*

You can now subscribe to any of the subreddits to receive regular posts in your PM or in your groups.

_You can also import your existing subreddits_ from reddit.com. check /import.

To subscribe, all you have to do is -

\`/sub memes\`

replace _memes_ with any of your favourite subreddits.

Unsubscribe using -

\`/unsub memes\`

You can subscribe to multiple subreddits by repeating the same or by giving \`/sub jokes+memes+gifs\` and you'll receive one message every 3 hours with a post from any of your subscriptions.

You can view your subscriptions any time by sending /subscriptions.`;

module.exports = noSubs = `_ERROR: No subscriptions found 🧐\nTo subscribe, send_ \`/sub subreddit_name\``;

module.exports = importSubs = `🆕*Import Subreddits*

_Import all of your subreddits on reddit.com into Reddgram bot as subscriptions and get notified every 3 hours!_

All of this happens without you having to sign-in via the bot, so you know it's safe and secure.

[How to Import from Reddit to Reddgram](https://telegra.ph/Tutorial-How-to-import-your-existing-subreddits-on-redditcom-to-Reddgram-bot-on-Telegram-10-04)`

module.exports = faq = `<b>FAQs</b>

<b>What is Reddit?</b>
<i>Reddit is the front page of the internet.</i>

<b>Do I need to sign in to browse reddit using Reddgram?</b>
<i>No. You can browse anything without signing in. Also, You can /import your existing subreddits from reddit.com to Reddgram bot and get regular updates.</i>

<b>What types of posts can I browse?</b>
<i>Images, GIFs, Articles, Text, anything that is on Reddit.</i>

<b>What do the various icons/emojis indicate in the post view?</b>
<code>🔖 It's a shame nothing is built in the USA anymore....
📝 Just bought a T.V. and it said, "Built in Antenna".
I don't even know where that is!!
⬆️ 10.1k (95%)   •  💬 136  •  ⏳ 6h ago
✏️ u/VERBERD  •  🏅2  •  🌐 r‏/Jokes</code>

<i>🔖 -> Post title, 📝 -> self-text(if any),  ⬆️ -> Upvotes, (95%) -> percentage of upvotes vs downvotes, 💬 -> Comments, ⏳ -> post creation time, ✏️ -> user who posted it, 🏅2 -> no. of awards received, 🌐 -> subreddit.</i>

<b>Is the bot open source? Can I create my own bot using Reddgram?</b>
<i>Yes, Reddgram is open source and it is on <a href = "https://github.com/suhasa010/reddgram-telegram-bot">GitHub</a> under GPLv3 Licence. You are free to clone/fork it and add your own features but with credits, of course (just like I credited the original creator).</i>

<b>Will the bot be free forever?</b>
<i>This started as a hobby project mainly for myself to browse reddit. As long as it is feasible for me to keep the bot hosted on my Raspberry Pi, it will be free.
Nevertheless, If you like the project and want to support it then you can buy me a coffee at</i> paypal.me/suhasa010.`
