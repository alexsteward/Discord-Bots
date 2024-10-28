const fs = require('fs');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const path = require('path');
const levelsPath = './levels.json';
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder, Client, SlashCommandBuilder, GatewayIntentBits, MessageActionRow, MessageButton, MessageEmbed, Permissions, EmbedBuilder } = require('discord.js');
const { Sequelize, DataTypes } = require('sequelize');

const prefix = '!'; 
const dataFile = 'points.json';
const token = ("")
const guildId = ("")

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
});

const eightBallResponses = [
    "Yes, definitely.",
    "No, absolutely not.",
    "Ask again later.",
    "It is certain.",
    "Don't count on it.",
    "My sources say no.",
    "Yes, in due time.",
    "I wouldn't count on it.",
];
client.setMaxListeners(200); 


const loadLevelData = () => {
    try {
        if (fs.existsSync(levelsPath)) {
            const rawData = fs.readFileSync(levelsPath, 'utf8');
            const parsedData = JSON.parse(rawData);
            
            if (parsedData && typeof parsedData === 'object' && parsedData.users) {
                return parsedData;
            } else {
                console.warn('Corrupt or invalid level data found. Returning default.');
                return { users: {} };
            }
        }
    } catch (error) {
        console.error('Error loading level data:', error);
    }
    return { users: {} }; 
};

const saveLevelData = (data) => {
    try {
        if (data && typeof data === 'object' && data.users) {
            fs.writeFileSync(levelsPath, JSON.stringify(data, null, 4), 'utf8');
        } else {
            console.error('Invalid level data, not saving.');
        }
    } catch (error) {
        console.error('Error saving level data:', error);
    }
};

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const levelData = loadLevelData();

    if (!levelData.users[message.author.id]) {
        levelData.users[message.author.id] = { level: 1, xp: 0 };
    }

    levelData.users[message.author.id].xp += 5; 
    const userXP = levelData.users[message.author.id].xp;
    if (userXP >= 1000) { 
        levelData.users[message.author.id].level++;
        levelData.users[message.author.id].xp = userXP - 1000; 
        await message.channel.send(`Congratulations ${message.author.username}, you leveled up to level ${levelData.users[message.author.id].level}!`);
    }

    saveLevelData(levelData);

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    if (command === '!level') {
        const userLevelData = levelData.users[message.author.id];
        if (userLevelData) {
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${message.author.username}'s Level Stats`)
                .setThumbnail(message.author.displayAvatarURL())
                .addFields(
                    { name: 'Level', value: `${userLevelData.level}`, inline: true },
                    { name: 'XP', value: `${userLevelData.xp}`, inline: true },
                    { name: 'XP Required for Next Level', value: `1000`, inline: true }
                )
                .setFooter({ text: 'Keep chatting to earn more XP!' })
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
        } else {
            await message.channel.send('You have not earned any XP yet.');
        }
    }

   
    if (command === '!leaderboard') {
        const leaderboard = Object.entries(levelData.users)
            .sort(([, userA], [, userB]) => userB.level - userA.level) 
            .slice(0, 10)
            .map(([userId, userData], index) => `**${index + 1}.** <@${userId}> - Level: ${userData.level}, XP: ${userData.xp}`)
            .join('\n');

        const leaderboardEmbed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('Leaderboard')
            .setDescription(leaderboard || 'No users found.')
            .setTimestamp();

        await message.channel.send({ embeds: [leaderboardEmbed] });
    }
});






