import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders"
import { ButtonHandler, ButtonRoute, Gated } from "@seedcord/gateway"
import { ButtonStyle, ChannelType } from "discord.js"

import { database } from "../utils/base"
import { createGenericEmbed, FailedStatusComponent, SuccessStatusComponent } from "../utils/embeds"
import { InvitesActionId, InvitesId } from "../utils/interactionIds"
import { inviteUser } from "../utils/inviteStatus"
import { rerenderDashboard } from "../utils/misc"
import { ChannelNotFound, checkChannelRights, CheckRights } from "../utils/preconditions"

@ButtonRoute(InvitesId)
export class InvitesButton extends ButtonHandler<[typeof InvitesId]> {
    public async execute(): Promise<void> {
        if (this.event.channel?.type !== ChannelType.GuildVoice) return
        const [isOwner] = await Promise.all([await checkChannelRights(this.event), this.defer({ ephemeral: false })])
        const channelId = this.event.channel.id
        if (isOwner) {
            const result = await database.toggleInvites(channelId)
            await rerenderDashboard(this.event.channel, this.event.guild)
            await this.edit({
                components: [new SuccessStatusComponent(`${result ? "Enabled" : "Disabled"} invites`).component]
            })
            return
        }
        if (await database.areInvitesEnabled(channelId)) {
            const channel = await database.findChannel(channelId)
            const mentionInteractor = `<@${this.event.user.id}>`
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(InvitesActionId.encode({ choice: "approve", userId: this.event.user.id }))
                    .setLabel("Accept")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(InvitesActionId.encode({ choice: "deny", userId: this.event.user.id }))
                    .setLabel("Deny")
                    .setStyle(ButtonStyle.Danger)
            )
            await this.event.editReply({
                content: `<@${channel?.ownerId}>`,
                embeds: [
                    createGenericEmbed(this.event.user, `${mentionInteractor} sent you a request to join this channel.`)
                ],
                components: [row]
            })
        } else {
            await this.edit({ components: [new FailedStatusComponent("Invites are disabled").component] })
        }
    }
}

@Gated(CheckRights())
@ButtonRoute(InvitesActionId)
export class InvitesAction extends ButtonHandler<[typeof InvitesActionId]> {
    public async execute(): Promise<void> {
        await this.defer({ ephemeral: false })
        const { userId, choice } = this.params
        const settings = await database.findChannel(this.event.channelId)
        const guild = await database.findServer(this.event.guildId)
        if (!settings || !guild?.voiceChannel) throw new ChannelNotFound()
        if (choice === "approve") {
            inviteUser(userId, this.event.channelId)
            const component = new SuccessStatusComponent(
                `<@${userId}>, your invitation has been accepted, you have 1 minute to join <#${guild?.voiceChannel}>`
            )
            await this.edit({ components: [component.component] })
        } else {
            const component = new FailedStatusComponent(`<@${userId}>'s invitation has been denied`)
            await this.edit({ components: [component.component] })
        }
    }
}
