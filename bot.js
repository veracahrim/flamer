require('dotenv').config()
const fs = require('fs')
const {uuid} = require('uuidv4');
const sqlite = require('sqlite3').verbose()
const db = new sqlite.Database('./db/database.db')
const {Client, Events, GatewayIntentBits, enableValidators} = require('discord.js');
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

function databaseStuffBeta() {
    db.serialize(() => {
        db.run('DROP TABLE testtablewow')
        db.run('CREATE TABLE testtablewow (info TEXT)')
        db.run('INSERT INTO testtablewow VALUES ("Hello World")')
        db.each('SELECT * FROM testtablewow', (err, row) => {
            console.log(row)
        })
    })
    db.close()
}

client.on('ready', async () => {
    joinConfiguredVoiceChannel()
    // databaseStuffBeta();
    // await parsePastMessagesIntoJson(100)
    console.debug('I am sentient')
})

async function parsePastMessagesIntoJson(messageAmount) {
    const files = fs.readdirSync('./json')
    for (const file of files) {
        console.log(file)
        fs.unlink(file, (err) => {
            if (err) {
                throw err;
            }
        })
    }
    const logs = client.channels.cache.find(c => c.name === 'logs-success')
    const messages = await logs.messages.fetch({limit: messageAmount})
    const filteredMessages = messages.filter((f) => f.author.username === 'Successful Log Uploader')
    const logUrls = []
    filteredMessages.forEach(msg => {
        logUrls.push(msg.embeds[0].data.url)
    })
    for (const url of logUrls) {
        // getLogDataFromApi(url)
    }
}

client.on(Events.MessageCreate, async message => {
    const flamerBotMessage = await getFlamerBotMessage(message);
    if (!flamerBotMessage) return
    let tts = client.channels.cache.find(c => c.name === process.env.DISCORD_TTS_CHANNEL_NAME)
    debugLog('sending message')
    await tts.send(flamerBotMessage)
});

client.login(process.env.DISCORD_TOKEN)

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


async function getFlamerBotMessage(message) {
    const url = extractUrlFromMessage(message);
    if (isInvalidUrl(url)) return
    if (isInvalidUpload(message)) return
    return await composeFlamerBotMessage(url)
}

function extractUrlFromMessage(message) {
    const embeds = message.embeds
    debugLog(embeds)
    if (!(embeds && embeds[0])) return
    const embedsData = embeds[0].data
    return embedsData ? embedsData.url : undefined
}

function isInvalidUpload(message) {
    const author = message.author
    const authorName = author.username
    const uploadedBySuccessUploader = authorName === 'Successful Log Uploader'
    const uploadedByFailureUploader = authorName === 'Failure Log Uploader'
    debugLog(`upload invalid: ${!(uploadedBySuccessUploader || uploadedByFailureUploader)}`)
    return !(uploadedBySuccessUploader || uploadedByFailureUploader);
}

function isInvalidUrl(url) {
    debugLog(`url invalid: ${!url}`)
    return !url;
}

async function composeFlamerBotMessage(url) {
    const logData = await getLogDataFromApi(url);
    return determineMessageType(logData);
}

async function getLogDataFromApi(url) {
    const apiUrl = getApiUrl(url);
    const res = await fetch(apiUrl)
    const data = await res.json()
    // recordJsonFile(data);
    return data;
}

function getApiUrl(url) {
    console.log(url)
    const splitUrl = url.split('/')
    let lastSplitUrlElementIndex = splitUrl.length - 1;
    const permalink = splitUrl[lastSplitUrlElementIndex]
    return `https://dps.report/getJson?permalink=${permalink}`
}


//TODO: unit tests from here, can use generated test jsons as test data
function determineMessageType(logData) {
    const players = logData.players
    const fightName = logData.fightName
    const mechanics = logData.mechanics
    const mechanicsMessage = handleMechanics(mechanics, players)
    if (mechanicsMessage) return mechanicsMessage
    if (nobodyDied(players)) {
        return getSuccessMessage()}
    else {
        return handleDeaths(players, fightName);
    }
}

