const { Events } = require('discord.js');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        if (oldState.channelId === null && newState.channelId !== null) {
            console.log(`${newState.member.user.tag} joined voice channel ${newState.channel.name}`);
            if (newState.channel.name.toLowerCase().includes('book-club')) {
                // check if other members are in the channel
                const members = newState.channel.members;
                console.log(`Members in the channel: ${members.map(member => member.user.tag).join(", ")}`);
            }
        } else if (oldState.channelId !== null && newState.channelId === null) {
            console.log(`${oldState.member.user.tag} left voice channel ${oldState.channel.name}`);
        }
    },
};