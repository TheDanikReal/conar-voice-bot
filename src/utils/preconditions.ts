import { ContainerBuilder } from "@discordjs/builders"
import { Notice, defineGate } from "@seedcord/gateway"

import { database } from "./base"

import type { Gate, GateContextBase, RenderContext, ReplyResponse } from "@seedcord/gateway"
import type { ButtonInteraction, CommandInteraction } from "discord.js"

const red = 0xff_00_00

export async function checkChannelRights(interaction: ButtonInteraction | CommandInteraction) {
    const userId = interaction.user.id
    if (!interaction.channel) return false
    const channel = await database.findChannel(interaction.channel.id)
    //if (Array.isArray(channel?.managers)) channel.managers[0]
    if (channel?.ownerId === userId) return true
    return false
}

export function CheckRights(): Gate<GateContextBase, "CheckRights"> {
    return defineGate("CheckRights", async (ctx) => {
        const userId = ctx.userId
        if (!userId) throw new NoRights("manager")
        const channel = await database.findChannel(ctx.channelId!)
        const isManager = Array.isArray(channel?.managers) && channel.managers.includes(userId)
        if (channel?.ownerId !== userId && !isManager) throw new NoRights("manager")
    })
}

export function CheckOwnerRights(): Gate<GateContextBase, "CheckOwnerRights"> {
    return defineGate("CheckOwnerRights", async (ctx) => {
        const userId = ctx.userId
        if (!userId) throw new NoRights("owner")
        const channel = await database.findChannel(ctx.channelId!)
        if (channel?.ownerId !== userId) throw new NoRights("owner")
    })
}

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

export class RaceConditionDetected extends Notice {
    constructor() {
        super(`race condition`)
    }

    render(_ctx: RenderContext): ReplyResponse {
        return {
            components: [
                new ContainerBuilder()
                    .setAccentColor(0xff_00_00)
                    .addTextDisplayComponents((builder) =>
                        builder.setContent(
                            ":warning: The channel changed while you were updating the limit. Check the current limit before retrying."
                        )
                    )
            ]
        }
    }
}
