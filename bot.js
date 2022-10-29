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

function joinConfiguredVoiceChannel() {
    const channels = client.channels
    const channelsCache = channels.cache
    const activeVoiceChatChannel = channelsCache.find(c => c.name === process.env.DISCORD_VOICE_CHANNEL_NAME)
    const channelGuild = activeVoiceChatChannel.guild
    return joinVoiceChannel({
        channelId: activeVoiceChatChannel.id,
        guildId: channelGuild.id,
        adapterCreator: channelGuild.voiceAdapterCreator
    });
}

client.on('ready', async () => {
    joinConfiguredVoiceChannel()
    console.debug('I am sentient')
})

client.on(Events.MessageCreate, async message => {
    const flamerBotMessage = await getFlamerBotMessage(message);
    if (!flamerBotMessage) return
    let tts = client.channels.cache.find(c => c.name === process.env.DISCORD_TTS_CHANNEL_NAME)
    await tts.send(flamerBotMessage)
});

client.login(process.env.DISCORD_TOKEN)

async function getFlamerBotMessage(message) {
    const url = extractUrlFromMessage(message);
    if (isInvalidUrl(url)) return
    if (isInvalidUpload(message)) return
    return await composeFlamerBotMessage(message)
}

function extractUrlFromMessage(message) {
    const embeds = message.embeds
    if (!(embeds && embeds[0])) return
    const embedsData = embeds[0].data
    return embedsData ? embedsData.url : undefined
}

function isInvalidUpload(message) {
    const author = message.author
    const authorName = author.username
    const uploadedBySuccessUploader = authorName === 'Successful Log Uploader'
    const uploadedByFailureUploader = authorName === 'Failure Log Uploader'
    return !(uploadedBySuccessUploader || uploadedByFailureUploader);
}

function isInvalidUrl(url) {
    return !!url;
}

async function composeFlamerBotMessage(url) {
    const logData = await getLogDataFromApi(url);
    return determineMessageType(logData);
}

async function getLogDataFromApi(url) {
    const apiUrl = getApiUrl(url);
    const res = await fetch(apiUrl)
    const data = await res.json()
    recordJsonFile(data);
    return data;
}

function getApiUrl(url) {
    const splitUrl = url.split('/')
    let lastSplitUrlElementIndex = splitUrl.length - 1;
    const permalink = splitUrl[lastSplitUrlElementIndex]
    return `https://dps.report/getJson?permalink=${permalink}`
}

//TODO: unit tests from here, can use generated test jsons as test data
function determineMessageType(logData) {
    const players = logData.players
    const fightName = logData.fightName
    if (nobodyDied(players)) {
        return getSuccessMessage()
    } else {
        return handleDeaths(players, fightName);
    }
}

function nobodyDied(players) {
    //todo: deathRecap is not a sound way to determine death.
    // it doesn't factor in /GGs and instant wipes bc of enrages or failed mechanics
    if (!players) return true
    const deadPlayers = players.filter(p => p.deathRecap)
    return !(deadPlayers && deadPlayers.length);
}

function getSuccessMessage() {
    const randomIndex = Math.floor(Math.random() * messagesSuccess.length)
    return messagesSuccess[randomIndex]
}

function handleDeaths(players, fightName) {
    const playerNameToBeFlamed = getRandomDeadPlayerName(players)
    const finalNameToBeFlamed = getDiscordNameIfExists(playerNameToBeFlamed)
    return getDeathMessage(finalNameToBeFlamed, fightName)
}

function getRandomDeadPlayerName(players) {
    //todo: implement preference for people who died earliest in the fight
    const deadPlayers = players.filter(p => p.deathRecap)
    const randomIndex = Math.floor(Math.random() * deadPlayers.length)
    const deadPlayer = deadPlayers[randomIndex]
    return deadPlayer.name
}

function getDiscordNameIfExists(inGameName) {
    const discordName = ignDiscordnameMap.get(inGameName)
    return discordName ? discordName : inGameName;
}

function getDeathMessage(playerName, fightName) {
    const deathMessage = determineDeathMessageType(playerName);
    const messageWithPlayerName = deathMessage.replaceAll('$$', playerName)
    return messageWithPlayerName.replaceAll('§§', fightName)
}

function determineDeathMessageType(playerName) {
    const random = Math.random()
    // 10% chance for personalized death message, otherwise a generic one appears
    if (random < 0.1) {
        return getIndividualDeathMessageElement(playerName)
    }
    return deathMessages[Math.floor(Math.random() * deathMessages.length)]
}

