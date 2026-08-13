import type { GuildPremiumTier } from "discord.js"

export function getMaxBitrate(premiumTier: GuildPremiumTier) {
    const bitrate = {
        0: 96,
        1: 128,
        2: 256,
        3: 384
    } as const
    return bitrate[premiumTier]
}
