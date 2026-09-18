import { ActionRowBuilder, ButtonBuilder, ContainerBuilder } from "@discordjs/builders"
import { Emojis } from "@seedcord/gateway"
import { ButtonStyle, MessageFlags, SeparatorSpacingSize } from "discord.js"

import { basicColor, lavalinkEnabled } from "./consts"
import {
    AddMusicId,
    BitrateId,
    CloseId,
    DeleteId,
    DestroyMusicId,
    InvitesId,
    ManageMembersId,
    MemberLimitId,
    MusicId,
    NextMusicId,
    PauseMusicId,
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

interface MusicOptions {
    title: string
}

export function composeDashboard(settings: ChannelOptions, t?: Dict): MessageCreateOptions & MessageEditOptions {
    t ??= getT()
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
    const firstRow = new ActionRowBuilder<ButtonBuilder>().addComponents([rename, bitrate, memberLimit, close])
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
    const music = new ButtonBuilder()
        .setCustomId(MusicId.encode({}))
        .setEmoji(Emojis.play)
        .setStyle(ButtonStyle.Secondary)
    const secondRowArray: ButtonBuilder[] = [manageMembers, manageSaves, requests]
    const musicAddition = lavalinkEnabled ? `\n${Emojis.play} - ${t.dashboard.music()}.` : ""
    if (lavalinkEnabled) secondRowArray.push(music)
    const secondRow = new ActionRowBuilder<ButtonBuilder>().addComponents(secondRowArray)
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
${Emojis.requests} - ${invitesMessage}.${musicAddition}`)
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

export function composeMusicDashboard(settings: MusicOptions, t?: Dict): MessageCreateOptions & MessageEditOptions {
    t ??= getT()
    const addMusic = new ButtonBuilder()
        .setCustomId(AddMusicId.encode({}))
        .setEmoji(Emojis.play)
        .setStyle(ButtonStyle.Secondary)
    const pauseMusic = new ButtonBuilder()
        .setCustomId(PauseMusicId.encode({}))
        .setEmoji(Emojis.pause)
        .setStyle(ButtonStyle.Secondary)
    const destroyPlayer = new ButtonBuilder()
        .setCustomId(DestroyMusicId.encode({}))
        .setEmoji(Emojis.stop)
        .setStyle(ButtonStyle.Secondary)
    const nextMusic = new ButtonBuilder()
        .setCustomId(NextMusicId.encode({}))
        .setEmoji(Emojis.next)
        .setStyle(ButtonStyle.Secondary)
    const firstRow = new ActionRowBuilder<ButtonBuilder>().addComponents([pauseMusic, destroyPlayer, nextMusic])
    const container = new ContainerBuilder()
        .setAccentColor(basicColor)
        .addSectionComponents((builder) =>
            builder
                .addTextDisplayComponents((builder) => builder.setContent(`### ${settings.title}`))
                .setButtonAccessory(addMusic)
        )
        .addSeparatorComponents((builder) => builder.setSpacing(SeparatorSpacingSize.Small))
        .addActionRowComponents(firstRow)
    return { flags: MessageFlags.IsComponentsV2, components: [container] }
}
