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
@SlashRoute("setchannel")
export class ChangeChannel extends SlashHandler<"setchannel"> {
    public async execute(): Promise<void> {
        await this.defer()

        if (!this.event.guildId) {
            await this.edit({ components: [notAvailableDisplay] })
            return
        }
        await database.editServerIfExists({
            id: this.event.guildId,
            voiceChannel: this.options.getChannel("channel").id,
            voiceCategory: this.options.getChannel("category").id,
            template: this.options.getString("template")?.trim() ?? null
        })
        await this.edit({ components: [successDisplay] })
    }
}
