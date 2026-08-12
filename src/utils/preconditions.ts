import { database } from './base';

import type { ButtonInteraction, CommandInteraction } from 'discord.js';

export async function checkChannelOwner(interaction: ButtonInteraction | CommandInteraction) {
    const userId = interaction.user.id;
    if (!interaction.channel) return false;
    const channel = await database.findChannel(interaction.channel.id);
    //if (Array.isArray(channel?.managers)) channel.managers[0]
    if (channel && channel.ownerId == userId) return true;
    return false;
}
