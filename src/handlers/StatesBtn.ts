import { randomUUID } from "node:crypto"

import { ActionRowBuilder, ContainerBuilder, ButtonBuilder } from "@discordjs/builders"
import { ButtonHandler, ButtonRoute, Gated } from "@seedcord/gateway"
import { ButtonStyle, ChannelType } from "discord.js"

import { getT } from "../generated/i18n"
import { database } from "../utils/base"
import { basicColor } from "../utils/consts"
import { FailedStatusComponent, SuccessStatusComponent } from "../utils/embeds"
import { DeleteCurrentState, LoadState, SaveState, StatesId } from "../utils/interactionIds"
import { blacklistUsers, getLocale, rerenderDashboard } from "../utils/misc"
import { ChannelNotFound, CheckRights } from "../utils/preconditions"

import type { Dict } from "../generated/i18n"

@Gated(CheckRights())
@ButtonRoute(StatesId)
export class ManageStatesBtn extends ButtonHandler<[typeof StatesId]> {
    public async execute(): Promise<void> {
        const [channel, t] = await Promise.all([
            database.findChannel(this.event.channelId),
            getLocale({ serverId: this.event.guildId }),
            this.defer({ ephemeral: false })
        ])
        await this.edit({ components: buildRows(channel?.currentSlot ?? 0, t) })
    }
}

// managers should be able to load and save their states as well
@Gated(CheckRights())
@ButtonRoute(SaveState)
export class SaveStateBtn extends ButtonHandler<[typeof SaveState]> {
    public async execute(): Promise<void> {
        const channel = this.event.channel
        if (!channel?.isVoiceBased()) return
        const userId = this.event.user.id
        let [settings, userSettings, serverSettings, existingSave] = await Promise.all([
            database.findChannel(channel.id),
            database.findUser(userId),
            database.findServer(this.event.guildId),
            database.findSave(userId, this.params.slot),
            this.defer()
        ])
        if (!settings) throw new ChannelNotFound()
        if (!userSettings) {
            userSettings = await database.addUser(userId)
        }
        const blacklist = Array.isArray(settings.blacklist) ? settings.blacklist : []
        const managers = Array.isArray(settings.managers) ? settings.managers : []
        // looking on how this code changed with prisma 8 i now want to watch
        // gordon ramsay tbh
        await database.updateSave(userId, {
            id: existingSave?.id ?? randomUUID(),
            userId,
            bitrate: channel.bitrate,
            closed: settings.closed ?? false,
            memberLimit: settings.maxMembers ?? 0,
            name: channel.name,
            requestsEnabled: settings.requests ?? true,
            slotNum: this.params.slot,
            blacklist,
            managers
        })
        await this.edit({
            components: [new SuccessStatusComponent(getT(serverSettings?.language).states.successSave()).component]
        })
    }
}

@Gated(CheckRights())
@ButtonRoute(LoadState)
export class LoadStateBtn extends ButtonHandler<[typeof LoadState]> {
    public async execute(): Promise<void> {
        const channel = this.event.channel
        if (!channel?.isVoiceBased() || !(channel.type === ChannelType.GuildVoice)) return
        const [currentSettings, t] = await Promise.all([
            database.findChannel(channel.id),
            getLocale({ serverId: this.event.guildId }),
            this.defer()
        ])
        if (!currentSettings) return
        const oldBlacklist = Array.isArray(currentSettings.blacklist) ? currentSettings.blacklist : []
        const slotSettings = await database.findSave(this.event.user.id, this.params.slot)
        if (!slotSettings) {
            await this.edit({ components: [new FailedStatusComponent(t.states.unableToFind()).component] })
            return
        }
        const blacklist = slotSettings.blacklist ? [...slotSettings.blacklist] : []
        const managers = slotSettings.managers ? [...slotSettings.managers] : []
        await channel.edit({
            bitrate: slotSettings.bitrate ?? channel.bitrate,
            userLimit: slotSettings.closed ? 1 : (slotSettings.memberLimit ?? 0),
            name: slotSettings.name ?? channel.name
        })
        await blacklistUsers(channel, oldBlacklist, blacklist)
        await database.editChannel(channel.id, {
            blacklist,
            closed: slotSettings.closed ?? false,
            managers,
            maxMembers: slotSettings.memberLimit ?? 0,
            requests: slotSettings.requestsEnabled ?? true,
            currentSlot: this.params.slot
        })
        await rerenderDashboard(channel, this.event.guild)
        await this.edit({ components: [new SuccessStatusComponent(t.states.successLoad()).component] })
        // will throw if user deleted message
        try {
            const parentMessage = await this.event.message.fetch(true)
            await parentMessage.edit({ components: buildRows(this.params.slot, t) })
        } catch {}
    }
}

@Gated(CheckRights())
@ButtonRoute(DeleteCurrentState)
export class DeleteStateBtn extends ButtonHandler<[typeof DeleteCurrentState]> {
    public async execute(): Promise<void> {
        const userId = this.event.user.id
        const slot = this.params.slot
        const [settings, t] = await Promise.all([
            database.findSave(userId, slot),
            getLocale({ serverId: this.event.guildId }),
            this.defer()
        ])
        if (!settings) {
            await this.edit({ components: [new FailedStatusComponent(t.states.unableToFind()).component] })
            return
        }
        await database.deleteSave(userId, slot)
        await this.edit({ components: [new SuccessStatusComponent(t.states.successDelete()).component] })
    }
}

function buildRows(slot: number, t: Dict): (ContainerBuilder | ActionRowBuilder<ButtonBuilder>)[] {
    const saveButtons: ButtonBuilder[] = []
    for (let i = 0; i < 3; i++) {
        saveButtons.push(
            new ButtonBuilder()
                .setCustomId(SaveState.encode({ slot: i }))
                .setStyle(ButtonStyle.Primary)
                .setLabel(`${t.states.slot()} ${i + 1}`)
        )
    }
    const loadButtons: ButtonBuilder[] = []
    for (let i = 0; i < 3; i++) {
        loadButtons.push(
            new ButtonBuilder()
                .setCustomId(LoadState.encode({ slot: i }))
                .setStyle(i === slot ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setLabel(`${t.states.slot()} ${i + 1}`)
        )
    }
    const saveRow = new ActionRowBuilder<ButtonBuilder>().addComponents(saveButtons)
    const loadRow = new ActionRowBuilder<ButtonBuilder>().addComponents(loadButtons)
    const deleteCurrentRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(DeleteCurrentState.encode({ slot }))
            .setStyle(ButtonStyle.Danger)
            .setLabel(t.states.deleteSlot())
    )

    const container = new ContainerBuilder()
        .setAccentColor(basicColor)
        .addTextDisplayComponents((builder) => builder.setContent(t.states.manageSavesDescription()))
    return [container, saveRow, loadRow, deleteCurrentRow]
}
