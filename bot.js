require('dotenv').config()
const fs = require('fs')
const {Client, Events, GatewayIntentBits} = require('discord.js');
const {joinVoiceChannel} = require("@discordjs/voice");
const client = new Client(
    {
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.MessageContent
        ]
    })

client.on('ready', async () => {
    const ch = client.channels.cache.find(c => c.name === "Generic Voice Chat Name")
    joinVoiceChannel({
        channelId: ch.id,
        guildId: ch.guild.id,
        adapterCreator: ch.guild.voiceAdapterCreator,
    });
    console.log('i am sentient')
})

const recentlyFlamed = []
client.on(Events.MessageCreate, async message => {
    let url
    if (message.embeds && message.embeds[0] && message.embeds[0].data) {
        url = message.embeds[0].data.url
    }
    if ((message.author.username === 'Successful Log Uploader' || message.author.username === 'Failure Log Uploader') && url) {
        let body = await getLogJSON(url);
        let str = body.fightName + new Date().toString() + '.json'
        str = str.replaceAll(' ', '_')
        str = str.replaceAll('+', '_')
        str = str.replaceAll(':', '_')
        if(process.env.RECORD_JSON) {
            fs.writeFileSync(`json/${str}`, JSON.stringify(body))
        }
        let deaths = false
        let tts = client.channels.cache.find(c => c.name === 'tts')
        if (body && body.players) {
            deaths = await handleDeaths(body, deaths, tts);
        }
        if (!deaths) {
            tts.send(getSuccessMessage())
        }
    }
});

client.login(process.env.DISCORD_TOKEN)

async function getLogJSON(url) {
    const splitUrl = url.split('/')
    const permalink = splitUrl[splitUrl.length - 1]
    const res = await fetch(`https://dps.report/getJson?permalink=${permalink}`)
    return await res.json();
}

async function handleDeaths(body, deaths, tts) {
    let deads = body.players.filter(p => {
        return p.deathRecap
    })
    if (deads && deads.length) {
        const dead = deads[Math.floor(Math.random(deads.length))]
        deaths = true
        let name = dead.name
        name = ignDiscordnameMap.get(name) ? ignDiscordnameMap.get(name) : name
        const msg = getDeathMessage(name, body.fightName)
        await tts.send(msg)
        recentlyFlamed.unshift(name)
        if (recentlyFlamed.length >= 3) {
            recentlyFlamed.pop()
        }
    }
    return deaths;
}


function getSuccessMessage() {
    return messagesSuccess[Math.floor(Math.random() * messagesSuccess.length)]
}

function getDeathMessage(player, fight) {
    let msg = deathMessages[Math.floor(Math.random() * deathMessages.length)]
    let random = Math.random()
    if (random < 0.1) {
        msg = Messages[player][Math.floor(Math.random() * Messages[player].length)]
    }
    msg = msg.replace('$$', player)
    msg = msg.replace('§§', fight)
    return msg
}

