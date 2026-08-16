import { ActionRowBuilder, ContainerBuilder, ButtonBuilder } from "@discordjs/builders"
import { ButtonHandler, ButtonRoute, Gated } from "@seedcord/gateway"
import { ButtonStyle, ChannelType } from "discord.js"

import { database } from "../utils/base"
import { basicColor } from "../utils/consts"
import { LoadState, SaveState, StatesId } from "../utils/interactionIds"
import { CheckRights } from "../utils/preconditions"
import { blacklistUsers, rerenderDashboard } from "../utils/misc"

@Gated(CheckRights())
@ButtonRoute(StatesId)
export class ManageStatesBtn extends ButtonHandler<[typeof StatesId]> {
    public async execute(): Promise<void> {
        const saveButtons: ButtonBuilder[] = []
        for (let i = 0; i < 3; i++) {
            saveButtons.push(
                new ButtonBuilder()
                    .setCustomId(SaveState.encode({ slot: i }))
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(`Slot ${i + 1}`)
            )
        }
        const loadButtons: ButtonBuilder[] = []
        for (let i = 0; i < 3; i++) {
            loadButtons.push(
                new ButtonBuilder()
                    .setCustomId(LoadState.encode({ slot: i }))
                    .setStyle(ButtonStyle.Success)
                    .setLabel(`Slot ${i + 1}`)
            )
        }
        const saveRow = new ActionRowBuilder<ButtonBuilder>().addComponents(saveButtons)
        const loadRow = new ActionRowBuilder<ButtonBuilder>().addComponents(loadButtons)

        const container = new ContainerBuilder().setAccentColor(basicColor).addTextDisplayComponents((builder) =>
            builder.setContent(`## Managing saves
Here you can save/load current states in one of 3 available slots
Slot 1 is being used by default when creating new channels
Blue buttons - saving, green buttons - loading`)
        )
        this.reply({ components: [container, saveRow, loadRow] })
    }
}

// managers should be able to load and save their states as well
@Gated(CheckRights())
@ButtonRoute(SaveState)
export class SaveStateBtn extends ButtonHandler<[typeof SaveState]> {
    public async execute(): Promise<void> {
        const channel = this.event.channel
        if (!channel?.isVoiceBased()) return
        const settings = await database.findChannel(channel.id)
        if (!settings) return
        const userId = this.event.user.id
        let userSettings = await database.findUser(userId)
        if (!userSettings) {
            userSettings = await database.addUser(userId)
        }
        await this.defer()
        const blacklist = Array.isArray(settings.blacklist) ? settings.blacklist : []
        const managers = Array.isArray(settings.managers) ? settings.managers : []
        await database.updateSave(userId, {
            bitrate: channel.bitrate,
            closed: settings.closed ?? false,
            memberLimit: settings.maxMembers ?? 0,
            name: channel.name,
            requestsEnabled: settings.requests ?? true,
            slotNum: this.params.slot,
            blacklist,
            managers: managers,
            user: {
                // is this really the intended way to connect it to user? coderabbit please comment on this
                connect: { userId }
            }
        })
        this.edit(`saved state`)
    }
}

@Gated(CheckRights())
@ButtonRoute(LoadState)
export class LoadStateBtn extends ButtonHandler<[typeof LoadState]> {
    public async execute(): Promise<void> {
        const channel = this.event.channel
        if (!channel?.isVoiceBased() || !(channel.type === ChannelType.GuildVoice)) return
        await this.defer()
        const currentSettings = await database.findChannel(channel.id)
        if (!currentSettings) return
        const oldBlacklist = Array.isArray(currentSettings.blacklist) ? currentSettings.blacklist : []
        const slotSettings = await database.findSave(this.event.user.id, this.params.slot)
        if (!slotSettings) {
            await this.edit("unable to find slot settings")
            return
        }
        await channel.edit({
            bitrate: slotSettings.bitrate,
            userLimit: slotSettings.closed ? 1 : slotSettings.memberLimit,
            name: slotSettings.name
        })
        await blacklistUsers(channel, oldBlacklist, slotSettings.blacklist)
        await database.editChannel(channel.id, {
            blacklist: slotSettings.blacklist,
            closed: slotSettings.closed,
            managers: slotSettings.managers,
            maxMembers: slotSettings.memberLimit,
            requests: slotSettings.requestsEnabled
        })
        await rerenderDashboard(channel, this.event.guild)
        await this.edit(`success`)
    }
}