const distube = new DisTube(client, {
    plugins: [
        new YtDlpPlugin(), 
        new SpotifyPlugin(), 
    ],
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');

    switch (args[0]) {
        case '!play':
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.reply('You need to be in a voice channel to play music!');

            const song = args.slice(1).join(' ') || 'Never Gonna Give You Up';
            try {
                const songInfo = await distube.play(voiceChannel, song, {
                    member: message.member,
                    textChannel: message.channel,
                    message: message,
                });
                message.channel.send(`Now playing: ${songInfo.name}`);
            } catch (error) {
                console.error(error);
                message.channel.send('An error occurred while trying to play the song.');
            }
            break;

        case '!skip':
            distube.skip(message);
            message.channel.send('Skipped the song!');
            break;

        case '!stop':
            distube.stop(message);
            message.channel.send('Stopped the music!');
            break;

        case '!pause':
            distube.pause(message);
            message.channel.send('Paused the music!');
            break;

        case '!resume':
            distube.resume(message);
            message.channel.send('Resumed the music!');
            break;

        case '!queue':
            const queue = distube.getQueue(message);
            if (!queue) return message.channel.send('There is no music playing!');
            message.channel.send(`Current queue: \n${queue.songs.map((song, index) => `${index + 1}. ${song.name}`).join('\n')}`);
            break;

        case '!nowplaying':
            const nowPlaying = distube.getQueue(message);
            if (!nowPlaying) return message.channel.send('Nothing is currently playing!');
            message.channel.send(`Now playing: ${nowPlaying.songs[0].name}`);
            break;

        case '!volume':
            const volume = parseInt(args[1]);
            if (!isNaN(volume)) {
                distube.setVolume(message, volume);
                message.channel.send(`Volume set to: ${volume}`);
            } else {
                message.channel.send('Please provide a valid volume number (1-100).');
            }
            break;
        case '!previous':
            distube.previous(message);
            message.channel.send('Playing the previous song!');
            break;

        case '!shuffle':
            distube.shuffle(message);
            message.channel.send('Shuffled the queue!');
            break;

        default:
            break;
    }
});









client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kyu') {
            const kyuuEmbed = {
                color: 0xFFFFFF, 
                title: '**__Kyū Rankings__**',
                description: `
\`▪️ Rankings are divided into two categories: Kyu & Dan\`
\`▪️ Kyu is the lower level which has 10 rankings.\` 
\`▪️ Dan is the upper level which has 10 rankings.\`

*Kyu is the beginner level which is noob-friendly.*
*Kyu represents the beginning stages of learning to PvP*
*or the transitioning stages of focusing on the fundamentals*
*of PvP and how to actually dominate the playing field.*

<@&1294396756137873470> – **Beginner I:** (100)
<@&1294396808251965563> – **Beginner II:** (200)
<@&1294396807639470100> – **Novice I:** (300)
<@&1294396806918311976> – **Novice II:** (400)
<@&1294396805827530893> – **Intermediate I:** (500)
<@&1294396804133027890> – **Intermediate II:** (600)
<@&1294397053425946624> – **Intermediate III:** (700)
<@&1294397054918983690> – **Proficient:** (800)
<@&1294397056881918004> – **Adept:** (900)
<@&1294397157499080877> – **Skilled:** (1000)
                `,
            };

            try {
                await message.channel.send({ embeds: [kyuuEmbed] });
                console.log('Kyū rankings embed sent'); 
            } catch (error) {
                console.error('Error sending Kyū rankings embed:', error);
            }
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kyu1') {
            const kyuuEmbed = {
                color: 0xFFFFFF, 
                title: '**More Information**',
                description: `
The number you see is a visual representation of the skill required
to ascend to the next tier of skill. The acension could be as simple
as learning to flick faster, block clutch more often, or wtap.
It all depends on the users current level and their areas of improvement.

Everyone starts off at 100 and has to prove their current level to rank-up.
To do this you can either 1v1 someone and have the Sensei watch, duel the Sensei
himself, or send clips to the Sensei of your successes.

If you have any questions don't hesitate to contact the <@&1294398564755312710>
                `,
            };

            try {
                await message.channel.send({ embeds: [kyuuEmbed] });
                console.log('Kyū rankings embed sent'); 
            } catch (error) {
                console.error('Error sending Kyū rankings embed:', error);
            }
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'dan') {
            const kyuuEmbed = {
                color: 0xff0000, 
                title: '**__Dan Rankings__**',
                description: `
\`▪️ Rankings are divided into two categories: Kyu & Dan\`
\`▪️ Kyu is the lower level which has 10 rankings.\` 
\`▪️ Dan is the upper level which has 10 rankings.\`

*Dan is the superior level which represents mastery stages,*
*to achieve this level you must know all the fundamentals which*
*include but are not limited to: blockhitting, wtap, stap..etc*

<@&1294397769779511406> – **Advanced I:** (1100)
<@&1294397770689413210> – **Advanced II:** (1200)
<@&1294397810871107645> - **Advanced III:** (1300)
<@&1294397812485656667> - **Expert I:** (1400)
<@&1294397765777883138> - **Expert II:** (1500)
<@&1294397767279575091> - **Master:** (1600)
<@&1294397809176481885> - **Senior Master:** (1700)
<@&1294397767841742938> - **Grandmaster:** (1800)
<@&1294397766474403953> - **Shihan:** (1900)
<@&1294397759637684347> - **Soke:** (2000)
                `,
            };

            try {
                await message.channel.send({ embeds: [kyuuEmbed] });
                console.log('Kyū rankings embed sent'); 
            } catch (error) {
                console.error('Error sending Kyū rankings embed:', error);
            }
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'dan1') {
            const kyuuEmbed = {
                color: 0xff0000, 
                title: '**More Information**',
                description: `
To begin Dan you must know all the vital fundamentals
for 1.8.9 MC PvP. Once you accomplish that, you're considered
advanced as you're in the 1% of all minecraft players.

Ranking up in Dan is harder than Kyu, as it requires 
mastery rather than development. To advance you must 'perfect'
or severely improve all the vital fundamentals to a god
like state. 

To achieve the final Soke ranking you must either beat the Sensei
or have a very close duel with him. Ranking up in dan is not for the weak.
                `,
            };

            try {
                await message.channel.send({ embeds: [kyuuEmbed] });
                console.log('Kyū rankings embed sent'); 
            } catch (error) {
                console.error('Error sending Kyū rankings embed:', error);
            }
        }
    }
});




