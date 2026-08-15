import { EmbedBuilder, ActionRowBuilder } from "@discordjs/builders"
import { Emojis } from "@seedcord/gateway"
import { ButtonStyle, ButtonBuilder } from "discord.js"

import { basicColor } from "./consts"
import { BitrateId, CloseId, DeleteId, InvitesId, ManageMembersId, MemberLimitId, RenameId } from "./interactionIds"

import type { BaseMessageOptions, GuildMember } from "discord.js"

interface ChannelOptions {
    disableRequests: boolean
    owner: GuildMember
    closed: boolean
}

export function composeDashboard(settings: ChannelOptions): BaseMessageOptions {
    const isClosed = settings.closed
    // these closeChannel stuff look just bad
    // todo: make so that isClosed variable was depended on close button instead of
    // max members, but that will require implementing close button first
    const closeChannelMessage = isClosed ? "Open channel" : "Close channel"
    const closeChannelId = isClosed ? Emojis.unlock : Emojis.lock
    const embed = new EmbedBuilder()
        .setTitle("Voice channel")
        .setColor(basicColor)
        .setDescription(
            `${settings.owner.displayName} is controlling!

${Emojis.edit} - Rename channel.
${Emojis.bitrate} - Set bitrate.
${Emojis.voiceLimited} - Set member limit.
${closeChannelId} - ${closeChannelMessage}.
📨 - Disable join requests.
${Emojis.members} - Manage members.
${Emojis.setup} - Manage channel setting saves.`
        )
        .setFooter({
            text: `Owner: ${settings.owner.displayName}`,
            iconURL: settings.owner.displayAvatarURL()
        })
    const rename = new ButtonBuilder()
        .setCustomId(RenameId.encode({}))
        .setEmoji(Emojis.edit.id)
        .setStyle(ButtonStyle.Secondary)
    const bitrate = new ButtonBuilder()
        .setCustomId(BitrateId.encode({}))
        .setEmoji(Emojis.bitrate.id)
        .setStyle(ButtonStyle.Secondary)
    const memberLimit = new ButtonBuilder()
        .setCustomId(MemberLimitId.encode({}))
        .setDisabled(isClosed ? true : false)
        .setEmoji(Emojis.voiceLimited.id)
        .setStyle(ButtonStyle.Secondary)
    const close = new ButtonBuilder()
        .setCustomId(CloseId.encode({}))
        .setEmoji(closeChannelId.id)
        .setStyle(isClosed ? ButtonStyle.Danger : ButtonStyle.Secondary)
    const requests = new ButtonBuilder()
        .setCustomId(InvitesId.encode({}))
        .setEmoji("📨")
        .setStyle(ButtonStyle.Secondary)
    // todo add other buttons and compose message, then send and add actions
    const firstRow = new ActionRowBuilder<ButtonBuilder>().addComponents(rename, bitrate, memberLimit, close, requests)
    const manageMembers = new ButtonBuilder()
        .setCustomId(ManageMembersId.encode({}))
        .setEmoji(Emojis.members.id)
        .setStyle(ButtonStyle.Primary)
    const manageSaves = new ButtonBuilder()
        .setCustomId("manageSaves")
        .setEmoji(Emojis.setup.id)
        .setStyle(ButtonStyle.Primary)
    const secondRow = new ActionRowBuilder<ButtonBuilder>().addComponents(manageMembers, manageSaves)
    const deleteChannel = new ButtonBuilder()
        .setCustomId(DeleteId.encode({}))
        .setLabel("Delete")
        .setEmoji(Emojis.delete.id)
        .setStyle(ButtonStyle.Danger)
    const thirdRow = new ActionRowBuilder<ButtonBuilder>().addComponents(deleteChannel)
    return { embeds: [embed], components: [firstRow, secondRow, thirdRow] }
}
