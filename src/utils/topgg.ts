import type { Client } from "discord.js"

let updateQueue = Promise.resolve()

export function updateGuildCounter(client: Client, guildCount: number): Promise<void> {
    const token = process.env.TOPGG_TOKEN
    const userId = client.user?.id
    if (!token || !userId) return Promise.resolve()

    const update = updateQueue.then(async () => {
        const response = await fetch("https://top.gg/api/v1/projects/@me/metrics", {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ server_count: guildCount }),
            signal: AbortSignal.timeout(10_000)
        })

        if (!response.ok) {
            throw new Error(`Top.gg guild-count update failed: ${response.status}`)
        }
    })

    // Keep the queue usable after a failed request.
    updateQueue = update.catch(() => {})
    return update
}
