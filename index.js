const { Client, Intents, MessageActionRow, MessageButton, MessageEmbed, Permissions } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const prefix = '!'; // Your bot's prefix

const token = ("Put Token Here")





client.on('ready', async () => { 
    console.log('Client has been logged into! ');
});





client.on('messageCreate', async (message) => { 
    if (message.content.toLowerCase() === "test") {
        message.reply("Test successful!").catch(err => console.error(err));
    }
});


client.on('messageCreate', async message => {
    if (message.content.toLowerCase() === '!regionroles') {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('**Region Roles**')
            .setDescription('`Click on the region that applies to you to get the role!`\n\n🌍 Europe\n🌏 Asia\n🌊 Oceania\n🌎 Americas');

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('role_europe')
                    .setLabel('Europe 🌍')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('role_asia')
                    .setLabel('Asia 🌏')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('role_oceania')
                    .setLabel('Oceania 🌊')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('role_americas')
                    .setLabel('Americas 🌎')
                    .setStyle('PRIMARY')
            );

        try {
            const sentMessage = await message.channel.send({ embeds: [embed], components: [row] });
            const filter = i => i.user.id === message.author.id;
            const collector = sentMessage.createMessageComponentCollector({ filter, time: 15000 });

            collector.on('collect', async interaction => {
                // Handle role assignment based on custom ID
                switch (interaction.customId) {
                    case 'role_europe':
                        await handleRole(interaction, 'Europe');
                        break;
                    case 'role_asia':
                        await handleRole(interaction, 'Asia');
                        break;
                    case 'role_oceania':
                        await handleRole(interaction, 'Oceania');
                        break;
                    case 'role_americas':
                        await handleRole(interaction, 'Americas');
                        break;
                    default:
                        break;
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    sentMessage.edit({ embeds: [embed.setDescription('`Region Roles` session has timed out. Please run the command again to select roles.')] });
                } else {
                    sentMessage.edit({ components: [] }); // Remove buttons after interaction
                }
            });

        } catch (err) {
            console.error('Error sending message or creating collector:', err);
        }
    }
});

async function handleRole(interaction, roleName) {
    const member = interaction.member;
    const guild = interaction.guild;

    // Get the role by name
    const role = guild.roles.cache.find(role => role.name === roleName);

    if (!role) {
        return interaction.reply({ content: `Role ${roleName} not found!`, ephemeral: true });
    }

    // Check if the member already has the role
    if (member.roles.cache.has(role.id)) {
        return interaction.reply({ content: `You already have the ${roleName} role!`, ephemeral: true });
    }

    // Add the role to the member
    try {
        await member.roles.add(role);
        interaction.reply({ content: `You've been given the ${roleName} role!`, ephemeral: true });
    } catch (error) {
        console.error('Error adding role:', error);
        interaction.reply({ content: 'Failed to add role. Please try again later.', ephemeral: true });
    }
}




client.on('messageCreate', async message => {
     if (message.content.toLowerCase() === '!pronouns') {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('**Pronoun Roles**')
            .setDescription('`Click on the pronoun that applies to you to get the role!`\n\n♂️ He/Him\n♀️ She/Her\n⚧️ They/Them');

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('pronoun_he_him')
                    .setLabel('He/Him')
                    .setStyle('PRIMARY')
                    .setEmoji('♂️'),
                new MessageButton()
                    .setCustomId('pronoun_she_her')
                    .setLabel('She/Her')
                    .setStyle('PRIMARY')
                    .setEmoji('♀️'),
                new MessageButton()
                    .setCustomId('pronoun_they_them')
                    .setLabel('⚧️ They/Them')
                    .setStyle('PRIMARY')
            );

        // Send the embed message with buttons
        await message.channel.send({ embeds: [embed], components: [row] })
            .catch(err => {
                console.error('Error sending message:', err);
            });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const guild = interaction.guild;
    const member = guild.members.cache.get(interaction.user.id);

    if (!member) {
        interaction.reply({ content: "Unable to find your member information.", ephemeral: true });
        return;
    }

    let roleID;

    switch (interaction.customId) {
        case 'pronoun_he_him':
            roleID = '1259282032270377050'; // Replace with actual role ID for He/Him
            break;
        case 'pronoun_she_her':
            roleID = '1259282060585992315'; // Replace with actual role ID for She/Her
            break;
        case 'pronoun_they_them':
            roleID = '1259282111974736004'; // Replace with actual role ID for They/Them
            break;
        default:
            interaction.reply({ content: "Unknown pronoun selection.", ephemeral: true });
            return;
    }

    try {
        const role = guild.roles.cache.get(roleID);
        if (!role) {
            interaction.reply({ content: "Unable to find the specified role.", ephemeral: true });
            return;
        }

        await member.roles.add(roleID);
        interaction.reply({ content: `You have been assigned the ${role.name} role!`, ephemeral: true });
    } catch (error) {
        console.error('Error assigning role:', error);
        interaction.reply({ content: "There was an error while assigning the role.", ephemeral: true });
    }
});


