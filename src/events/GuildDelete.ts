import { EventHandler, RegisterEvent } from "@seedcord/gateway"
import { Events } from "discord.js"

import { updateGuildCounter } from "../utils/topgg"

@RegisterEvent([Events.GuildDelete, { frequency: "on" }])
export class GuildDelete extends EventHandler<Events.GuildDelete> {
    public async execute(): Promise<void> {
        const client = this.event[0].client
        const guildCount = client.guilds.cache.size
        await updateGuildCounter(client, guildCount)
    }
}
