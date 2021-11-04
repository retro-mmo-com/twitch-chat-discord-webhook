require('dotenv').config({ path: './auth.env' });

const axios = require('axios');
const tmi = require('tmi.js');
const discord = require('discord.js');

const { stringify } = require("querystring");

const { getUser } = require('./utils/twitchAPI.js');

const users = new Map;

/** @type {import("discord.js").Client} */
const discordClient = new discord.Client();

/** @type {import("tmi.js").Client} */
const twitchClient = new tmi.Client({
    options: { debug: false },
    connection: { reconnect: true, secure: true },
    identity: { username: process.env.TWITCH_USERNAME, password: process.env.TWITCH_OAUTH },
    channels: [process.env.TWITCH_CHANNEL]
});

discordClient.login(process.env.DISCORD_TOKEN);
twitchClient.connect();

discordClient.on('ready', () => {
    console.log('Discord started.');
});

twitchClient.on('connected', () => {
    console.log('Twitch started.');
});

twitchClient.on('message', async (channel, user, message, self) => {

    if (self) return;

    if (users.has(user["display-name"]) === false) {
        users.set(user["display-name"], await getUser(user["display-name"]))
    }

    const userInfo = users.get(user["display-name"]);

    await axios.post(process.env.DISCORD_WEBHOOK, stringify({
        avatar_url: userInfo.profile_image_url,
        content: message,
        username: user["display-name"]
    }), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

});

twitchClient.on('ban', async (channel, username, reason) => {

    await axios.post(process.env.DISCORD_WEBHOOK, stringify({
        avatar_url: 'https://i.imgur.com/tRsH8Ag.png',
        content: `**${username} has been banned from the channel.**`,
        username: "Moderation"
    }), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

});

twitchClient.on('unban', async (channel, username, reason) => {

    await axios.post(process.env.DISCORD_WEBHOOK, stringify({
        avatar_url: 'https://i.imgur.com/tRsH8Ag.png',
        content: `**${username} has been unbanned from the channel.**`,
        username: "Moderation"
    }), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

});

twitchClient.on('timeout', async (channel, username, reason, duration) => {

    await axios.post(process.env.DISCORD_WEBHOOK, stringify({
        avatar_url: 'https://i.imgur.com/tRsH8Ag.png',
        content: `**${username} has been timed out for ${duration} seconds.**`,
        username: "Punishment"
    }), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });
    
});