client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        if (command === 'rank') {
            const kyuuEmbed = {
                color: 0x0000FF, 
                title: '**__Dojo MFM Rankings__**', 
                description: `

*MFM (Mode for Mode) means that regardless of the mode, what player* 
*is clearly above the other players. To have a higher position*
*on this leaderboard, you need to have a higher ranking which is obtained*
*by perfecting your weaknesses and improving your strengths.*

:first_place: **San-Kyū** - GrimZz0 (875)
:second_place: **Shichi-kyū** - ZackSlays (445)
:third_place: **Hachi-kyū** - Taco_The_Mexican (375)
:scales: **Probation** - PNTX28 (0)
                `,
                footer: {
                    text: `Last updated: ${new Date().toLocaleString()}`, 
                },
                timestamp: new Date(), 
            };

            try {
                await message.channel.send({ embeds: [kyuuEmbed] });
                console.log('Kyū rankings embed sent'); 
            } catch (error) {
                console.error('Error sending Kyū rankings embed:', error);
            }
        }
    }
});




client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'rank2') {
            const kyuuEmbed = {
                color: 0x0000FF, 
                title: '**Dueling Information**',
                description: `
If you feel confident you can beat someone above your rank,
then you're able to formally challenge them to a moderated duel.
The duel must be spectated by the Sensei and the opposing party is 
not obligated to accept this duel.

If you beat the opposing party and they are higher than you, then you'll
be granted their base rank numerical value. (EX: if they're 850 you'll be 800)

However, by sending or accepting duels you put your ranking points on the line.
If you don't perform according to your rank level, you WILL LOSE ranking points 
regardless of whether or not you win. If you accept a formal duel from a lower level 
player and you perform poorly, you could end up loosing points.

Now, you can duel anyone freely but this only applys to FORMAL DUELS which 
requires the Sensei to be present. On the upside, if you challenge someone 
or accept a request and you lose but you performed better than your level, 
you'll gain points.

**Formal Duels:** Require two modes which consist of three rounds in each mode
                `,
            };

            try {
                await message.channel.send({ embeds: [kyuuEmbed] });
                console.log('Kyū rankings embed sent'); 
            } catch (error) {
                console.error('Error sending Kyū rankings embed:', error);
            }
        }
    }
});


client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'students') {
            const kyuuEmbed = {
                color: 0x00FF00, 
                title: '**Current Students**',
                description: `

*This does not display the direct rankings of the students*
*but instead shows the order in which the students joined *
*the Dojo from top being oldest to bottom being newest.*

:martial_arts_uniform: **San-Kyū** - GrimZz0 (875)
:martial_arts_uniform: **Probation** - PNTX28 (0)
:martial_arts_uniform: **Kyū-Kyū** - ZackSlays (375)
:martial_arts_uniform: **Kyū-Kyū** - Taco_The_Mexican (445)


                `,
                footer: {
                    text: `Last updated: ${new Date().toLocaleString()}`, 
                },
                timestamp: new Date(), 
            };

            try {
                await message.channel.send({ embeds: [kyuuEmbed] });
                console.log('Kyū rankings embed sent'); 
            } catch (error) {
                console.error('Error sending Kyū rankings embed:', error);
            }
        }
    }
});




