import { ContainerBuilder } from "@discordjs/builders"
import { Notice, defineGate } from "@seedcord/gateway"

import { database } from "./base"

import type { Gate, GateContextBase, RenderContext, ReplyResponse } from "@seedcord/gateway"
import type { ButtonInteraction, CommandInteraction } from "discord.js"

export async function checkChannelRights(interaction: ButtonInteraction | CommandInteraction) {
    const userId = interaction.user.id
    if (!interaction.channel) return false
    const channel = await database.findChannel(interaction.channel.id)
    //if (Array.isArray(channel?.managers)) channel.managers[0]
    if (channel && channel.ownerId == userId) return true
    return false
}

export function CheckRights(): Gate<GateContextBase, "CheckRights"> {
    return defineGate("CheckRights", async (ctx) => {
        const userId = ctx.userId
        const channel = await database.findChannel(ctx.channelId!)
        if (channel?.ownerId != userId) throw new NoRights()
    })
}

export class NoRights extends Notice {
    constructor() {
        super(`user doesn't have enough rights to do action`)
    }

    render(_ctx: RenderContext): ReplyResponse {
        return {
            components: [
                new ContainerBuilder()
                    .setAccentColor(0xff_00_00)
                    .addTextDisplayComponents((builder) =>
                        builder.setContent(":warning: You don't have permissions to do that.")
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