const messagesSuccess = [
    'No deaths? Good job, you guys still suck tho.',
    'Incredible',
    'It only took us well over a year to get this good. Other people definitely can\'t do it better',
    'Congrats',
    'Good job',
    'That\'s some next level shit.',
    'We\'re big dills now',
    'i am pleased',
    'i am happy',
    'now take a well deserved break, except you, dingle',
    'looks like pasta wasn\'t sleeping this time',
    'even the mountain jews approve',
    'if we keep up that learning curve we\'ll be halfway decent in about 10 years',
    'looks like we could start selling raids. only the easy ones tho.',
    'Congratulations! There\'s your reward for all the hard work you put in! Enjoy every bit of it!',
    'we\'ve got a system people actually will use for stuff',
    'you\'ve achieved a grand feat for a game made entirely by 7 people',
    'it is a truly grand feat. we\'re proud of you.',
    'I\'m impressed. Congrats',
    'Do you think they feel more appreciated now?',
    'We\'ve gotten something that, on its own, people will play, enjoy, and say "good job"',
    'good job well. but it\'s when we pair it with all the other stuff they do well, makes it truly magnificent',
    "You've finally done it. You have created a game that actually is polished",
    "An outstanding game from start to finish",
    "What makes it all work so well is how far along it was when it was first made",
    'This is fantastic, thanks a lot for all the effort you put in',
    'when you get done f***ing off after this, you could also turn the pc on again',
    "I couldn't find a game that got it so far, so I decided to build one myself",
    'Wow! Such progress',
    "The game is a really solid, versatile, and fun one'",
    'I was watching \'Rainbow Rocks\'',
    'never knew it was possible. Well done, guys and girls!',
    'suddenly my cheesesteak was awesome again!',
    'that was smooth',
    'Achieved all of these in a less than 2 year timeframe, with 7 people and a slightly different game engine (still voxel based) than most game developers!',
    'Kudos. You have come a long way. Very hard' ,
    'Almost there. You\'re doing really well! Thanks for your effort. Let\'s keep it going!' ,
    'How ya doin? Just got that high score on that level? You\'ve got a real shot at that diamond next!' ,
    'Have fun chasing that diamond',
    'good luck with the next level. we\'re right there with you' ,
    'hahahahahha y\u003cp\u003eyeah and i\u003ccom\u003efeard it to. you\'ve got this.' ,
    'You must be the man! Congrats',
    'Yours in decadence and triumph!',
    'It\'s definitely the most ambitious writeup I\'ve seen here!',
    'Hope you can use this to put a big fat asterisk on your CV',
    'Very well done',
    'Nice job',
    'I\'ll think about the ** you\'re doing on this.',
    'You\'ve just topped my super secret pvp list',
    'How many can you do?',
    'We are the distinguished f* off club!',
    'i cant believe what i just witnessed. that is what true domination looks like',
    'Congratulations to the Brave and Reckless Alliance. One of the first and most successful alliances to ever raid to, and hold, Molten Core. Here\'s to the next 10 years.',
    'This is what dreams are made of',
    'Didnt even take too much effort to hold Molten Core',
    '30\'+ years of game time to fight in 1 instance. Classic!',
    'I always wanted to do this, can\'t wait for my account to expire.',
    'The game is almost impossible.',
    'I was able to hold this for close to an hour! Congrats to your alliance!',
    'I was playing far too hard',
    'We were fast as hell, not as fast as you guys tho',
    'I\'ll take a couple minutes to congratulate you. You\'re doing awesome!',
    'Congrats! You\'re on the right track',
    'Sorry, just called this number for no reason and that was the lucky guy!',
    'Congratulations, you\'re making great progress!',
    'Congratulations, you\'ve achieved over 1,000,000 ,/u003c to the star-scape!',
    'Congratulations on your climbing master\'s badge!',
    'the last one is for the JP on Q1' +
    'That\'s absolutely excellent, you\'re like, really good',
    'Wow, that\'s awesome! Did you even do that to look cool?',
    'Congratulations, you\'ve just become a legend!',
    'Way to go, world\'s toughest dog trainers',
]

//$$ as placeholders for playername, §§ as placeholders for fight name
const deathMessages = [
    'Looks like $$ broke their fingers',
    'still can\'t get a clean §§? right $$?',
    'looks like §§ is still too hard for some people. like for example $$.',
    'that stream is boring $$.',
    'i\'m sure next time you\'ll survive $$, even against §§',
    'rip $$',
    'another day, another death for $$.',
    'git gud $$',
    '$$ should have dodged, or blocked, or, i dont know... not died?',
    'i love making fun about $$\'s suffering.',
    '§§: 1, $$: 0.',
    'Maybe you should use soldier gear, $$',
    '$$, did you apply the anvil buff?',
    'Make sure you watch a video of §§ first, $$',
    'Maybe emboldened mode is more suitable for you, $$',
    'Are you sure you selected stats on all of your armor pieces, $$?',
    '$$ is dead again.',
    'I can see that you are struggling with the mechanics, $$. Have you tried installing Blish?',
    'Maybe you should play something a little bit easier, $$. May I suggest power me- Oh right, nevermind',
    'Those are some Owlmind level tactics right there, $$',
    'Don\'t look at $$ for motivation',
    "Why are you even here, $$?",
    "You have an intriguing air about you, $$, you fail continuously yet it does not seem to impact your morale.",
    "Would you like to be moved to backup, $$?",
    'Hey, there\'s only a handful of us left, aren\'t you going to let us win this fight, $$?',
    'I think you\'re doing a fine job at sucking, $$',
    'Are you going to make a comeback, $$?,',
    'That didn\'t last very long, $$.',
    'Your skills speak for themselves, $$',
    'You are currently being obliterated by such small injuries, $$',
    'You need to work on your passive strats, $$',
    'You\'re doing fine, just check your focus and DPS §§, $$',
    'What are you on about, $$?',
    'Nice work putting the tag on the chest, $$',
    'i see you got into some long range support, $$',
    'i\'m sure you\'ll still win the fight, $$',
    'Hey, why are you even taking this seriously $$? what a stupid move!',
    'Forgot to bring a guard, $$?',
    'I think you should use stronger equipment, $$',
    'Alright, $$ will take this seriously now',
    'What if you have 5 people, all using TPS to augment your 2 DPSs. And it\'s 3/3 timme, $$?',
    'What are you doing, $$?',
    'You shouldn\'t have 1 oc, you can\'t even stick to it, $$',
    'I have a huge 8k hp left, can I help, $$?',
    'are you really trying to go back and win this fight, $$?',
    'Oh yeah $$? All by yourself?',
    'I have a decent 34k hp left, i can definitely use it for tps',
    'the cape doesn\'t help a bit, $$',
    'i\'m not quitting, $$',
    'Hey i think it\'s time we reassigned duties to someone less broken, $$',
    'Are you looking for another job, $$?',
    'After your initial luck, i am not surprised that you\'re getting killed, $$',
    'Hey, you have a GV! No wonder you don\'t have any kills, $$!',
    'Are you going to die again, $$?',
    'What can you do, $$?',
    'Not to change the subject, but what\'s the strongest poison you have, $$?',
    'i\'m very impressed with you, $$',
    'have you tried being passive, $$?',
    'Only health will help your situation, $$',
    'hey, it\'s 4v4, you can do much better',
    'i think it\'s time to stop listening to you, $$',
    'it\'s time for you to die, $$',
    'I wonder what you think your chances are, $$',
    'Huh, I don\'t see any reaction time,$$',
    'When the term "fuck face" comes up? Have you ever considered it as a synonym for "$$"?',
    'don\'t you have better things to do, $$?',
    'It\s got nothing on this, you poor $$?',
    'the nun is naked, is that okay, $$?',
    'you aren\'t supposed to do things like that, $$',
    'Hey, what\'s going on here, everyone, you gotta see this $$!',
]

