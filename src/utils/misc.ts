import {
    PermissionFlagsBits,
    type Guild,
    type GuildPremiumTier,
    type OverwriteResolvable,
    type VoiceChannel
} from "discord.js"

import { database } from "./base"
import { composeDashboard } from "./dashboard"
import { getMainMessage } from "./embeds"

export function getMaxBitrate(premiumTier: GuildPremiumTier) {
    const bitrate = {
        0: 96,
        1: 128,
        2: 256,
        3: 384
    } as const
    return bitrate[premiumTier]
}

export async function blacklistUsers(channel: VoiceChannel, users: string[]) {
    const overwrites: OverwriteResolvable[] = []
    for (const user of users) {
        overwrites.push({
            id: user,
            deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
        })
    }
    await channel.permissionOverwrites.set(overwrites)
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