client.on('messageCreate', async message => {
    if (message.content.toLowerCase() === '!notifications') {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('**Notification Roles**')
            .setDescription('`Click on the notification that applies to you to get the role!`\n\n🎉 Events\n🛠️ Crafter\n🌾 Gatherer');

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('notification_events')
                    .setLabel('🎉 Events')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('notification_crafter')
                    .setLabel('🛠️ Crafter')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('notification_gatherer')
                    .setLabel('🌾 Gatherer')
                    .setStyle('PRIMARY')
            );

        // Send the embed message with buttons
        await message.channel.send({ embeds: [embed], components: [row] })
            .catch(err => {
                console.error('Error sending message:', err);
            });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const guild = interaction.guild;
    const member = guild.members.cache.get(interaction.user.id);

    if (!member) {
        interaction.reply({ content: "Unable to find your member information.", ephemeral: true });
        return;
    }

    let roleID;

    switch (interaction.customId) {
        case 'notification_events':
            roleID = '1259249943005106237'; // Replace with actual role ID for Events
            break;
        case 'notification_crafter':
            roleID = '1259249968527442032'; // Replace with actual role ID for Crafter
            break;
        case 'notification_gatherer':
            roleID = '1259282325703884870'; // Replace with actual role ID for Gatherer
            break;
        default:
            interaction.reply({ content: "Unknown notification selection.", ephemeral: true });
            return;
    }

    try {
        const role = guild.roles.cache.get(roleID);
        if (!role) {
            interaction.reply({ content: "Unable to find the specified role.", ephemeral: true });
            return;
        }

        await member.roles.add(roleID);
        interaction.reply({ content: `You have been assigned the ${role.name} role!`, ephemeral: true });
    } catch (error) {
        console.error('Error assigning role:', error);
        interaction.reply({ content: "There was an error while assigning the role.", ephemeral: true });
    }
});

client.on('messageCreate', async message => {
    if (message.content.toLowerCase() === '!welcome') {
        const channel = message.channel;

        const welcomeMessagePart1 = `
**Welcome to the Enmity [ENM] Discord Server!** :shield:

We are a vibrant community committed to active warring and engaging social activities. Join us for thrilling guild wars, exciting community events, awesome giveaways, intense raids, challenging dungeon runs, XP parties, and a plethora of other fun activities! No matter your playstyle, there's a place for you in Enmity!

**Community Guidelines** :heart:
> These are our community guidelines. We expect all members to follow them at all times to ensure a positive environment for everyone.

**Respect Each Other**
> We believe in creating a friendly and welcoming community. Treat everyone with kindness and respect. Remember, we are here to make friends and have fun, so please be considerate and polite in all interactions. Our goal is to foster an environment where everyone feels valued and included.

**Communicate Safely**
> <:checkmark:1262747189382352957> Be cautious about sharing personal information. Protect your privacy and avoid disclosing sensitive details to strangers.
> <:checkmark:1262747189382352957> Avoid clicking on links from unknown sources to protect your device and Discord account from potential security risks.
> <:checkmark:1262747189382352957> Refrain from buying or selling goods on our server to prevent scams and maintain a safe environment for all members.
\n
`;

        const welcomeMessagePart2 = 
        ` \n
_  _
**General Rules** 
> <:arrowright:1262747167316119693> Use appropriate language and keep conversations family-friendly. Respect the diverse backgrounds and age groups in our community.
> <:arrowright:1262747167316119693> Steer clear of controversial topics in text chat. Mature discussions are allowed in voice channels if handled respectfully.
> <:arrowright:1262747167316119693> Any form of threats, death wishes, or encouragement of self-harm is strictly prohibited and will result in an immediate ban.
> <:arrowright:1262747167316119693> Scamming, including selling products or services, is forbidden. If your account is compromised, secure it immediately and contact us.
> <:arrowright:1262747167316119693> Promoting your social media and sharing creative work is encouraged. However, recruiting for other guilds or advertising other Discord servers is not allowed.
> <:arrowright:1262747167316119693> Spamming is not allowed. Keep the chat clean and avoid flooding channels with repeated messages.
> <:arrowright:1262747167316119693> Hate speech or discriminatory remarks based on race, religion, sexual orientation, gender identity, or any other personal characteristic are strictly prohibited.

     :white_check_mark:  Applications Currently Open!  <#1262748039244812370>  
\n https://discord.gg/u8YTq9ZHj8`;

        try {
            await channel.send(welcomeMessagePart1);
            await channel.send(welcomeMessagePart2);
        } catch (error) {
            console.error('Error sending welcome message:', error);
        }
    }
});



