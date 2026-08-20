import { TextDisplayBuilder } from "@discordjs/builders"
import { Gated, RequirePermissions, SlashHandler, SlashRoute } from "@seedcord/gateway"
import { PermissionFlagsBits } from "discord.js"

import { database } from "../utils/base"

const notAvailableDisplay = new TextDisplayBuilder({
    content: "not available in dms"
})

const successDisplay = new TextDisplayBuilder({
    content: "success"
})

@Gated(RequirePermissions([PermissionFlagsBits.ManageGuild]))
@SlashRoute("removechannel")
export class RemoveChannel extends SlashHandler<"removechannel"> {
    public async execute(): Promise<void> {
        await this.defer()

        if (!this.event.guildId) {
            await this.edit({ components: [notAvailableDisplay] })
            return
        }
        await database.editServerIfExists({
            id: this.event.guildId,
            voiceChannel: null
        })
        await this.edit({ components: [successDisplay] })
    }
}
