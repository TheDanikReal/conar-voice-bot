import { EventHandler, RegisterEvent } from "@seedcord/gateway"
import { Events } from "discord.js"

import { updateGuildCounter } from "../utils/topgg"

@RegisterEvent([Events.GuildCreate, { frequency: "on" }])
export class GuildCreate extends EventHandler<Events.GuildCreate> {
    public async execute(): Promise<void> {
        const client = this.event[0].client
        const guildCount = client.guilds.cache.size
        await updateGuildCounter(client, guildCount)
    }
}
