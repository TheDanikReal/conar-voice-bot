import { ContainerBuilder } from "@discordjs/builders"
import { Notice, defineGate } from "@seedcord/gateway"

import { database } from "./base"

import type { Gate, GateContextBase, RenderContext, ReplyResponse } from "@seedcord/gateway"
import type { ButtonInteraction, CommandInteraction } from "discord.js"

const red = 0xff_00_00

export async function checkChannelRights(interaction: ButtonInteraction | CommandInteraction) {
    if (!interaction.channel) return false
    const userId = interaction.user.id
    const channel = await database.findChannel(interaction.channel.id)
    const isManager = Array.isArray(channel?.managers) && channel.managers.includes(userId)
    if (channel?.ownerId !== userId && !isManager) return false
    return true
}

export const CheckRights: Gate<GateContextBase, "CheckRights"> = defineGate("CheckRights", async (ctx) => {
    const userId = ctx.userId
    if (!userId) throw new NoRights("manager")
    const channel = await database.findChannel(ctx.channelId!)
    const isManager = Array.isArray(channel?.managers) && channel.managers.includes(userId)
    if (channel?.ownerId !== userId && !isManager) throw new NoRights("manager")
})

export const CheckOwnerRights: Gate<GateContextBase, "CheckOwnerRights"> = defineGate(
    "CheckOwnerRights",
    async (ctx) => {
        const userId = ctx.userId
        if (!userId) throw new NoRights("owner")
        const channel = await database.findChannel(ctx.channelId!)
        if (channel?.ownerId !== userId) throw new NoRights("owner")
    }
)

export class NoRights extends Notice {
    level: "manager" | "owner"
    constructor(level: "manager" | "owner") {
        super(`user doesn't have enough rights to do action`)
        this.level = level
    }

    render(_ctx: RenderContext): ReplyResponse {
        return {
            components: [
                new ContainerBuilder()
                    .setAccentColor(red)
                    .addTextDisplayComponents((builder) =>
                        builder.setContent(`:warning: You don't have ${this.level} permissions to do that.`)
                    )
            ]
        }
    }
}

export class UserNotFound extends Notice {
    constructor() {
        super(`user not found`)
    }

    render(_ctx: RenderContext): ReplyResponse {
        return {
            components: [
                new ContainerBuilder()
                    .setAccentColor(red)
                    .addTextDisplayComponents((builder) =>
                        builder.setContent(":warning: It seems that user can't be found")
                    )
            ]
        }
    }
}

export class ChannelNotFound extends Notice {
    constructor() {
        super(`channel not found`)
    }

    render(_ctx: RenderContext): ReplyResponse {
        return {
            components: [
                new ContainerBuilder()
                    .setAccentColor(red)
                    .addTextDisplayComponents((builder) =>
                        builder.setContent(":warning: The channel's settings could not be found")
                    )
            ]
        }
    }
}

export class RaceConditionDetected extends Notice {
    constructor() {
        super(`race condition`)
    }

    render(_ctx: RenderContext): ReplyResponse {
        return {
            components: [
                new ContainerBuilder()
                    .setAccentColor(red)
                    .addTextDisplayComponents((builder) =>
                        builder.setContent(
                            ":warning: Error happened" +
                                "The channel changed while you were updating the limit. Check the current limit before retrying."
                        )
                    )
            ]
        }
    }
}

export class ActionInProgress extends Notice {
    constructor() {
        super(`action triggered when previous was pending`)
    }

    render(_ctx: RenderContext): ReplyResponse {
        return {
            components: [
                new ContainerBuilder().setAccentColor(red).addTextDisplayComponents((builder) =>
                    // todo: translate notices, currently i don't want to do this for some reason
                    builder.setContent(
                        ":warning: Error happened" +
                            "You edited settings when other operation was pending, please wait other operation to finish"
                    )
                )
            ]
        }
    }
}
