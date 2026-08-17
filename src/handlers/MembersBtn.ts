import { ContainerBuilder, LabelBuilder, ModalBuilder, ActionRowBuilder, ButtonBuilder } from "@discordjs/builders"
import { ButtonHandler, ButtonRoute, Emojis, Gated, ModalHandler, ModalRoute } from "@seedcord/gateway"
import { ButtonStyle, ChannelType } from "discord.js"

import { database } from "../utils/base"
import { basicColor } from "../utils/consts"
import {
    BlacklistId,
    BlacklistModalId,
    KickMemberId,
    KickMemberModalId,
    ManageMembersId,
    ManagersId,
    ManagersModalId
} from "../utils/interactionIds"
import { blacklistUsers } from "../utils/misc"
import { CheckOwnerRights, CheckRights, UserNotFound } from "../utils/preconditions"

@Gated(CheckRights())
@ButtonRoute(ManageMembersId)
export class ManageMembersBtn extends ButtonHandler<[typeof ManageMembersId]> {
    public async execute(): Promise<void> {
        await this.defer()
        const kickButton = new ButtonBuilder()
            .setCustomId(KickMemberId.encode({}))
            .setEmoji(Emojis.kick)
            .setStyle(ButtonStyle.Secondary)
        const blacklistButton = new ButtonBuilder()
            .setCustomId(BlacklistId.encode({}))
            .setEmoji(Emojis.lock)
            .setStyle(ButtonStyle.Secondary)
        const managersButton = new ButtonBuilder()
            .setCustomId(ManagersId.encode({}))
            .setEmoji(Emojis.mod)
            .setStyle(ButtonStyle.Secondary)
        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            kickButton,
            blacklistButton,
            managersButton
        )
        await this.edit({
            components: [
                new ContainerBuilder().setAccentColor(basicColor).addTextDisplayComponents((builder) =>
                    builder.setContent(`## Managing members
${Emojis.kick} - Kick member
${Emojis.lock} - Manage channel's blacklist
${Emojis.mod} - Manage channel's managers
`)
                ),
                buttonRow
            ]
        })
    }
}

@Gated(CheckRights())
@ButtonRoute(KickMemberId)
export class KickMemberBtn extends ButtonHandler<[typeof KickMemberId]> {
    public async execute(): Promise<void> {
        // for reverse compatibility with Conor and
        // ease of development currently i'm going to
        // make it a modal with user id input, but
        // todo: i want it to be a select menu when channel
        // has <=25 (limit for select menus) members in future
        const channel = this.event.channel
        if (!(channel && channel.type === ChannelType.GuildVoice && channel.isVoiceBased())) return
        const modal = new ModalBuilder().setCustomId(KickMemberModalId.encode({})).setTitle("Kick member")
        const label = new LabelBuilder()
            .setLabel("Choose user")
            .setUserSelectMenuComponent((builder) =>
                builder.setCustomId("id").setMinValues(1).setMaxValues(1).setRequired(true)
            )
        modal.addLabelComponents(label)
        await this.showModal(modal)
    }
}

@Gated(CheckRights())
@ModalRoute(KickMemberModalId)
export class KickMemberModal extends ModalHandler<[typeof KickMemberModalId]> {
    public async execute(): Promise<void> {
        await this.defer()
        const channel = this.event.channel
        if (!(channel && channel.type === ChannelType.GuildVoice && channel.isVoiceBased())) return
        const user = this.event.fields.getSelectedUsers("id", true).first()
        if (!user) throw new UserNotFound()
        await channel.members.get(user.id)?.voice.setChannel(null)
        try {
            await this.edit(`kicked user`)
        } catch {}
        // if you kick yourself and you're the only member, channel will be deleted
        // so it's not guarranteed for message to be sent
    }
}

@Gated(CheckRights())
@ButtonRoute(BlacklistId)
export class BlacklistBtn extends ButtonHandler<[typeof BlacklistId]> {
    public async execute(): Promise<void> {
        const channel = this.event.channel
        if (!channel) return
        const settings = await database.findChannel(channel.id)
        const managers = Array.isArray(settings?.blacklist) ? settings.blacklist : []
        const modal = new ModalBuilder().setCustomId(BlacklistModalId.encode({})).setTitle("Manage blacklist")
        const label = new LabelBuilder()
            .setLabel("Select users")
            .setUserSelectMenuComponent((builder) =>
                builder.setCustomId("id").addDefaultUsers(managers).setMinValues(0).setMaxValues(25).setRequired(false)
            )
        modal.addLabelComponents(label)
        await this.showModal(modal)
    }
}

@Gated(CheckRights())
@ModalRoute(BlacklistModalId)
export class BlacklistModal extends ModalHandler<[typeof BlacklistModalId]> {
    public async execute(): Promise<void> {
        await this.defer()
        const users = this.event.fields.getSelectedUsers("id", false)
        const currentUsers = users?.map((user) => user.id) ?? []
        const channel = this.event.channel
        if (!(channel && channel.type === ChannelType.GuildVoice && channel.isVoiceBased())) return
        const settings = await database.findChannel(channel.id)
        if (!settings) return
        const previousUsers = Array.isArray(settings.blacklist) ? settings.blacklist : []
        await blacklistUsers(channel, previousUsers, currentUsers)
        await database.changeBlacklist(channel.id, currentUsers)
        await this.edit("success")
    }
}

@Gated(CheckOwnerRights())
@ButtonRoute(ManagersId)
export class ManageManagersBtn extends ButtonHandler<[typeof ManagersId]> {
    public async execute(): Promise<void> {
        const channel = this.event.channel
        if (!channel) return
        const settings = await database.findChannel(channel.id)
        const managers = Array.isArray(settings?.managers) ? settings.managers : []
        const modal = new ModalBuilder().setCustomId(ManagersModalId.encode({})).setTitle("Manage managers")
        const label = new LabelBuilder()
            .setLabel("Select users")
            .setUserSelectMenuComponent((builder) =>
                builder.setCustomId("id").addDefaultUsers(managers).setMinValues(0).setMaxValues(25).setRequired(false)
            )
        modal.addLabelComponents(label)
        await this.showModal(modal)
    }
}

@Gated(CheckOwnerRights())
@ModalRoute(ManagersModalId)
export class ManageManagersModal extends ModalHandler<[typeof ManagersModalId]> {
    public async execute(): Promise<void> {
        await this.defer()
        const users = this.event.fields.getSelectedUsers("id", false)
        const channel = this.event.channel
        if (!channel) return
        await database.changeManagers(channel.id, users?.map((user) => user.id) ?? [])
        await this.edit("success")
    }
}
