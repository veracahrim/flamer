require('dotenv').config()
const { Client, Events, GatewayIntentBits } = require('discord.js');
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
   console.log('I am sentient')
    const res = await fetch('https://dps.report/getUploadMetadata?permalink=YQE1-20221019-212542_golem')
    console.log(res)
    const reader = res.body.getReader()
    let read = await reader.read()
    const str = String.fromCharCode.apply(null, read.value)
    console.log(str)
})

client.on(Events.MessageCreate, message => {
    console.log(message.embeds[0].data.url)
});

client.login(process.env.DISCORD_TOKEN)