function handleMechanics(mechanics, players) {
    //todo: check for priority mechanics first, like deimos blacks, full list of priority mechanics tbd
    if (process.env.RECORD_JSON) fs.writeFileSync(`json/${uuid()}_mechanics.json`, JSON.stringify(mechanics))
    const player = getFirstDeadPlayerName(players)
    if (!player) return
    const mechanicsWithoutDownedAndDeath = mechanics.filter(m =>( m.name !== 'Downed' && m.name !== 'Dead'))
    const mechanicsMissedByPlayer = mechanicsWithoutDownedAndDeath.filter(m => m.mechanicsData.filter(md => md.actor === player))
    let count = 0
    let mechanicName
    let mechanicsMessage
    let mechanicDescription
    mechanicsMissedByPlayer.forEach(mechanic => {
        mechanicsMessage = mechanicsMessageMap.get(mechanic.description)
        if (mechanicsMessage) {
            mechanicName = mechanic.name
            mechanicDescription = mechanic.description
        }
    })
    mechanicsMissedByPlayer.forEach(m => {
        if (m.name === mechanicName) count++
    })
    return getMechanicsMessage(player, mechanicName, mechanicDescription, count, mechanicsMessage)
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
    const playerNameToBeFlamed = getFirstDeadPlayerName(players)
    const finalNameToBeFlamed = getDiscordNameIfExists(playerNameToBeFlamed)
    return getDeathMessage(finalNameToBeFlamed, fightName)
}

module.exports = getFirstDeadPlayerName

