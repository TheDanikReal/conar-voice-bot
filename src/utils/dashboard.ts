import { ActionRowBuilder, BaseMessageOptions, ButtonBuilder, ButtonStyle, GuildMember } from "discord.js"
import { EmbedBuilder  } from "discord.js"
import { BitrateId, DeleteId, InvitesId, MemberLimitId, RenameId } from "./interactionIds"

interface ChannelOptions {
    members: number,
    disableRequests: boolean,
    owner: GuildMember
}

/** i took the original emoji code that was here before, but ig it's better to use regular seedcord
    emoji store, i remember such thing existed */
const emojis = {
    edit: "1515775509563183125",
    bitrate: "1515775525879156766",
    voiceLimited: "1515775542820081834",
    lock: "1515775559584714944",
    members: "1515775576256942170",
    setup: "1515775592937558088",
    booster: "1515775609668636832",
    play: "1515775626609688716",
    delete: "1516040157285843077"
} as const

export function composeDashboard(settings: ChannelOptions): BaseMessageOptions {
    const closeChannel = settings.members == 1 ? "Открыть канал" : "Закрыть канал"
    const embed = new EmbedBuilder()
        .setTitle("Приватный голосовой канал")
        .setColor(0x111984)
        .setDescription(`Управление: ` + settings.owner.displayName + `

<:edit:${emojis.edit}> - Переименовать канал.
<:bitrate:${emojis.bitrate}>: - Установить битрейт.
<:voiceLimited:${emojis.voiceLimited}>: - Поставить лимит по участникам.
<:lock:${emojis.lock}>: - ${closeChannel}.
📨 - Отключить запросы на вход.
<:members:${emojis.members}>: - Управление участниками.
<:setup:${emojis.setup}>: - Управление сохранениями настроек канала.
<:booster:${emojis.booster}>: - Возможности бустеров.
<:play:${emojis.play}>: - Вызвать музыкальный плеер.
${settings.members}`)
        .setFooter({
            text: "Владелец: " + settings.owner.displayName,
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
        .setEmoji(emojis.voiceLimited)
        .setStyle(ButtonStyle.Secondary)
    const close = new ButtonBuilder()
        .setCustomId("closeChannel")
        .setEmoji(emojis.lock)
        .setStyle(ButtonStyle.Secondary)
    const requests = new ButtonBuilder()
        .setCustomId(InvitesId.encode({}))
        .setEmoji("📨")
        .setStyle(ButtonStyle.Secondary)
    // todo add other buttons and compose message, then send and add actions
    const firstRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(rename, bitrate, memberLimit, close, requests)
    const manageMembers = new ButtonBuilder()
        .setCustomId("manageMembers")
        .setEmoji(emojis.members)
        .setStyle(ButtonStyle.Primary)
    const manageSaves = new ButtonBuilder()
        .setCustomId("manageSaves")
        .setEmoji(emojis.setup)
        .setStyle(ButtonStyle.Primary)
    const boosterOptions = new ButtonBuilder()
        .setCustomId("boosterOptions")
        .setEmoji(emojis.booster)
        .setStyle(ButtonStyle.Primary)
    const musicPlayer = new ButtonBuilder()
        .setCustomId("music")
        .setEmoji(emojis.play)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
    const secondRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(manageMembers, manageSaves, boosterOptions, musicPlayer)
    const deleteChannel = new ButtonBuilder()
        .setCustomId(DeleteId.encode({}))
        .setLabel("Delete")
        .setEmoji(emojis.delete)
        .setStyle(ButtonStyle.Danger)
    const thirdRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(deleteChannel)
    return { embeds: [embed], components: [firstRow, secondRow, thirdRow] }
}