client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'students1') {
            const kyuuEmbed = {
                color: 0x808080 , 
                title: '**Former Students**',
                description: `

*This shows the list of previous students of the Dojo*
*It is ranked from most skilled to least skilled with*
*the advanced students at the top*

:martial_arts_uniform: **Kudan** - Tqsr (1975) 
:martial_arts_uniform: **Nidan** - MLPatches (1225)

                `,
                footer: {
                    text: `Last updated: ${new Date().toLocaleString()}`, 
                },
                timestamp: new Date(), 
            };

            try {
                await message.channel.send({ embeds: [kyuuEmbed] });
                console.log('Kyū rankings embed sent'); 
            } catch (error) {
                console.error('Error sending Kyū rankings embed:', error);
            }
        }
    }
});



client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'alumni') {
            const kyuuEmbed = {
                color: 0xFFD700 , 
                title: '**Honored Alumni**',
                description: `


:star2: **Tqsr**     \`\`\`San-Kyū (850) -> Kudan (1975)\`\`\`

:star2: **MLPatches**     \`\`\`Hachi-Kyū (300) -> Nidan (1225)\`\`\`

                `,
                footer: {
                    text: `Last updated: ${new Date().toLocaleString()}`, 
                },
                timestamp: new Date(), 
            };

            try {
                await message.channel.send({ embeds: [kyuuEmbed] });
                console.log('Kyū rankings embed sent'); 
            } catch (error) {
                console.error('Error sending Kyū rankings embed:', error);
            }
        }
    }
});






const commands = [
    {
        name: 'promo',
        description: 'Promote a player.',
        options: [
            {
                type: 3, 
                name: 'username',
                description: 'Username of the player to promote',
                required: true,
            },
            {
                type: 4,
                name: 'points',
                description: 'Points for the player',
                required: true,
            },
            {
                type: 8,
                name: 'current_rank',
                description: 'Current rank of the player',
                required: true,
            },
            {
                type: 8,
                name: 'next_rank',
                description: 'Next rank for the player',
                required: true,
            },
        ],
    },
    {
        name: 'duel',
description: 'Initiate a duel between two players.',
options: [
    {
        type: 3, 
        name: 'player1',
        description: 'Name of Player 1',
        required: true,
    },
    {
        type: 3, 
        name: 'player2',
        description: 'Name of Player 2',
        required: true,
    },
    {
        type: 3, 
        name: 'mode1',
        description: 'First game mode',
        required: true,
    },
    {
        type: 3,
        name: 'mode2',
        description: 'Second game mode',
        required: true,
    },
    {
        type: 3, 
        name: 'rank1',
        description: 'Rank of Player 1',
        required: true,
    },
    {
        type: 3,
        name: 'points1',
        description: 'Points for Player 1',
        required: true,
    },
    {
        type: 3,
        name: 'rankpts1',
        description: 'Rank of Player 1',
        required: true,
    },
    {
        type: 3, 
        name: 'rankpts2',
        description: 'Rank of Player 2',
        required: true,
    },
    {
        type: 3, 
        name: 'rank2',
        description: 'Rank of Player 2',
        required: true,
    },
    {
        type: 3, 
        name: 'points2',
        description: 'Points for Player 2',
        required: true,
    },
    {
        type: 3, 
        name: 'round1_score',
        description: 'Score for Round 1 (Player1 - Player2)',
        required: true,
    },
    {
        type: 3, 
        name: 'round2_score',
        description: 'Score for Round 2 (Player1 - Player2)',
        required: true,
    },
]
}
];
         


