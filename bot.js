require('dotenv').config()
const fs = require('fs')
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
    const res = await fetch('https://dps.report/getJson?permalink=YQE1-20221019-212542_golem')
    let body = await res.json()
    console.log(body)
    fs.writeFileSync('test.json', JSON.stringify(body))
})

client.on(Events.MessageCreate, message => {
    console.log(message.embeds[0].data.url)
});

client.login(process.env.DISCORD_TOKEN)
