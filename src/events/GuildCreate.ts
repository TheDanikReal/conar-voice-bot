import { EventHandler, RegisterEvent } from "@seedcord/gateway";
import { Events } from "discord.js";

@RegisterEvent([Events.GuildCreate, { frequency: "on" }])
export class Ready extends EventHandler<Events.GuildCreate> {
    public async execute(): Promise<void> {
        const client = this.event[0].client
        const token = process.env.TOPGG_TOKEN
        if (!token) return

        const guildCount = client.guilds.cache.size
        const response = await fetch(`https://top.gg/api/bots/${client.user.id}/stats`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ server_count: guildCount })
        })

        if (!response.ok) {
            this.logger.error(`Failed to update Top.gg server count: ${response.status} ${response.statusText}`)
        }
    }
}