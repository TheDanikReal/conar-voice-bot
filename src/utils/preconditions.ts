import { ButtonInteraction, CommandInteraction } from "discord.js"
import { database } from "./base"

export async function checkChannelOwner(interaction: ButtonInteraction | CommandInteraction) {
    const userId = interaction.user.id
    if (!interaction.channel) return false
    const channel = await database.findChannel(interaction.channel.id)
    //if (Array.isArray(channel?.managers)) channel.managers[0]
    if (channel && channel.ownerId == userId) return true
    return false
}