function getIndividualDeathMessageElement(playerName) {
    const messageArrayLength = IndividualDeathMessages[playerName].length
    const randomIndex = Math.floor(Math.random() * messageArrayLength)
    return IndividualDeathMessages[playerName][randomIndex];
}


function formatJsonFileName(fightName) {
    let fileName = fightName + new Date().toString() + '.json'
    fileName = fileName.replaceAll(' ', '_')
        .replaceAll('+', '_')
        .replaceAll(':', '_')
    return fileName
}

function recordJsonFile(logData) {
    if (!process.env.RECORD_JSON) return;
    const fightName = logData.fightName
    if (!fightName) return;
    const fileName = formatJsonFileName(fightName);
    const callback = () => {
        console.debug('successfully created json file')
    }
    fs.writeFile(`json/${fileName}`, JSON.stringify(logData), callback)
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
    'Kudos. You have come a long way. Very hard',
    'Almost there. You\'re doing really well! Thanks for your effort. Let\'s keep it going!',
    'How ya doin? Just got that high score on that level? You\'ve got a real shot at that diamond next!',
    'Have fun chasing that diamond',
    'good luck with the next level. we\'re right there with you',
    'hahahahahha y\u003cp\u003eyeah and i\u003ccom\u003efeard it to. you\'ve got this.',
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

const DiscordNames = {
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
    ['Erdbeer Joghurt', DiscordNames.VERAC],
    ['Schoggi Gipfeli', DiscordNames.VERAC],
    ['Vorinia Gales', DiscordNames.VERAC],
    ['Pia Oceania', DiscordNames.VERAC],
    ['Tamn Vertand', DiscordNames.VERAC],
    ['Chuchichäschtli', DiscordNames.VERAC],
    ['Janamiri', DiscordNames.VERAC],
    ['Fantastic Freya', DiscordNames.FRED],
    ['Fantastic Fred', DiscordNames.FRED],
    ['Ferocious Freya', DiscordNames.FRED],
    ['Subpar Sabetha', DiscordNames.FRED],
    ['Lil Kleintje', DiscordNames.PASTA],
    ['Jokos Mommy', DiscordNames.PASTA],
    ['Axetremely Norny', DiscordNames.PASTA],
    ['Dolyak The Majestic', DiscordNames.AGENT],
    ['Agent of Darkness', DiscordNames.AGENT],
    ['Bubble Salami', DiscordNames.DERP],
    ['Sadenean', DiscordNames.DERP],
    ['Toxic Vex', DiscordNames.VEX],
    ['Tinkerfurr', DiscordNames.VEX],
    ['Lorna Deathknell', DiscordNames.SAMMI],
    ['Miah Crossfire', DiscordNames.SAMMI],
    ['Evelyn Thornroot', DiscordNames.SAMMI],
    ['Carliah Whisperoak', DiscordNames.SAMMI],
    ['Zalibeast', DiscordNames.ZALI],
    ['Zali Nex', DiscordNames.ZALI],
    ['Zalindrae', DiscordNames.ZALI],
    ['Adriana Elise', DiscordNames.ZALI],
    ['Doctor Dingleberry', DiscordNames.DINGLEBERRY],
    ['Nagilmar', DiscordNames.DINGLEBERRY],
    ['Look Im A Treeee', DiscordNames.DINGLEBERRY],
    ['Shignis', DiscordNames.ENCIATKO],
    ['Aileen Igniferous', DiscordNames.ENCIATKO],
])


const IndividualDeathMessages = {
    [DiscordNames.VEX]: ['Looks like addons couldnt save you this time, Vex'],
    [DiscordNames.PASTA]: ['Megapasta Pasta way'],
    [DiscordNames.DINGLEBERRY]: ['Dinleberry? More like Cringeleberry', 'Don\'t take it personally, Dingle. §§ is clearly antisemitic.'],
    [DiscordNames.VERAC]: ['So much for "Supreme Leader"'],
    [DiscordNames.SAMMI]: ['Maybe you should stop eating during raids sammi.'],
    [DiscordNames.ZALI]: ['maybe something easier to play would help, consider power mech, Zali'],
    [DiscordNames.DERP]: ['username checks out, derp.'],
    [DiscordNames.ENCIATKO]: ['Should have healed more, enciatko'],
    [DiscordNames.FRED]: ['fred is dead'],
    [DiscordNames.AGENT]: ['Unfortunately you still have to avoid damage as a power mech, agent.'],
}
