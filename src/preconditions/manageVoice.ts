import { Precondition } from '@sapphire/framework';
import { ButtonInteraction, CommandInteraction } from 'discord.js';
import { database } from '../base.js';

export class ManageVoicePrecondition extends Precondition {
    public override async chatInputRun(interaction: CommandInteraction) {
        const userId = interaction.user.id
        if (!interaction.channel) return this.error()
        const channel = await database.findChannel(interaction.channel.id)
        //if (Array.isArray(channel?.managers)) channel.managers[0]
        if (channel && channel.ownerId == userId) return this.ok()
        return this.error()
    }
}

export async function checkChannelOwner(interaction: ButtonInteraction | CommandInteraction) {
    const userId = interaction.user.id
    if (!interaction.channel) return false
    const channel = await database.findChannel(interaction.channel.id)
    //if (Array.isArray(channel?.managers)) channel.managers[0]
    if (channel && channel.ownerId == userId) return true
    return false
}