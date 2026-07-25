import { EmbedBuilder, User } from "discord.js";

const statuses = {
    success: 0x00ff00,
    fail: 0xff0000
} as const

export function createStatusEmbed(user: User, description: string, status: "success" | "fail") {
    return new EmbedBuilder()
        .setAuthor({ name: user.globalName || "unknown", iconURL: user.displayAvatarURL() })
        .setColor(statuses[status])
        .setDescription(description)
}

export function createGenericEmbed(user: User, description: string, color = 0xffffff) {
    return new EmbedBuilder()
        .setAuthor({ name: user.globalName || "unknown", iconURL: user.displayAvatarURL() })
        .setColor(color)
        .setDescription(description)
}