import { database } from "./base"
import { composeDashboard } from "./dashboard"
import { getMainMessage } from "./embeds"

import type { Guild, GuildPremiumTier, VoiceChannel } from "discord.js"

export function getMaxBitrate(premiumTier: GuildPremiumTier) {
    const bitrate = {
        0: 96,
        1: 128,
        2: 256,
        3: 384
    } as const
    return bitrate[premiumTier]
}

export async function blacklistUsers(
    channel: VoiceChannel,
    previousUsers: string[],
    nextUsers: string[]
): Promise<void> {
    const previousUserIds = new Set(previousUsers)
    const nextUserIds = new Set(nextUsers)

    for (const userId of nextUserIds) {
        if (previousUserIds.has(userId)) continue

        await channel.permissionOverwrites.edit(userId, {
            Connect: false,
            Speak: false
        })
    }

    for (const userId of previousUserIds) {
        if (nextUserIds.has(userId)) continue

        await channel.permissionOverwrites.edit(userId, {
            Connect: null,
            Speak: null
        })
    }
}

export async function rerenderDashboard(channel: VoiceChannel, guild: Guild): Promise<void> {
    const settings = await database.findChannel(channel.id)
    if (!settings) return
    const mainMessage = await getMainMessage(channel, settings)
    await mainMessage.edit(
        composeDashboard({
            disableRequests: !settings.requests,
            owner: await guild.members.fetch(settings.ownerId!),
            closed: settings.closed!
        })
    )
}
