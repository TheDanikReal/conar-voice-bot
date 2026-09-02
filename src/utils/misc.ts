import { database } from "./base"
import { composeDashboard } from "./dashboard"
import { getMainMessage } from "./embeds"
import { getT } from "../generated/i18n"

import type { ServerSettingsCreateInput } from "../generated/prisma/models"
import type { Guild, GuildPremiumTier, Snowflake, User, VoiceChannel } from "discord.js"

const compareArrays = (arr1: string[], arr2: string[]) =>
    arr1.length === arr2.length && arr1.every((val, index) => val === arr2[index])

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
    if (compareArrays(previousUsers, nextUsers)) return
    const previousUserIds = new Set<User>()
    const nextUserIds = new Set<User>()

    for (const user of previousUsers) {
        try {
            const guildUser = await channel.guild.members.fetch(user)
            if (!guildUser) continue
            previousUserIds.add(guildUser.user)
        } catch {
            continue
        }
    }
    for (const user of nextUsers) {
        try {
            const guildUser = await channel.guild.members.fetch(user)
            if (!guildUser) continue
            nextUserIds.add(guildUser.user)
        } catch {
            continue
        }
    }

    for (const user of nextUserIds) {
        if (previousUserIds.has(user)) continue

        await channel.permissionOverwrites.edit(user, {
            Connect: false,
            Speak: false
        })
    }

    for (const user of previousUserIds) {
        if (nextUserIds.has(user)) continue

        await channel.permissionOverwrites.edit(user, {
            Connect: null,
            Speak: null
        })
    }
}

export async function rerenderDashboard(channel: VoiceChannel, guild: Guild): Promise<void> {
    const [settings, t] = await Promise.all([database.findChannel(channel.id), getLocale({ serverId: guild.id })])
    if (!settings) return
    const mainMessage = await getMainMessage(channel, settings)
    await mainMessage.edit(
        composeDashboard(
            {
                disableRequests: !settings.requests,
                owner: await guild.members.fetch(settings.ownerId!),
                closed: settings.closed!
            },
            t
        )
    )
}

export async function getLocale({
    serverId,
    server
}: {
    serverId?: Snowflake
    server?: Partial<ServerSettingsCreateInput>
}) {
    if (!serverId && !server) return getT("en")
    const data = server ? server : await database.findServer(serverId!)
    return getT(data?.language)
}
