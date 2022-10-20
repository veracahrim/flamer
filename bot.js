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
    const connection = joinVoiceChannel({
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
    console.log(url)
    if ((message.author.username === 'Successful Log Uploader' || message.author.username === 'Failure Log Uploader') && url) {
        const splitUrl = url.split('/')
        const permalink = splitUrl[splitUrl.length-1]
        const res = await fetch(`https://dps.report/getJson?permalink=${permalink}`)
        console.log(res)
        let body = await res.json()
        let deaths = false
        let tts = client.channels.cache.find(c => c.name === 'tts')
        console.log(body)
        if (body && body.players) {
            for (let player of body.players) {
                if (player.deathRecap) {
                    deaths = true
                    const msg = getDeathMessage(player.name, body.fightName)
                    tts.send(msg)
                }
            }
        }
        if (!deaths){
            tts.send(getSuccessMessage())
        }
    }
});

client.login(process.env.DISCORD_TOKEN)

function getSuccessMessage() {
    return messagesSuccess[Math.floor(Math.random() * messagesSuccess.length)]
}

function getDeathMessage(player, fight) {
    let msg = deathMessages[Math.floor(Math.random() * deathMessages.length - 1)]
    msg = msg.replace('$$', player)
    msg = msg.replace('§§', fight)
    return msg
}

const messagesSuccess = [
    'No deaths? Good job, you guys still suck tho.',
    'Incredible',
    'It only took us well over a year to get this good. Other people definitely can\'t do it better',
    'Congrats',
    'That\'s some next level shit.',
    'We\'re big dills now',
    'get carried dingle',
    'i am pleased',
    'i am happy',
    'now take a well deserved break, except you, dingle',
    'zali going hard again',
    'looks like pasta wasn\'t sleeping this time',
    'even the mountain jews approve',
    'if we keep up that learning curve we\'ll be halfway decent in about 10 years',
    'the heal mechs are at it again',
    'looks like we could start selling raids. only the easy ones tho.',
    'Congratulations! There\'s your reward for all the hard work you put in! Enjoy every bit of it!',
    'wow',
    'amazing',
    'rollin',
    'addons for the win',
    'praise dolyak',
    'sexy',
    'owo',
]

//$$ as placeholders for playername, §§ as placeholders for fight name
const deathMessages = [
    'Looks like $$ broke his fingers',
    'still can\'t get a clean §§?, right $$?',
    'looks like §§ is still too hard for some people. like for example $$.',
    'that stream is boring $$.',
    'i\'m sure next time you\'ll survive $$, even against §§'
]
