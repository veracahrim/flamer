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
    const res = await fetch('https://dps.report/getJson?permalink=0x1M-20221017-220008_sh')
    let body = await res.json()
    for (let player of body.players) {
        if (player.deathRecap) {
            console.log(`${player.name} died to ${body.fightName}, LOL`)
        }
    }
})

client.on(Events.MessageCreate, message => {
    console.log(message.embeds[0].data.url)
});

client.login(process.env.DISCORD_TOKEN)
