import { EmbedBuilder } from "@discordjs/builders"
import { BuilderComponent } from "@seedcord/gateway"

import { basicColor, failureColor } from "./consts"

import type { TempChannelCreateInput } from "../generated/prisma/models"
import type { GuildTextBasedChannel, User } from "discord.js"

const statuses = {
    success: 0x00_ff_00,
    fail: 0xff_00_00
} as const

export function createStatusEmbed(user: User, description: string, status: "success" | "fail") {
    /* will port this to containers later
    return new ContainerBuilder()
        .setAccentColor(statuses[status])*/
    return new EmbedBuilder()
        .setAuthor({ name: user.globalName ?? "unknown", iconURL: user.displayAvatarURL() })
        .setColor(statuses[status])
        .setDescription(description)
}

export function createGenericEmbed(user: User, description: string, color = basicColor) {
    return new EmbedBuilder()
        .setAuthor({ name: user.globalName ?? "unknown", iconURL: user.displayAvatarURL() })
        .setColor(color)
        .setDescription(description)
}

export async function getMainMessage(channel: GuildTextBasedChannel, settings: Partial<TempChannelCreateInput> | null) {
    if (!settings?.messageId) {
        throw new Error("missing main message id")
    }
    const message = await channel.messages.fetch(settings.messageId)
    if (!message) throw new Error("can't find main message")
    return message
}

export class SuccessStatusComponent extends BuilderComponent<"container"> {
    constructor(message?: string) {
        super("container")
        this.instance
            .setAccentColor(statuses.success)
            .addTextDisplayComponents((builder) =>
                builder.setContent(message ?? "Successfully applied changes")
            )
    }
}

export class FailedStatusComponent extends BuilderComponent<"container"> {
    constructor(message?: string) {
        super("container")
        this.instance
            .setAccentColor(failureColor)
            .addTextDisplayComponents((builder) => builder.setContent(message ?? "Failed to execute command"))
    }
}
