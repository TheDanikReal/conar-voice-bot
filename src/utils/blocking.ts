import type { Snowflake } from "discord.js"

const activeSetups = new Set<string>()

type Scopes = "setup" | "memberLimit"

export async function withBlocking<ReturnType>(
    guildId: Snowflake,
    scope: Scopes,
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
