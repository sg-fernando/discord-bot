const { SlashCommandBuilder } = require('discord.js');

function getRecipeList() {
    const config = require('../../config.json');
    return config.recipeList || [];
}

function saveRecipeList(list) {
    const fs = require('fs');
    const config = require('../../config.json');
    config.recipeList = list;
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
}

function getCurrentPerson() {
    const recipeList = getRecipeList();
    if (recipeList.length === 0) {
        return 'No one is currently assigned to send the recipe.';
    }
    const config = require('../../config.json');
    const position = config.recipeListPosition || 0;
    const currentPersonId = recipeList[position % recipeList.length];
    return `<@${currentPersonId}> is currently assigned to send the recipe.`;
}

function setCurrentIndex(index) {
    const config = require('../../config.json');
    config.recipeListPosition = index;
    const fs = require('fs');
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
}

function getInterval() {
    const config = require('../../config.json');
    return config.interval;
}

function setInterval(days) {
    const config = require('../../config.json');
    config.interval = days;
    const fs = require('fs');
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
}

function getTimeUntilNextRecipe() {
    const config = require('../../config.json');
    return config.timeUntilNextRecipe || 0;
}

function setTimeUntilNextRecipe(days) {
    const config = require('../../config.json');
    config.timeUntilNextRecipe = days;
    const fs = require('fs');
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('recipe')
        .setDescription('Recipe commands')
        .addSubcommandGroup(group =>
        group
            .setName('list')
            .setDescription('Manage list of people who need to send recipes')
            .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a person to the list')
                .addUserOption(option =>
                    option.setName('name').setDescription('The name of the person').setRequired(true),
                ).addNumberOption(option =>
                    option.setName('position').setDescription('The position in the list (optional)').setRequired(false),
                )
            )
            .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a person from the list')
                .addUserOption(option =>
                    option.setName('name').setDescription('The name of the person').setRequired(true),
                )
            )
            .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Shows list of people who need to send recipes'),
            )
            .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the person who needs to send the recipe for the week')
                .addUserOption(option =>
                    option.setName('name').setDescription('The person who needs to send the recipe for the week').setRequired(true),
                )
            )
        )
        .addSubcommandGroup(group =>
        group
            .setName('time')
            .setDescription('Manage the timing for sending recipes')
            .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the interval for sending recipes')
                .addNumberOption(option =>
                    option.setName('interval').setDescription('The interval in days').setRequired(true),
                )
                .addNumberOption(option =>
                    option.setName('start').setDescription('The start in days from now').setRequired(false),
                )
            )
        ),
    async execute(interaction) {
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        if (subcommandGroup === 'list') {
            if (subcommand === 'add') {
                const user = interaction.options.getUser('name');
                const position = interaction.options.getNumber('position');
                const recipeList = getRecipeList();

                if (recipeList.includes(user.id)) {
                    await interaction.reply(`${user.username} is already in the recipe list.`);
                    return;
                }

                if (position) {
                    recipeList.splice(position - 1, 0, user.id);
                } else {
                    recipeList.push(user.id);
                }

                saveRecipeList(recipeList);
                const updatedList = viewRecipeList();
                await interaction.reply(`${user.username} has been added to the recipe list.\n\nCurrent List:\n${updatedList}`);
            } else if (subcommand === 'remove') {
                const user = interaction.options.getUser('name');
                const recipeList = getRecipeList();

                if (!recipeList.includes(user.id)) {
                    await interaction.reply(`${user.username} is not in the recipe list.`);
                    return;
                }

                const updatedList = recipeList.filter(id => id !== user.id);
                saveRecipeList(updatedList);
                await interaction.reply(`${user.username} has been removed from the recipe list.\n\nCurrent List:\n${viewRecipeList()}`);
            } else if (subcommand === 'show') {
                const recipeList = getRecipeList();
                if (recipeList.length === 0) {
                    await interaction.reply('The recipe list is currently empty.');
                    return;
                }
                const listString = recipeList.map((id, index) => `${index + 1}. <@${id}>`).join('\n');
                const currentPerson = getCurrentPerson();
                await interaction.reply(`Current Recipe List:\n${listString}\n\n${currentPerson}`);
            } else if (subcommand === 'set') {
                const user = interaction.options.getUser('name');
                const recipeList = getRecipeList();

                if (!recipeList.includes(user.id)) {
                    await interaction.reply(`${user.username} is not in the recipe list.`);
                    return;
                }

                const index = recipeList.indexOf(user.id);
                setCurrentIndex(index);
                await interaction.reply(`${user.username} has been set as the current person to send the recipe for the week.`);
            }
        } else if (subcommandGroup === 'time') {
            if (subcommand === 'set') {
                const interval = interaction.options.getNumber('interval');
                const start = interaction.options.getNumber('start') || 0;
                setInterval(interval);
                setTimeUntilNextRecipe(start);
                await interaction.reply(`The interval for sending recipes has been set to ${interval} days, starting in ${start} days.`);
            }
        }
    },
};