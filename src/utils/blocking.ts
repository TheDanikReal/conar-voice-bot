import type { Snowflake } from "discord.js"

const activeSetups = new Set<string>()

export async function withBlocking<ReturnType>(
    guildId: Snowflake,
    scope: string,
    action: () => Promise<ReturnType>
): Promise<ReturnType | null> {
    if (activeSetups.has(guildId)) {
        return null
    }

    activeSetups.add(`${guildId}:${scope}`)

    try {
        return await action()
    } finally {
        activeSetups.delete(guildId)
    }
}
