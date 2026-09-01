import { TextDisplayBuilder } from "@discordjs/builders"
import { Gated, RequirePermissions, SlashHandler, SlashRoute } from "@seedcord/gateway"
import { PermissionFlagsBits } from "discord.js"

import { database } from "../utils/base"
import { getLocale } from "../utils/misc"



@Gated(RequirePermissions([PermissionFlagsBits.ManageGuild]))
@SlashRoute("setchannel")
export class ChangeChannel extends SlashHandler<"setchannel"> {
    public async execute(): Promise<void> {
        const [t] = await Promise.all([getLocale({ serverId: this.event.guildId }), this.defer()])
        
        const notAvailableDisplay = new TextDisplayBuilder({
            content: t.settings.notAvailableInDms()
        })

        const successDisplay = new TextDisplayBuilder({
            content: t.settings.success()
        })

        if (!this.event.guildId) {
            await this.edit({ components: [notAvailableDisplay] })
            return
        }
        await database.editServerIfExists({
            id: this.event.guildId,
            voiceChannel: this.options.getChannel("channel").id,
            voiceCategory: this.options.getChannel("category")?.id ?? null,
            template: this.options.getString("template")?.trim() ?? null,
            language: this.options.getString("language") ?? "en"
        })
        await this.edit({ components: [successDisplay] })
    }
}
