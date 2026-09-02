import type { Snowflake } from "discord.js"

const activeSetups = new Set<Snowflake>()

export async function withBlocking<ReturnType>(
    guildId: Snowflake,
    action: () => Promise<ReturnType>
): Promise<ReturnType | null> {
    if (activeSetups.has(guildId)) {
        return null
    }

    activeSetups.add(guildId)

    try {
        return await action()
    } finally {
        activeSetups.delete(guildId)
    }
}
