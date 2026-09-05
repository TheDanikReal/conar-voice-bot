import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders"
import { ButtonHandler, ButtonRoute, Gated } from "@seedcord/gateway"
import { ButtonStyle, ChannelType } from "discord.js"

import { database } from "../utils/base"
import { createGenericEmbed, FailedStatusComponent, SuccessStatusComponent } from "../utils/embeds"
import { InvitesActionId, InvitesId } from "../utils/interactionIds"
import { inviteUser } from "../utils/inviteStatus"
import { getLocale, rerenderDashboard } from "../utils/misc"
import { ChannelNotFound, checkChannelRights, CheckRights } from "../utils/preconditions"

@ButtonRoute(InvitesId)
export class InvitesButton extends ButtonHandler<[typeof InvitesId]> {
    public async execute(): Promise<void> {
        if (this.event.channel?.type !== ChannelType.GuildVoice) return
        const [isOwner, t] = await Promise.all([
            checkChannelRights(this.event),
            getLocale({ serverId: this.event.guildId }),
            this.defer({ ephemeral: false })
        ])
        const channelId = this.event.channel.id
        if (isOwner) {
            const result = await database.toggleInvites(channelId)
            const status = result ? t.enabled() : t.disabled()
            await rerenderDashboard(this.event.channel, this.event.guild)
            await this.edit({
                components: [new SuccessStatusComponent(t.invites.status({ status })).component]
            })
            return
        }
        if (await database.areInvitesEnabled(channelId)) {
            const channel = await database.findChannel(channelId)
            const mention = `<@${this.event.user.id}>`
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(InvitesActionId.encode({ choice: "approve", userId: this.event.user.id }))
                    .setLabel(t.invites.accept())
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(InvitesActionId.encode({ choice: "deny", userId: this.event.user.id }))
                    .setLabel(t.invites.deny())
                    .setStyle(ButtonStyle.Danger)
            )
            await this.event.editReply({
                content: `<@${channel?.ownerId}>`,
                embeds: [createGenericEmbed(this.event.user, t.invites.someoneSentRequest({ mention }))],
                components: [row]
            })
        } else {
            await this.edit({ components: [new FailedStatusComponent(t.invites.disabled()).component] })
        }
    }
}

@Gated(CheckRights)
@ButtonRoute(InvitesActionId)
export class InvitesAction extends ButtonHandler<[typeof InvitesActionId]> {
    public async execute(): Promise<void> {
        await this.defer({ ephemeral: false })
        const { userId, choice } = this.params
        const [settings, guild] = await Promise.all([
            database.findChannel(this.event.channelId),
            database.findServer(this.event.guildId)
        ])
        if (!settings || !guild?.voiceChannel) throw new ChannelNotFound()
        const t = await getLocale({ server: guild })
        if (choice === "approve") {
            inviteUser(userId, this.event.channelId)
            const component = new SuccessStatusComponent(
                t.invites.accepted({
                    channel: `<#${guild.voiceChannel}>`,
                    mention: `<@${userId}>`
                })
            )
            await this.edit({ components: [component.component] })
        } else {
            const component = new FailedStatusComponent(t.invites.denied({ mention: `<@${userId}>` }))
            await this.edit({ components: [component.component] })
        }
    }
}