const DISCORD_NAMES = {
    VERAC: 'Verac',
    FRED: 'Fred',
    PASTA: 'MegaPasta',
    AGENT: 'Agent',
    DERP: 'Derp',
    VEX: 'Vex',
    SAMMI: 'Sammi',
    ZALI: 'Zali',
    DINGLEBERRY: 'Dingleberry',
    ENCIATKO: 'Enciatko',
}

const ignDiscordnameMap = new Map([
    ['Erdbeer Joghurt', DISCORD_NAMES.VERAC],
    ['Schoggi Gipfeli', DISCORD_NAMES.VERAC],
    ['Vorinia Gales', DISCORD_NAMES.VERAC],
    ['Pia Oceania', DISCORD_NAMES.VERAC],
    ['Tamn Vertand', DISCORD_NAMES.VERAC],
    ['Chuchichäschtli', DISCORD_NAMES.VERAC],
    ['Janamiri', DISCORD_NAMES.VERAC],
    ['Fantastic Freya', DISCORD_NAMES.FRED],
    ['Fantastic Fred', DISCORD_NAMES.FRED],
    ['Ferocious Freya', DISCORD_NAMES.FRED],
    ['Subpar Sabetha', DISCORD_NAMES.FRED],
    ['Lil Kleintje', DISCORD_NAMES.PASTA],
    ['Jokos Mommy', DISCORD_NAMES.PASTA],
    ['Axetremely Norny', DISCORD_NAMES.PASTA],
    ['Dolyak The Majestic', DISCORD_NAMES.AGENT],
    ['Agent of Darkness', DISCORD_NAMES.AGENT],
    ['Bubble Salami', DISCORD_NAMES.DERP],
    ['Sadenean', DISCORD_NAMES.DERP],
    ['Toxic Vex', DISCORD_NAMES.VEX],
    ['Tinkerfurr', DISCORD_NAMES.VEX],
    ['Lorna Deathknell', DISCORD_NAMES.SAMMI],
    ['Miah Crossfire', DISCORD_NAMES.SAMMI],
    ['Evelyn Thornroot', DISCORD_NAMES.SAMMI],
    ['Carliah Whisperoak', DISCORD_NAMES.SAMMI],
    ['Zalibeast', DISCORD_NAMES.ZALI],
    ['Zali Nex', DISCORD_NAMES.ZALI],
    ['Zalindrae', DISCORD_NAMES.ZALI],
    ['Adriana Elise', DISCORD_NAMES.ZALI],
    ['Doctor Dingleberry', DISCORD_NAMES.DINGLEBERRY],
    ['Nagilmar', DISCORD_NAMES.DINGLEBERRY],
    ['Look Im A Treeee', DISCORD_NAMES.DINGLEBERRY],
    ['Shignis', DISCORD_NAMES.ENCIATKO],
    ['Aileen Igniferous', DISCORD_NAMES.ENCIATKO],
])


const Messages = {
    [DISCORD_NAMES.VEX]: ['Looks like addons couldnt save you this time, Vex'],
    [DISCORD_NAMES.PASTA]: ['Megapasta Pasta way'],
    [DISCORD_NAMES.DINGLEBERRY]: ['Dinleberry? More like Cringeleberry', 'Don\'t take it personally, Dingle. §§ is clearly antisemitic.'],
    [DISCORD_NAMES.VERAC]: ['So much for "Supreme Leader"'],
    [DISCORD_NAMES.SAMMI]: ['Maybe you should stop eating during raids sammi.'],
    [DISCORD_NAMES.ZALI]: ['maybe something easier to play would help, consider power mech, Zali'],
    [DISCORD_NAMES.DERP]: ['username checks out, derp.'],
    [DISCORD_NAMES.ENCIATKO]: ['Should have healed more, enciatko'],
    [DISCORD_NAMES.FRED]: ['fred is dead'],
    [DISCORD_NAMES.AGENT]: ['Unfortunately you still have to avoid damage as a power mech, agent.'],
}