client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase() === '!apply') { // Command to trigger application process
        const member = message.member;
        const guild = message.guild;

        // Check if the member has the necessary roles to create the application channel
        const requiredRoles = ['Emperor', 'Archduke', 'Justiciar'];
        const roles = guild.roles.cache.filter(role => requiredRoles.includes(role.name));

        if (roles.size !== requiredRoles.length) {
            return message.reply('Not all required roles exist in this server.');
        }

        try {
            // Create a new channel for the application
            const channelName = `app-${member.user.username}`;
            const category = guild.channels.cache.find(channel => channel.type === 'GUILD_CATEGORY' && channel.name === '⎯⎯⎯⎯⎯⎯⎯⎯[ Tickets ]⎯⎯⎯⎯⎯⎯⎯⎯⎯'); // Adjust category name as needed
            if (!category) {
                throw new Error('Category not found.');
            }

            const permissionOverwrites = [
                {
                    id: guild.roles.everyone,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL],
                },
                {
                    id: member.user.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL],
                }
            ];

            roles.forEach(role => {
                permissionOverwrites.push({
                    id: role.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL],
                });
            });

            const applicationChannel = await guild.channels.create(channelName, {
                type: 'GUILD_TEXT',
                parent: category.id,
                permissionOverwrites,
            });

            // Send application questions in the new channel
            await applicationChannel.send(`**Application Form for ${member.user.username}**\n\nPlease answer the following questions:\n\n1. In-Game Username:\n2. Country and Timezone:\n3. Age (optional):\n4. Main class and level?:\n5. How often, and for how long do you usually play on Wynncraft?:\n6. What do you like doing in Wynncraft?:\n\n- How can you contribute to the guild?:\n- Previous guild affiliations, if any:\n- Interested in warring? (optional):\n- Were you referred to the guild? If you were, who was it? (optional)\n- Additional information (optional):\n`);

            // Notify user about the application channel
            await member.send(`Your application channel (${applicationChannel}) has been created. Please check it to proceed with your application.`);

        } catch (error) {
            console.error('Error creating application channel:', error);
            message.reply('There was an error creating your application channel. Please try again later.');
        }
    }
});



