import { ButtonStyle, ButtonBuilder } from "discord.js"
import { EmbedBuilder, ActionRowBuilder } from "@discordjs/builders"
import { Emojis } from "@seedcord/gateway"

import { BitrateId, CloseId, DeleteId, InvitesId, ManageMembersId, MemberLimitId, RenameId } from "./interactionIds"

import type { BaseMessageOptions, GuildMember } from "discord.js"
import { basicColor } from "./consts"

interface ChannelOptions {
    disableRequests: boolean
    owner: GuildMember
    closed: boolean
}

/** i took the original emoji code that was here before, but ig it's better to use regular seedcord
    emoji store, i remember such thing existed */
export const emojis = {
    edit: "1515775509563183125",
    bitrate: "1515775525879156766",
    voiceLimited: "1515775542820081834",
    lock: "1515775559584714944",
    unlock: "1537119175359860866",
    members: "1515775576256942170",
    setup: "1515775592937558088",
    booster: "1515775609668636832",
    play: "1515775626609688716",
    delete: "1516040157285843077",
    kick: "1537759545684791346",
    mod: "1537759562294104074"
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
            `${settings.owner.displayName} is controling!

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