client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'duel') {
        const player1Name = options.getString('player1');
        const player1Rank = options.getString('rank1');
        const player1rankpts = options.getString('rankpts1');
        const player1Points = options.getString('points1');
        const player2Name = options.getString('player2');
        const player2Rank = options.getString('rank2');
        const player2rankpts = options.getString('rankpts2');
        const player2Points = options.getString('points2');
        const round1Score = options.getString('round1_score');
        const round2Score = options.getString('round2_score');

        const player1Emoji = player1Points > 0 ? '<:greenarrowup:1294821251155628135>' :
            player1Points < 0 ? '<:redarrowdown:1295047516051476683>' :
            '<:equal:1295047751968751646>';

        const player2Emoji = player2Points > 0 ? '<:greenarrowup:1294821251155628135>' :
            player2Points < 0 ? '<:redarrowdown:1295047516051476683>' :
            '<:equal:1295047751968751646>';

        const kyuuEmbed = {
            color: 0x000000,
            title: ` <a:fight:1296197608552792144> **${player1Name}** vs  **${player2Name}** <a:fight:1296197608552792144>`,
            description: `
__Round 1 (${options.getString('mode1')})__
${player1Name} \`${round1Score}\` ${player2Name}

__Round 2 (${options.getString('mode2')})__
${player1Name} \`${round2Score}\` ${player2Name}

Mode(s): ${options.getString('mode1')} & ${options.getString('mode2')}

<a:crown1:1296196397824999574> **${player1Rank}** ${player1Name} (${player1rankpts}) ${player1Emoji} ${player1Points}pts
<:sword3:1296196016814690347> Vs.
:x: **${player2Rank}** ${player2Name} (${player2rankpts}) ${player2Emoji} ${player2Points}pts
            `,
            footer: {
                text: `Last updated: ${new Date().toLocaleString()}`, 
            },
            timestamp: new Date(), 
        };

        try {
            await interaction.reply({ embeds: [kyuuEmbed] });
            console.log('Kyū rankings embed sent'); 
        } catch (error) {
            console.error('Error sending Kyū rankings embed:', error);
        }
    }
});











client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'promo') {
        const username = options.getString('username');
        const points = options.getInteger('points');
        const currentRank = options.getRole('current_rank');
        const nextRank = options.getRole('next_rank');

        const embed = new EmbedBuilder()
            .setColor('#000000') 
            .setTitle('🎉 Promotions 🎉')
            .setDescription(`:martial_arts_uniform: **${username}** (${points}) ${currentRank} <:side:1294821039511175232> ${nextRank}`)
            .setTimestamp()
            .setFooter({ text: 'Congratulations on your promotion!' });

        await interaction.reply({ embeds: [embed], ephemeral: false });
    }
});




client.on('ready', async () => {
    console.log('Client has been logged into!');

    const rest = new REST({ version: '9' }).setToken(token);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), {
            body: commands,
        });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});


client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase().startsWith('!8ball')) {
        const response = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
        const question = message.content.split(' ').slice(1).join(' ');
        if (!question) {
            await message.channel.send("Please ask a question!");
        } else {
            await message.channel.send(`🎱 ${response}`);
        }
    }
});


const nodebuffDB = new Sequelize({
    dialect: 'sqlite',
    storage: 'nodebuff.sqlite',
});

const bridgesDB = new Sequelize({
    dialect: 'sqlite',
    storage: 'bridges.sqlite',
});

const NodebuffUser = nodebuffDB.define('User', {
    username: {
        type: DataTypes.STRING,
        unique: true,
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
});

const BridgesUser = bridgesDB.define('User', {
    username: {
        type: DataTypes.STRING,
        unique: true,
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
});

const SENSEI_ROLE_ID = '1294398564755312710';

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith('!points')) {
        const hasSenseiRole = message.member.roles.cache.has(SENSEI_ROLE_ID);
        if (!hasSenseiRole) {
            return message.reply('You do not have permission to use this command.');
        }

        const args = message.content.split(' ').slice(1);
        const command = args[0]; 
        const username = args[1]; 
        const pointsValue = parseInt(args[2]); 
        const leaderboard = args[3]; 

        if (!username || (command !== 'remove' && isNaN(pointsValue) && command !== 'leaderboard') || !leaderboard) {
            return message.reply('Usage: !points <add|change|remove> <username> <points> <leaderboard(nodebuff|bridges)>');
        }

        const UserModel = leaderboard === 'bridges' ? BridgesUser : NodebuffUser;

        let user = await UserModel.findOne({ where: { username } });

        if (command === 'add') {
            if (user) {
                user.points += pointsValue;
                await user.save();
                message.channel.send(`Added ${pointsValue} points to ${username} in the ${leaderboard} leaderboard. Total points: ${user.points}`);
            } else {
                user = await UserModel.create({ username, points: pointsValue });
                message.channel.send(`User ${username} created with ${pointsValue} points in the ${leaderboard} leaderboard.`);
            }
        } else if (command === 'change') {
            if (user) {
                user.points = pointsValue;
                await user.save();
                message.channel.send(`Changed points for ${username} in the ${leaderboard} leaderboard. Total points: ${user.points}`);
            } else {
                message.reply(`User ${username} does not exist in the ${leaderboard} leaderboard.`);
            }
        } else if (command === 'remove') {
            if (user) {
                await UserModel.destroy({ where: { username } });
                message.channel.send(`Removed ${username} from the ${leaderboard} leaderboard.`);
            } else {
                message.reply(`User ${username} does not exist in the ${leaderboard} leaderboard.`);
            }     
        }
    }

});