client.on('messageCreate', async message => {
    if (message.content.startsWith('!purge')) {
        // Check if the user has permission to manage messages
        if (!message.member.permissions.has('MANAGE_MESSAGES')) {
            return message.reply('You do not have permission to use this command.');
        }

        // Extract the number of messages to delete
        const args = message.content.split(' ');
        if (args.length !== 2 || isNaN(args[1])) {
            return message.reply('Invalid command usage. Please use !purge [number]');
        }
        const numToDelete = parseInt(args[1]);

        // Check if the number of messages to delete is within a reasonable range
        if (numToDelete <= 0 || numToDelete > 100) {
            return message.reply('You can only delete between 1 and 100 messages at a time.');
        }

        try {
            // Fetch messages and delete them
            const fetchedMessages = await message.channel.messages.fetch({ limit: numToDelete + 1 });
            await message.channel.bulkDelete(fetchedMessages, true);

            // Success message
            const successMessage = await message.channel.send(`Successfully deleted ${fetchedMessages.size - 1} messages.`);
            setTimeout(() => successMessage.delete(), 3000); // Delete the success message after 3 seconds
        } catch (error) {
            console.error('Error deleting messages:', error);
            if (error.message.includes('Invalid Form Body')) {
                message.reply('An error occurred while deleting messages. Make sure the messages are not older than 14 days and try again.');
            } else {
                message.reply('There was an error deleting messages.');
            }
        }
    }
});


client.on('messageCreate', async message => {
    if (message.content.toLowerCase() === `${prefix}roles`) {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Welcome to the guild! :heart:')
            .setDescription(`Since you joined, you probably know what you're getting into but in short, we are a community & war focused guild with some other Wynn related aspects. You'll find all sorts of guild-related information in this channel.\n\n**Guild Hierarchy**\n
            <@&1262595478034317332> <:5star:1262747302053937223> Owner
            <@&1262595746180497541> <:4star:1262747285985431575> Chief
            <@&1262595786223390825> <:3star:1262747271594901574> Strategist & Regiment Leader
            <@&1262595804850294856> <:3star:1262747271594901574> Strategist
            <@&1262595952376680550> <:2star:1262747258106024016> Captain
            <@&1262596099466854410> <:1star:1262747246248857711> Recruiter
            <@&1262596117271674881> :military_helmet: Recruit`);

        message.channel.send({ embeds: [embed] })
            .catch(err => {
                console.error('Error sending message:', err);
            });
    }
});

client.on('messageCreate', async message => {
    if (message.content.toLowerCase() === '!regiments1') {
        const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('**Regiments and Climbing Ranks**')
        .setDescription(
            'Enmity is managed by several Regiments. Each Regiment represents an important part of the guild and is ran by <@&1262599290434621482>e (Archduke+). If you are interested in joining a Regiments team, you may DM one of the associated Regiment Leaders. The currently active Regiments are: \n' +
            'Here are the regiments of Enmity:\n\n' +
            ':people_holding_hands: Community Regiment\n' +
            ':person_fencing: Training Regiment\n' +
            ':military_helmet: Military Regiment\n' +
            ':boom: Events Regiment\n' +
            ':pencil: Creative Regiment\n\n' +
            '**How to Climb The Ranks?**\n' +
            '\n <@&1262596099466854410>' +
            '```Being active and engaging with the community gets you to Knight after ~7 days, which grants you access to the guild bank```\n\n' +
            ' <@&1262595952376680550>' +
            '```For the next step, you need to show interest in warring and get through our Captain training to be promoted to Baron. If you are not interested in warring, you can earn the promotion by joining/helping out with branches. Easiest to get into are the Training, and Events Branches. Message a Duke+ to learn more.```\n\n' +
            '<@&1262595804850294856>' +
            '```is achieved after you get more warring experience and start learning guild Economy```\n\n' +
            '<@&1262595786223390825>' +
            '```is achieved by continuous work for Branches and can be obtained directly from Baron```'
        );

        message.channel.send({ embeds: [embed] })
            .catch(err => {
                console.error('Error sending message:', err);
            });
    }
});

client.on('messageCreate', async message => {
    if (message.content.toLowerCase() === '!usefulinfo') {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Useful Information')
            .setDescription(`
                :crossed_swords: Warring :arrow_right: <#1262594011538132992>
                :zzz: Inactivity :arrow_right: <#1262593210547441776>
                :shield: Training for war :arrow_right: <#1262594220649349201>
                :firecracker: GXP guide :arrow_right: <#1262945388659478608>
                :books: Tomes <:arrow_right: <#1262593238020259952>

                If you have any other questions or needs, don't hesitate to contact a Parliament member.
            `);

        message.channel.send({ embeds: [embed] })
            .catch(err => {
                console.error('Error sending message:', err);
            });
    }
});



client.login(token);

