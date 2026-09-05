import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders"
import {
    SlashRoute,
    SlashHandler,
    ButtonHandler,
    Gated,
    RequirePermissions,
    RequireBotPermissions,
    ButtonRoute,
    Emojis
} from "@seedcord/gateway"
import { ButtonStyle, ChannelType, MessageFlags, PermissionFlagsBits } from "discord.js"

import { database } from "../utils/base"
import { withBlocking } from "../utils/blocking"
import { FailedStatusComponent, SuccessStatusComponent } from "../utils/embeds"
import { ForceSetupId } from "../utils/interactionIds"
import { getLocale } from "../utils/misc"
import { ActionInProgress } from "../utils/preconditions"

import type { Dict } from "../generated/i18n"
import type { MessageActionRowComponentBuilder } from "@discordjs/builders"
import type { Guild } from "discord.js"

@Gated(
    RequirePermissions([PermissionFlagsBits.ManageGuild]),
    RequireBotPermissions([PermissionFlagsBits.ManageChannels])
)
@SlashRoute("setup")
export class Setup extends SlashHandler<"setup"> {
    public async execute(): Promise<void> {
        const [t] = await Promise.all([getLocale({ serverId: this.event.guildId }), this.defer({ ephemeral: false })])

        const result = await withBlocking(this.event.guildId, "setup", async () => {
            const settings = await database.findServer(this.event.guildId)

            if (settings?.voiceChannel) {
                // todo: replace label with an icon
                const forceSetupBtn = new ButtonBuilder()
                    .setLabel(t.setup.overwriteButtonLabel())
                    .setEmoji(Emojis.sync)
                    .setStyle(ButtonStyle.Danger)
                    .setCustomId(ForceSetupId.encode({}))
                const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([
                    forceSetupBtn
                ])
                await this.edit({
                    components: [
                        new FailedStatusComponent(t.setup.channelAlreadyExists()).component.addActionRowComponents(
                            actionRow
                        )
                    ]
                })
                return
            }

            const channelId = await autoSetup(this.event.guild, t)

            await this.edit({
                components: [new SuccessStatusComponent(t.setup.success({ channel: `<#${channelId}>` })).component]
            })
        })
        if (result === null) throw new ActionInProgress()
    }
}

@Gated(
    RequirePermissions([PermissionFlagsBits.ManageGuild]),
    RequireBotPermissions([PermissionFlagsBits.ManageChannels])
)
@ButtonRoute(ForceSetupId)
export class ForceSetupButton extends ButtonHandler<[typeof ForceSetupId]> {
    public async execute(): Promise<void> {
        const [t] = await Promise.all([getLocale({ serverId: this.event.guildId }), this.defer()])

        const result = await withBlocking(this.event.guildId, "setup", async () => {
            const channelId = await autoSetup(this.event.guild, t)

            await this.event.message.edit({
                flags: MessageFlags.IsComponentsV2,
                components: [new SuccessStatusComponent(t.setup.success({ channel: `<#${channelId}>` })).component]
            })

            await this.edit(t.setup.successButton())
        })
        if (result === null) throw new ActionInProgress()
    }
}

async function autoSetup(guild: Guild, t: Dict) {
    const rollbacks: (() => Promise<void>)[] = []
    try {
        const category = await guild.channels.create({
            type: ChannelType.GuildCategory,
            name: t.setup.categoryName()
        })

        rollbacks.push(async () => {
            await category.delete()
        })

        const channel = await guild.channels.create({
            type: ChannelType.GuildVoice,
            name: t.setup.creatorChannelName(),
            parent: category
        })

        rollbacks.push(async () => {
            await channel.delete()
        })

        await database.editServerIfExists({
            id: guild.id,
            voiceChannel: channel.id,
            voiceCategory: category.id,
            template: t.setup.template().replace("(", "{").replace(")", "}")
        })
        return channel.id
    } catch (err) {
        for (const rollback of rollbacks) {
            await rollback()
        }
        throw err
    }
}
