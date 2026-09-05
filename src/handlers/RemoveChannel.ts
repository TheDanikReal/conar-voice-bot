import { TextDisplayBuilder } from "@discordjs/builders"
import { Gated, RequirePermissions, SlashHandler, SlashRoute } from "@seedcord/gateway"
import { PermissionFlagsBits } from "discord.js"

import { database } from "../utils/base"
import { getLocale } from "../utils/misc"

@Gated(RequirePermissions([PermissionFlagsBits.ManageGuild]))
@SlashRoute("removechannel")
export class RemoveChannel extends SlashHandler<"removechannel"> {
    public async execute(): Promise<void> {
        const [t] = await Promise.all([getLocale({ serverId: this.event.guildId }), this.defer()])

        const notAvailableDisplay = new TextDisplayBuilder({
            content: t.settings.notAvailableInDms()
        })

        if (!this.event.guildId) {
            await this.edit({ components: [notAvailableDisplay] })
            return
        }

        const successDisplay = new TextDisplayBuilder({
            content: t.settings.success()
        })

        await database.editServerIfExists({
            id: this.event.guildId,
            voiceChannel: null
        })
        await this.edit({ components: [successDisplay] })
    }
}