client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!nodebuff')) {
        const senseiRankThreshold = 1000; 

        const users = await NodebuffUser.findAll({
            where: {
                points: {
                    [Sequelize.Op.lt]: senseiRankThreshold,
                },
            },
            order: [['points', 'ASC']], 
            limit: 10, 
        });

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('<:heal:1295089966015053835> __NoDebuff Leaderboard__ <:heal:1295089966015053835>')
            .setDescription('*The ranking is based on the lowest amount of pots you can get the Sensei to. \n Only your best attempt is recorded.*');

        const userEntries = users.map((user, index) => (
            `${index + 1}. ${user.username} <:heal:1295089966015053835> - ${user.points}`
        )).join('\n'); 
        const fields = [{
            name: 'Rankings:', 
            value: userEntries || 'No users available.', 
            inline: false,
        }];
        
        embed.addFields(fields);

        message.channel.send({ embeds: [embed] });
    }
});

client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!bridges')) {
        const senseiRankThreshold = 1000; 

        const users = await BridgesUser.findAll({
            where: {
                points: {
                    [Sequelize.Op.lt]: senseiRankThreshold,
                },
            },
            order: [['points', 'DESC']], 
            limit: 10, 
        });

        const embed = new EmbedBuilder()
            .setColor('#ffcc00')
            .setTitle('<:block:1295149854796021912> __Bridges Leaderboard__ <:block:1295149854796021912>')
            .setDescription('*The ranking is based on the most amount of points you can get against the sensei. \n Only your best attempt will be recorded here.*')
        const userEntries = users.map((user, index) => (
            `${index + 1}. ${user.username} <:block:1295149854796021912> - ${user.points}`
        )).join('\n');

        const fields = [{
            name: 'Rankings:',
            value: userEntries || 'No users available.', 
            inline: false, 
        }];

        embed.addFields(fields);

        message.channel.send({ embeds: [embed] });
    }
});


client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase().startsWith('!roll')) {
        const args = message.content.split(' ');
        const sides = parseInt(args[1]) || 6; 
        const roll = Math.floor(Math.random() * sides) + 1;
        await message.channel.send(`You rolled a **${roll}**! 🎲`);
    }
});

client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase().startsWith('!coinflip')) {
        const result = Math.random() < 0.5 ? "Heads" : "Tails";
        await message.channel.send(`🪙 It's **${result}**!`);
    }
});

let leaderboard = JSON.parse(fs.readFileSync('./bots.json', 'utf8'));










