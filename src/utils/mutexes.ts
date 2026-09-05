import type { Snowflake } from "discord.js"

const activeSetups = new Set<string>()

type Scopes = "setup" | "memberLimit"

export async function withBlocking<ReturnType>(
    guildId: Snowflake,
    scope: Scopes,
    action: () => Promise<ReturnType>
): Promise<ReturnType | null> {
    const key = `${guildId}:${scope}`
    if (activeSetups.has(key)) {
        return null
    }

    activeSetups.add(key)

    try {
        return await action()
    } finally {
        activeSetups.delete(key)
    }
}
