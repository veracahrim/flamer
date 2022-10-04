const dotenv = require('dotenv')

dotenv.config()

const {Client} = require('discord.js');

const client = new Client({
    intents: [
        1,
        2,512,32768, 2048
    ],
})

client.login(process.env.DISCORD_TOKEN)

client.on('messageCreate', async (msg) => {
    console.log(msg)
    if (!msg.author.bot) {
        msg.author.send(`HEHE ${msg.content}`)
    }
})
