import { ButtonHandler, ButtonRoute, Gated, Fault } from "@seedcord/gateway"
import { ChannelType } from "discord.js"

import { database } from "../utils/base"
import { SuccessStatusComponent } from "../utils/embeds"
import { CloseId } from "../utils/interactionIds"
import { getLocale, rerenderDashboard } from "../utils/misc"
import { CheckRights } from "../utils/preconditions"

@Gated(CheckRights())
@ButtonRoute(CloseId)
export class CloseButton extends ButtonHandler<[typeof CloseId]> {
    public async execute(): Promise<void> {
        const channel = this.event.channel
        if (channel?.type !== ChannelType.GuildVoice) return
        const [settings, t] = await Promise.all([
            database.findChannel(channel.id),
            getLocale({ serverId: this.event.guildId }),
            this.defer()
        ])
        switch (settings?.closed) {
            case true: {
                // channel was closed, so opening it now
                await channel.setUserLimit(settings.maxMembers!)
                break
            }
            case false: {
                // channel was opened, closing
                await channel.setUserLimit(1)
                break
            }
            default: {
                // this shouldnt happen
                // the only way this may happen is if channel's settings
                // would be deleted when command would be executed
                throw new Fault({ cause: "channel settings don't exist in CloseButton" })
            }
        }
        await database.toggleClosed(channel.id)
        await rerenderDashboard(channel, this.event.guild)
        const status = !settings.closed ? t.status.closed() : t.status.opened()
        await this.edit({ components: [new SuccessStatusComponent(t.status.changed({ status })).component] })
    }
}
