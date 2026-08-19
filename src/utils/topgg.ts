import type { Client } from "discord.js"

export async function updateGuildCounter(client: Client, guildCount: number): Promise<void> {
    const token = process.env.TOPGG_TOKEN
    const userId = client.user?.id
    if (!token || !userId) return

    const response = await fetch(`https://top.gg/api/v1/projects/@me/metrics`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ server_count: guildCount }),
        signal: AbortSignal.timeout(10_000)
    })

    if (!response.ok) {
        throw new Error(`Failed to update Top.gg server count: ${response.status} ${response.statusText}`)
    }
}
