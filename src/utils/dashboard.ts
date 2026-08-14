import { ButtonStyle, EmbedBuilder, ActionRowBuilder, ButtonBuilder } from "discord.js"

import { BitrateId, CloseId, DeleteId, InvitesId, MemberLimitId, RenameId } from "./interactionIds"

import type { BaseMessageOptions, GuildMember } from "discord.js"

interface ChannelOptions {
    disableRequests: boolean
    owner: GuildMember
    closed: boolean
}

/** i took the original emoji code that was here before, but ig it's better to use regular seedcord
    emoji store, i remember such thing existed */
const emojis = {
    edit: "1515775509563183125",
    bitrate: "1515775525879156766",
    voiceLimited: "1515775542820081834",
    lock: "1515775559584714944",
    unlock: "1537119175359860866",
    members: "1515775576256942170",
    setup: "1515775592937558088",
    booster: "1515775609668636832",
    play: "1515775626609688716",
    delete: "1516040157285843077"
}

export function composeDashboard(settings: ChannelOptions): BaseMessageOptions {
    const isClosed = settings.closed
    // these closeChannel stuff look just bad
    // todo: make so that isClosed variable was depended on close button instead of
    // max members, but that will require implementing close button first
    const closeChannelMessage = isClosed ? "Open channel" : "Close channel"
    const closeChannelId = isClosed ? emojis.unlock : emojis.lock
    const closeChannelEmoji = isClosed ? `<:unlock:${emojis.unlock}>` : `<:lock:${emojis.lock}>`
    const embed = new EmbedBuilder()
        .setTitle("Voice channel")
        .setColor(0x11_19_84)
        .setDescription(
            `${settings.owner.displayName} is controling!

<:edit:${emojis.edit}> - Rename channel.
<:bitrate:${emojis.bitrate}>: - Set bitrate.
<:voiceLimited:${emojis.voiceLimited}>: - Set member limit.
${closeChannelEmoji} - ${closeChannelMessage}.
📨 - Disable join requests.
<:members:${emojis.members}>: - Manage members.
<:setup:${emojis.setup}>: - Manage channel setting saves.`
        )
        .setFooter({
            text: `Owner: ${settings.owner.displayName}`,
            iconURL: settings.owner.displayAvatarURL()
        })
    const rename = new ButtonBuilder()
        .setCustomId(RenameId.encode({}))
        .setEmoji(emojis.edit)
        .setStyle(ButtonStyle.Secondary)
    const bitrate = new ButtonBuilder()
        .setCustomId(BitrateId.encode({}))
        .setEmoji(emojis.bitrate)
        .setStyle(ButtonStyle.Secondary)
    const memberLimit = new ButtonBuilder()
        .setCustomId(MemberLimitId.encode({}))
        .setDisabled(isClosed ? true : false)
        .setEmoji(emojis.voiceLimited)
        .setStyle(ButtonStyle.Secondary)
    const close = new ButtonBuilder()
        .setCustomId(CloseId.encode({}))
        .setEmoji(closeChannelId)
        .setStyle(isClosed ? ButtonStyle.Danger : ButtonStyle.Secondary)
    const requests = new ButtonBuilder()
        .setCustomId(InvitesId.encode({}))
        .setEmoji("📨")
        .setStyle(ButtonStyle.Secondary)
    // todo add other buttons and compose message, then send and add actions
    const firstRow = new ActionRowBuilder<ButtonBuilder>().addComponents(rename, bitrate, memberLimit, close, requests)
    const manageMembers = new ButtonBuilder()
        .setCustomId("manageMembers")
        .setEmoji(emojis.members)
        .setStyle(ButtonStyle.Primary)
    const manageSaves = new ButtonBuilder()
        .setCustomId("manageSaves")
        .setEmoji(emojis.setup)
        .setStyle(ButtonStyle.Primary)
    const secondRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        manageMembers,
        manageSaves
    )
    const deleteChannel = new ButtonBuilder()
        .setCustomId(DeleteId.encode({}))
        .setLabel("Delete")
        .setEmoji(emojis.delete)
        .setStyle(ButtonStyle.Danger)
    const thirdRow = new ActionRowBuilder<ButtonBuilder>().addComponents(deleteChannel)
    return { embeds: [embed], components: [firstRow, secondRow, thirdRow] }
}
