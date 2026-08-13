import type { Guild, GuildPremiumTier, VoiceChannel } from "discord.js"
import { getMainMessage } from "./embeds"
import { composeDashboard } from "./dashboard"
import { database } from "./base"

export function getMaxBitrate(premiumTier: GuildPremiumTier) {
    const bitrate = {
        0: 96,
        1: 128,
        2: 256,
        3: 384
    } as const
    return bitrate[premiumTier]
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