function getFirstDeadPlayerName(players) {
    const deadPlayers = players.filter(p => p.deathRecap)
    const deadPlayersSortedByDeathTime = deadPlayers.sort((a, b) => a.deathRecap[0].deathTime > b.deathRecap[0].deathTime ? 1:-1)
    const deadPlayer = deadPlayersSortedByDeathTime[0]
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

function getMechanicsMessage(playerName, mechanicName, mechanicDescription, countHit, message) {
    if (message === undefined) return
    let formatted = message.replaceAll('°°', countHit)
    formatted = formatted.replaceAll('++', mechanicDescription)
    formatted = formatted.replaceAll('$$', playerName)
    formatted = formatted.replaceAll('||', mechanicName)
    return formatted
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
    return fightName + uuid() + '.json'
}

function recordJsonFile(logData) {
    if (!+process.env.RECORD_JSON) return;
    const fightName = logData.fightName
    if (!fightName) return;
    const fileName = formatJsonFileName(fightName);
    const callback = () => {
        console.debug('successfully created json file')
    }
    fs.writeFile(`json/${fileName}`, JSON.stringify(logData), callback)
}

function debugLog(msg) {
    if (process.env.DEBUG) {
        console.log(msg)
    }
}

const messagesSuccess = [
    'Incredible',
    'Congrats',
    'Good job',
    'That\'s some next level shit.',
    'We\'re big dills now',
    'i am pleased',
    'i am happy',
    'now take a well deserved break, except you, dingle',
    'even the mountain jews approve',
    'looks like we could start selling raids. only the easy ones tho.',
    'I\'m impressed. Congrats',
    'Wow! Such progress',
    'I was watching \'Rainbow Rocks\'',
    'never knew it was possible. Well done, guys and girls!',
    'that was smooth',
    'Kudos. You have come a long way. Very hard',
    'Yours in decadence and triumph!',
    'Very well done',
    'Nice job',
    'i cant believe what i just witnessed. that is what true domination looks like',
    'I\'ll take a couple minutes to congratulate you. You\'re doing awesome!',
    'Congrats! You\'re on the right track',
    'That\'s absolutely excellent, you\'re like, really good',
    'Wow, that\'s awesome! Did you even do that to look cool?',
    'Congratulations, you\'ve just become a legend!',
]

//$$ as placeholders for playername, §§ as placeholders for fight name
const deathMessages = [
    'Looks like $$ broke their fingers',
    'still can\'t get a clean §§? right $$?',
    'looks like §§ is still too hard for some people. like for example $$.',
    'i\'m sure next time you\'ll survive $$, even against §§',
    'another day, another death for $$.',
    '$$ should have dodged, or blocked, or, i dont know... not died?',
    'i love making fun about $$\'s suffering.',
    '$$, did you apply the anvil buff?',
    'Make sure you watch a video of §§ first, $$',
    'Maybe emboldened mode is more suitable for you, $$',
    'Are you sure you selected stats on all of your armor pieces, $$?',
    '$$ is dead again.',
    'I can see that you are struggling with the mechanics, $$. Have you tried installing Blish?',
    'Maybe you should play something a little bit easier, $$. May I suggest power mec- Oh right, nevermind',
    'Those are some Owlmind level tactics right there, $$',
    'Don\'t look at $$ for motivation',
    "Why are you even here, $$?",
    "You have an intriguing air about you, $$, you fail continuously yet it does not seem to impact your morale.",
    "Would you like to be moved to backup, $$?",
    'I think you\'re doing a fine job at sucking, $$',
    'Are you going to make a comeback, $$?,',
    'That didn\'t last very long, $$.',
    'Your skills speak for themselves, $$',
    'You are currently being obliterated by such small injuries, $$',
    'You need to work on your passive strats, $$',
    'What are you on about, $$?',
    'i\'m sure you\'ll still win the fight, $$',
    'Hey, why are you even taking this seriously $$? what a stupid move!',
    'I think you should use stronger equipment, $$',
    'Alright, $$ will take this seriously now',
    'What are you doing, $$?',
    'are you really trying to go back and win this fight, $$?',
    'Oh yeah $$? All by yourself?',
    'the cape doesn\'t help a bit, $$',
    'Hey i think it\'s time we reassigned duties to someone less broken, $$',
    'Are you looking for another job, $$?',
    'Are you going to die again, $$?',
    'i\'m very impressed with you, $$',
    'have you tried being passive, $$?',
    'Only health will help your situation, $$',
    'i think it\'s time to stop listening to you, $$',
    'I wonder what you think your chances are, $$',
    'Huh, I don\'t see any reaction time,$$',
    'When the term "fuck face" comes up? Have you ever considered it as a synonym for "$$"?',
    'don\'t you have better things to do, $$?',
    'you aren\'t supposed to do things like that, $$',
]

const DiscordNames = {
    VERAC: 'Verac',
    FRED: 'Fred',
    PASTA: 'MegaPasta',
    AGENT: 'Agent',
    ASTER: 'Aster',
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
    ['Aster Fflur', DiscordNames.ASTER],
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
    [DiscordNames.VERAC]: ['So much for "Supreme Leader", verac'],
    [DiscordNames.SAMMI]: ['Maybe you should stop eating during raids sammi.'],
    [DiscordNames.ZALI]: ['maybe something easier to play would help, consider power mech, Zali'],
    [DiscordNames.ASTER]: ['We\'re not gonna flame our newest recruit, are we?'],
    [DiscordNames.ENCIATKO]: ['Should have healed more, enciatko'],
    [DiscordNames.FRED]: ['fred is dead'],
    [DiscordNames.AGENT]: ['Unfortunately you still have to avoid damage as a power mech, agent.'],
}

//$$ = playerName
//°° = count of mechanic failed
const mechanicsMessageMap = new Map([
    ['Received Exposed stack', 'Look at $$, getting °° exposed stacks in total, your healers indeed were carrying you!'],
    ['Rapid Decay Trigger (Black expanding oil)', 'If you wonder who is the impostor, it\'s $$, triggered the oil a total of °° times!']
])
