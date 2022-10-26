require('dotenv').config()
const fs = require('fs')
const { Client, Events, GatewayIntentBits } = require('discord.js');
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

client.on('ready',async () => {
    const ch = client.channels.cache.find(c => c.name==="Generic Voice Chat Name")
    joinVoiceChannel({
        channelId: ch.id,
        guildId: ch.guild.id,
        adapterCreator: ch.guild.voiceAdapterCreator,
    });
    console.log('i am sentient')
})

client.on(Events.MessageCreate, async message => {
    let url
    if (message.embeds && message.embeds[0] && message.embeds[0].data) {
        url = message.embeds[0].data.url
    }
    if ((message.author.username === 'Successful Log Uploader' || message.author.username === 'Failure Log Uploader') && url) {
        let body = await getLogJSON(url);
        let deaths = false
        let tts = client.channels.cache.find(c => c.name === 'tts')
        if (body && body.players) {
            deaths = await handleDeaths(body, deaths, tts);
        }
        if (!deaths){
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
    const deads = body.players.filter(p => p.deathRecap)
    if (deads && deads.length) {
        const dead = deads[Math.floor(Math.random(deads.length))]
        deaths = true
        let name = dead.name
        name = ignDiscordnameMap.get(name) ? ignDiscordnameMap.get(name) : name
        const msg = getDeathMessage(name, body.fightName)
        await tts.send(msg)
    }
    return deaths;
}


function getSuccessMessage() {
    return messagesSuccess[Math.floor(Math.random() * messagesSuccess.length)]
}

function getDeathMessage(player, fight) {
    let msg = deathMessages[Math.floor(Math.random() * deathMessages.length)]
    let random = Math.random()
    console.log(random)
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
    "Would you like to be moved to backup, $$?",
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


  
const Messages =  {
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
