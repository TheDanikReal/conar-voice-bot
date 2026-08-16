import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders"
import { ButtonHandler, ButtonRoute, Gated } from "@seedcord/gateway"
import { ButtonStyle, ChannelType } from "discord.js"

import { database } from "../utils/base"
import { createGenericEmbed } from "../utils/embeds"
import { InvitesActionId, InvitesId } from "../utils/interactionIds"
import { ChannelNotFound, checkChannelRights, CheckRights } from "../utils/preconditions"
import { rerenderDashboard } from "../utils/misc"
import { inviteUser } from "../utils/inviteStatus"

@ButtonRoute(InvitesId)
export class InvitesButton extends ButtonHandler<[typeof InvitesId]> {
    public async execute(): Promise<void> {
        if (this.event.channel?.type != ChannelType.GuildVoice) return
        await this.defer({ ephemeral: false })
        const isOwner = await checkChannelRights(this.event)
        const channelId = this.event.channel.id
        if (isOwner) {
            const result = await database.toggleInvites(channelId)
            await rerenderDashboard(this.event.channel, this.event.guild)
            await this.edit(result ? "enabled" : "disabled")
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
            await this.event.editReply("invites are disabled")
        }
    }
}

//@Gated(CheckRights())
@ButtonRoute(InvitesActionId)
export class InvitesAction extends ButtonHandler<[typeof InvitesActionId]> {
    public async execute(): Promise<void> {
        await this.defer({ ephemeral: false })
        const { userId, choice } = this.params
        const settings = await database.findChannel(this.event.channelId)
        const guild = await database.findServer(this.event.guildId)
        if (!settings) throw new ChannelNotFound()
        if (choice == "approve") {
            inviteUser(userId, this.event.channelId)
            await this.edit(
                `<@${userId}>, your invitation has been accepted, you have 1 minute to join <#${guild?.voiceChannel}>`
            )
        } else {
            await this.edit(`<@${userId}>'s invitation has been denied`)
        }
        //await this.edit(`${userId} and ${choice}`)
    }
}
