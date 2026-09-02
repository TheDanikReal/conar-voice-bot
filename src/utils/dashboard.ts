import { EmbedBuilder, ActionRowBuilder, ButtonBuilder } from "@discordjs/builders"
import { Emojis } from "@seedcord/gateway"
import { ButtonStyle } from "discord.js"

import { basicColor } from "./consts"
import {
    BitrateId,
    CloseId,
    DeleteId,
    InvitesId,
    ManageMembersId,
    MemberLimitId,
    RenameId,
    StatesId
} from "./interactionIds"
import { getT } from "../generated/i18n"

import type { Dict } from "../generated/i18n"
import type { BaseMessageOptions, GuildMember } from "discord.js"

interface ChannelOptions {
    disableRequests: boolean
    owner: GuildMember
    closed: boolean
}

export function composeDashboard(settings: ChannelOptions, t?: Dict): BaseMessageOptions {
    if (!t) t = getT()
    const isClosed = settings.closed
    // these closeChannel stuff look just bad
    // todo: make so that isClosed variable was depended on close button instead of
    // max members, but that will require implementing close button first
    const closeChannelMessage = isClosed ? t.dashboard.openChannel() : t.dashboard.closeChannel()
    const closeChannelId = isClosed ? Emojis.unlock : Emojis.lock
    const invitesMessage = settings.disableRequests ? t.dashboard.enableRequests() : t.dashboard.disableRequests()
    const embed = new EmbedBuilder()
        .setTitle(t.dashboard.voiceChannel())
        .setColor(basicColor)
        .setDescription(
            `${t.dashboard.owner({ user: settings.owner.displayName })}

${Emojis.edit} - ${t.dashboard.rename()}.
${Emojis.bitrate} - ${t.dashboard.bitrate()}.
${Emojis.voiceLimited} - ${t.dashboard.memberLimit()}.
${closeChannelId} - ${closeChannelMessage}.
📨 - ${invitesMessage}.
${Emojis.members} - ${t.dashboard.members()}.
${Emojis.setup} - ${t.dashboard.settingSaves()}.`
        )
        .setFooter({
            text: t.dashboard.ownerText({ user: settings.owner.displayName }),
            iconURL: settings.owner.displayAvatarURL()
        })
    const rename = new ButtonBuilder()
        .setCustomId(RenameId.encode({}))
        .setEmoji(Emojis.edit)
        .setStyle(ButtonStyle.Secondary)
    const bitrate = new ButtonBuilder()
        .setCustomId(BitrateId.encode({}))
        .setEmoji(Emojis.bitrate)
        .setStyle(ButtonStyle.Secondary)
    const memberLimit = new ButtonBuilder()
        .setCustomId(MemberLimitId.encode({}))
        .setDisabled(isClosed ? true : false)
        .setEmoji(Emojis.voiceLimited)
        .setStyle(ButtonStyle.Secondary)
    const close = new ButtonBuilder()
        .setCustomId(CloseId.encode({}))
        .setEmoji(closeChannelId)
        .setStyle(isClosed ? ButtonStyle.Danger : ButtonStyle.Secondary)
    const requests = new ButtonBuilder()
        .setCustomId(InvitesId.encode({}))
        .setEmoji({ name: "📨" })
        .setStyle(ButtonStyle.Secondary)
    // todo add other buttons and compose message, then send and add actions
    const firstRow = new ActionRowBuilder<ButtonBuilder>().addComponents(rename, bitrate, memberLimit, close, requests)
    const manageMembers = new ButtonBuilder()
        .setCustomId(ManageMembersId.encode({}))
        .setEmoji(Emojis.members)
        .setStyle(ButtonStyle.Primary)
    const manageSaves = new ButtonBuilder()
        .setCustomId(StatesId.encode({}))
        .setEmoji(Emojis.setup)
        .setStyle(ButtonStyle.Primary)
    const secondRow = new ActionRowBuilder<ButtonBuilder>().addComponents(manageMembers, manageSaves)
    const deleteChannel = new ButtonBuilder()
        .setCustomId(DeleteId.encode({}))
        .setLabel(t.dashboard.delete())
        .setEmoji(Emojis.delete)
        .setStyle(ButtonStyle.Danger)
    const thirdRow = new ActionRowBuilder<ButtonBuilder>().addComponents(deleteChannel)
    return { embeds: [embed], components: [firstRow, secondRow, thirdRow] }
}
