import { ButtonHandler, ButtonRoute, Gated } from "@seedcord/gateway"
import { ChannelType } from "discord.js"

import { database } from "../utils/base"
import { CloseId } from "../utils/interactionIds"
import { rerenderDashboard } from "../utils/misc"
import { CheckRights } from "../utils/preconditions"


@Gated(CheckRights())
@ButtonRoute(CloseId)
export class CloseButton extends ButtonHandler<[typeof CloseId]> {
    public async execute(): Promise<void> {
        const channel = this.event.channel
        if (channel?.type !== ChannelType.GuildVoice) return
        await this.defer()
        const settings = await database.findChannel(channel.id)
        if (!channel) return
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
        }
        await database.toggleClosed(channel.id)
        await rerenderDashboard(channel, this.event.guild)
        const message = !settings?.closed ? "closed" : "opened"
        await this.edit(`successfully ${message} channel`)
    }
}
