import { ActionRowBuilder, ButtonBuilder, ContainerBuilder } from "@discordjs/builders"
import { Emojis } from "@seedcord/gateway"
import { ButtonStyle, MessageFlags, SeparatorSpacingSize } from "discord.js"

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
import type { MessageCreateOptions, MessageEditOptions, GuildMember } from "discord.js"

interface ChannelOptions {
    disableRequests: boolean
    owner: GuildMember
    closed: boolean
}

export function composeDashboard(settings: ChannelOptions, t?: Dict): MessageCreateOptions & MessageEditOptions {
    if (!t) t = getT()
    const isClosed = settings.closed
    // these closeChannel stuff look just bad
    // todo: make so that isClosed variable was depended on close button instead of
    // max members, but that will require implementing close button first
    const closeChannelMessage = isClosed ? t.dashboard.openChannel() : t.dashboard.closeChannel()
    const closeChannelId = isClosed ? Emojis.unlock : Emojis.lock
    const invitesMessage = settings.disableRequests ? t.dashboard.enableRequests() : t.dashboard.disableRequests()
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
    // todo add other buttons and compose message, then send and add actions
    const firstRow = new ActionRowBuilder<ButtonBuilder>().addComponents(rename, bitrate, memberLimit, close)
    const manageMembers = new ButtonBuilder()
        .setCustomId(ManageMembersId.encode({}))
        .setEmoji(Emojis.members)
        .setStyle(ButtonStyle.Primary)
    const manageSaves = new ButtonBuilder()
        .setCustomId(StatesId.encode({}))
        .setEmoji(Emojis.setup)
        .setStyle(ButtonStyle.Primary)
    const requests = new ButtonBuilder()
        .setCustomId(InvitesId.encode({}))
        .setEmoji(Emojis.requests)
        .setStyle(ButtonStyle.Primary)
    const secondRow = new ActionRowBuilder<ButtonBuilder>().addComponents(manageMembers, manageSaves, requests)
    const container = new ContainerBuilder()
        .setAccentColor(basicColor)
        .addTextDisplayComponents([
            (builder) => builder.setContent(`### ${t.dashboard.voiceChannel()}`),
            (builder) =>
                builder.setContent(`${Emojis.edit} - ${t.dashboard.rename()}.
${Emojis.bitrate} - ${t.dashboard.bitrate()}.
${Emojis.voiceLimited} - ${t.dashboard.memberLimit()}.
${closeChannelId} - ${closeChannelMessage}.
${Emojis.members} - ${t.dashboard.members()}.
${Emojis.setup} - ${t.dashboard.settingSaves()}.
${Emojis.requests} - ${invitesMessage}.`)
        ])
        .addSeparatorComponents((builder) => builder.setSpacing(SeparatorSpacingSize.Small))
        .addActionRowComponents(firstRow, secondRow)
        .addTextDisplayComponents((builder) =>
            builder.setContent(`-# ${t.dashboard.ownerText({ user: settings.owner.displayName })}`)
        )
    const deleteChannel = new ButtonBuilder()
        .setCustomId(DeleteId.encode({}))
        .setLabel(t.dashboard.delete())
        .setEmoji(Emojis.delete)
        .setStyle(ButtonStyle.Danger)
    const thirdRow = new ActionRowBuilder<ButtonBuilder>().addComponents(deleteChannel)
    return { flags: MessageFlags.IsComponentsV2, components: [container, thirdRow] }
}