client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith('!bts')) {
        const hasSenseiRole = message.member.roles.cache.has(SENSEI_ROLE_ID);
        if (!hasSenseiRole) {
            return message.reply('You do not have permission to use this command.');
        }

        const args = message.content.split(' ').slice(1);
        const command = args[0]; 
        const username = args[1]; 
        const level = parseInt(args[2]); 
        const potsRemaining = parseInt(args[3]); 

      
        if (!username || (command !== 'remove' && (isNaN(level) || isNaN(potsRemaining)))) {
            return message.reply('Usage: !bts <add|change|remove> <username> <level> <pots remaining>');
        }

        if (command === 'add') {
            leaderboard[username] = { level, potsRemaining };
            fs.writeFileSync('./bots.json', JSON.stringify(leaderboard, null, 2));  
            message.channel.send(`Added ${username} - Level: ${level} - Pots Remaining: ${potsRemaining}`);
        } else if (command === 'change') {
            if (leaderboard[username]) {
                leaderboard[username].level = level;
                leaderboard[username].potsRemaining = potsRemaining;
                fs.writeFileSync('./bots.json', JSON.stringify(leaderboard, null, 2));
                message.channel.send(`Changed ${username} to Level: ${level} - Pots Remaining: ${potsRemaining}`);
            } else {
                message.reply(`User ${username} does not exist in the leaderboard.`);
            }
        } else if (command === 'remove') {
            if (leaderboard[username]) {
                delete leaderboard[username];
                fs.writeFileSync('./bots.json', JSON.stringify(leaderboard, null, 2)); 
                message.channel.send(`Removed ${username} from the leaderboard.`);
            } else {
                message.reply(`User ${username} does not exist in the leaderboard.`);
            }
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.content === '!bots') {
        const potsThreshold = -30; 

        const filteredUsers = Object.entries(leaderboard)
            .filter(([_, entry]) => entry.potsRemaining >= potsThreshold) 

        if (filteredUsers.length === 0) {
            return message.channel.send('No users meet the criteria for the leaderboard.');
        }

        filteredUsers.forEach(([key, entry], index) => {
            const { username, level, potsRemaining, avatarUrl } = entry;

            const embed = new EmbedBuilder()
                .setTitle(`Rank #${index + 1}: ${username}`)
                .setDescription(`**[${level}]:** ${potsRemaining}<:heal:1295089966015053835> pots left`)
                .setThumbnail(avatarUrl) 
                .setColor(0x00AE86);

            message.channel.send({ embeds: [embed] });
        });
    }
});






client.on('messageCreate', async (message) => {
    if (message.content === '!botsinfo') { 

        const embed = new EmbedBuilder()
            .setTitle('🏆 **Bots Leaderboard Ranking Guide** 🏆')
            .setDescription(
                "Welcome to the **Ultimate Bots Leaderboard**! 🧪✨ Here's how you can claim your spot at the top:\n\n" +
                "Your rank is based on how many **potions** you have won by defeating bots. The more potions you win with, the higher you climb! \n" 
            )
            .addFields(
                { 
                    name: '📊 **How Rankings Work**', 
                    value: 'Players are ranked based on their scores. \n\n🌟 The higher your score, the better! A higher score reflects how many **potions** you’ve won by defeating bots. This showcases your skill and strategy in potion management. 🧙‍♂️\n' 
                },
                { 
                    name: '🔮 **Ranking Breakdown**', 
                    value: '1. Players with the **highest scores** rank highest. 💥\n' + 
                           '2. If you haven’t beaten a bot yet, your score will be **negative**, indicating how many potions that bot has left.\n' +
                           '3. Once you defeat a bot, your score updates to reflect how many potions you won by, turning the negative into a positive! 📈\n'
                },
                { 
                    name: '⚔️ **Bot Levels & Rank Priority**', 
                    value: '**Bot levels** are crucial for rank priority. You must beat one bot to move on to the next. While advancing is optional, if you choose to stay at your current bot level, you can maximize your score up to 28. However, you will be forced to move on once you reach this cap against that bot.\n\n' +
                           '🏆 If someone is at **Expert** with a score of -20 and another player is at **Hard** with a score of 23, the Expert player would rank higher due to the difficulty tier! \n'
                },
                { 
                    name: '🎮 **Bot Levels**', 
                    value: 'Bots come in various difficulty levels: **Easy, Medium, Hard, Expert, and Hacker**.\n\n' +
                           '⚠️ **Note:** The jump from Medium to Hard is significant, and **Hacker** bots are extremely challenging, often considered nearly impossible to beat! 🏆\n'
                },
                { 
                    name: '📝 **Example**', 
                    value: 'Imagine **User1** has a score of +3 after defeating a bot, meaning they won by 3 potions. If **User2** has a score of -5, it means they haven’t beaten that bot yet and the bot still has 5 potions left. 🚀\n'
                },
                { 
                    name: '👑 **Pro Tip**', 
                    value: 'Want to rank up faster? Use your potions wisely and keep track of your scores on the leaderboard to maximize your winning potential! 💪'
                }
            )
            .setColor(0x00AE86)
            .setThumbnail('https://minotar.net/avatar/Steve/128') 
            .setFooter({ text: 'Rank up by using your potions wisely and stay on top of the leaderboard!' });

        message.channel.send({ embeds: [embed] });
    }
});





client.login(token);